import { formatFraction } from '@/utils/fractions';

// ─── Resaw Expansion ─────────────────────────────────────────────────────────

/**
 * Expands thick stock boards into virtual resawn slabs where beneficial.
 * Each slab is tagged with metadata so the UI can generate resaw instructions.
 *
 * @param {Array} stock - Raw stock array
 * @param {Array} parts - Parsed parts array
 * @param {Object} settings - Solver settings
 * @returns {Array} - Expanded stock array (may be same reference if no resaw)
 */
export function expandStockWithResaw(stock, parts, settings) {
  if (!settings.allowResaw) return stock;

  const kerf = settings.kerf;
  const faceAllowance = settings.resawFaceAllowance ?? 0.0625;
  const minUsableThickness = 0.5;

  // Collect all unique part thicknesses needed
  const partThicknesses = [...new Set(parts.map(p => p.thickness))];

  // Determine which thicknesses are "thin" — achievable by resawing a board into >= 2 slabs
  const thinThicknesses = new Set(
    partThicknesses.filter(T => {
      const fenceAt = T + faceAllowance;
      return stock.some(s => Math.floor(s.thickness / (fenceAt + kerf)) >= 2);
    })
  );

  // Only resaw a board if ALL parts that need this board's thickness are thin.
  // If thick parts also need full-thickness boards, keep boards intact for them.
  const thickPartsExist = parts.some(p => !thinThicknesses.has(p.thickness));

  // Count how many stock units (boards) are needed intact for thick parts
  const totalStockUnits = stock.reduce((sum, s) => sum + (s.qty || 1), 0);
  const thinPartsOnly = parts.filter(p => thinThicknesses.has(p.thickness));

  // Boards to keep intact: enough to cover thick parts
  // Heuristic: thin parts need ~1 board per 2 thin parts (since resawing yields 2 slabs per board)
  // The rest can be resawn
  const thinBoardsNeeded = Math.ceil(thinPartsOnly.reduce((s,p)=>s+p.qty,0) / 2);
  const intactBoardsNeeded = Math.max(0, totalStockUnits - thinBoardsNeeded);

  let keptIntactCount = 0;
  const expanded = [];

  for (const s of stock) {
    // Resaw is done against NOMINAL thickness — you resaw the board before
    // conditioning the faces, so condition allowance is not subtracted here.
    // Each resulting slab gets face-planed independently (handled via faceAllowance).
    const nominalThickness = s.thickness;

    // Find the best part thickness to resaw for (maximise slab count)
    let bestT = null;
    let bestSlabs = 1;

    for (const T of partThicknesses) {
      const slabFenceAt = T + faceAllowance;
      const slabs = Math.floor(nominalThickness / (slabFenceAt + kerf));
      if (slabs >= 2 && slabs > bestSlabs) {
        bestSlabs = slabs;
        bestT = T;
      }
    }

    if (bestT === null) {
      // No resaw opportunity — use as-is
      expanded.push(s);
      continue;
    }

    // If thick parts exist and we still need intact boards for them, keep this one intact
    if (thickPartsExist && keptIntactCount < intactBoardsNeeded) {
      expanded.push(s);
      keptIntactCount += (s.qty || 1);
      continue;
    }

    // Generate virtual slabs by slicing
    // thickness = bestT (the usable part thickness, after face planing)
    // resawFenceAt = bestT + faceAllowance (the actual bandsaw fence setting)
    const fenceAt = bestT + faceAllowance;
    let remaining = nominalThickness; // resaw against nominal — board hasn't been conditioned yet
    let slabIndex = 0;
    const slabs = [];

    while (remaining >= fenceAt + kerf) {
      slabs.push({
        ...s,
        qty: 1,
        id: `${s.id}-resaw-${slabIndex}`,
        label: `${s.label} (Slab ${slabIndex + 1})`,
        thickness: bestT,
        thicknessStr: bestT.toFixed(4),
        condition: 's4s', // resawn+planed face accounted for — usable thickness = bestT
        resawnFrom: s.id,
        resawnFromLabel: s.label,
        resawFenceAt: fenceAt,
        resawSlabIndex: slabIndex,
        resawTotalSlabs: 0, // filled in after loop
      });
      remaining -= fenceAt + kerf;
      slabIndex++;
    }

    // Check if remainder slab is usable
    if (remaining >= minUsableThickness) {
      slabs.push({
        ...s,
        qty: 1,
        id: `${s.id}-resaw-${slabIndex}`,
        label: `${s.label} (Slab ${slabIndex + 1} — remainder)`,
        thickness: remaining,
        thicknessStr: remaining.toFixed(4),
        condition: 'rough', // remainder face is unsawn — still rough
        resawnFrom: s.id,
        resawnFromLabel: s.label,
        resawFenceAt: fenceAt,
        resawSlabIndex: slabIndex,
        resawTotalSlabs: 0,
      });
    }

    // Fill in total slab count
    for (const sl of slabs) sl.resawTotalSlabs = slabs.length;

    expanded.push(...slabs);
  }

  return expanded;
}

/**
 * Default condition allowances (can be overridden by user settings).
 * These represent material lost to milling per condition.
 */
export const DEFAULT_CONDITION_ALLOWANCES = {
  'rough':       { thickness: 0.25,   width: 0.25  },
  'skip-planed': { thickness: 0.125,  width: 0.25  },
  's3s':         { thickness: 0.0625, width: 0.125 },
  's4s':         { thickness: 0,      width: 0     },
};

/**
 * Main solver: assigns parts to stock boards using a First Fit Decreasing
 * (FFD) bin-packing heuristic across three dimensions (thickness, width, length).
 *
 * @param {Object} input - { stock[], parts[], settings }
 * @returns {Object} - { assignments, results, instructions, unresolved, summary }
 */
export function solve(input) {
  const { stock, parts, settings } = input;

  // ─── Step 1: Expand stock by qty, compute usable dimensions ───────────────
  const stockPieces = [];
  for (const s of stock) {
    const allow = settings.conditionAllowances[s.condition] ||
                  DEFAULT_CONDITION_ALLOWANCES[s.condition] ||
                  { thickness: 0, width: 0 };

    for (let i = 0; i < (s.qty || 1); i++) {
      stockPieces.push({
        id: `${s.id}-${i}`,
        stockId: s.id,
        label: s.qty > 1 ? `${s.label} #${i + 1}` : s.label,
        nominalLength: s.length,
        nominalWidth: s.width,
        nominalThickness: s.thickness,
        condition: s.condition,
        // Usable dimensions after conditioning
        usableLength: s.length,
        usableWidth: s.width - allow.width,
        usableThickness: s.thickness - allow.thickness,
        // Free rectangles for 2D guillotine bin packing
        freeRects: [{ x: 0, y: 0, w: s.length, h: (s.width - allow.width) }],
        cuts: [],
        offcuts: [],
        // Resaw metadata (set when this piece is a virtual slab from expandStockWithResaw)
        resawnFrom:      s.resawnFrom      ?? null,
        resawnFromLabel: s.resawnFromLabel ?? null,
        resawFenceAt:    s.resawFenceAt    ?? null,
        resawTotalSlabs: s.resawTotalSlabs ?? null,
      });
    }
  }

  // ─── Step 2: Expand parts by qty, sort largest-first (FFD) ───────────────
  const partsList = [];
  for (const p of parts) {
    for (let i = 0; i < (p.qty || 1); i++) {
      partsList.push({ ...p, instanceId: `${p.id}-${i}`, instanceIndex: i });
    }
  }
  // Sort: thick parts first (so they claim full-thickness boards),
  // then within same thickness bucket sort by volume descending (FFD).
  // This ensures thin parts are placed last and naturally fall to resaw slabs.
  partsList.sort((a, b) => {
    if (Math.abs(a.thickness - b.thickness) > 0.01) {
      return b.thickness - a.thickness; // thicker first
    }
    return b.length * b.width * b.thickness - a.length * a.width * a.thickness;
  });

  // ─── Step 3: First Fit Decreasing assignment ──────────────────────────────
  const assignments = [];
  const unresolved = [];

  for (const part of partsList) {
    let placed = false;

    // For each part, try stock pieces in a preferred order:
    // resawn slabs that exactly match part thickness go first,
    // then remaining stock pieces in their normal order.
    // This ensures thin parts land on resaw slabs rather than full-thickness boards.
    const exactSlabs = stockPieces.filter(sp =>
      sp.resawnFrom && Math.abs(sp.usableThickness - part.thickness) <= 0.001
    );
    const otherPieces = stockPieces.filter(sp =>
      !(sp.resawnFrom && Math.abs(sp.usableThickness - part.thickness) <= 0.001)
    );
    const orderedPieces = [...exactSlabs, ...otherPieces];

    for (const sp of orderedPieces) {
      const thicknessFits = part.thickness <= sp.usableThickness + 0.001;
      if (!thicknessFits) continue;

      // Find first free rect that fits this part
      let bestRectIdx = -1;
      for (let ri = 0; ri < sp.freeRects.length; ri++) {
        const r = sp.freeRects[ri];
        if (part.length <= r.w + 0.001 && part.width <= r.h + 0.001) {
          bestRectIdx = ri;
          break;
        }
      }

      if (bestRectIdx === -1) continue;

      const rect = sp.freeRects[bestRectIdx];

      const cut = {
        partId: part.instanceId,
        partLabel: part.label,
        partIndex: part.instanceIndex,
        stockPieceId: sp.id,
        stockLabel: sp.label,
        needsResaw:    part.thickness < sp.usableThickness - 0.01,
        needsRip:      part.width     < rect.h - 0.01,
        needsCrosscut: part.length    < rect.w - 0.01,
        cutThickness: part.thickness,
        cutWidth:     part.width,
        cutLength:    part.length,
        wasteWidth:  rect.h - part.width  - (part.width  < rect.h - 0.01 ? settings.kerf : 0),
        wasteLength: rect.w - part.length - (part.length < rect.w - 0.01 ? settings.kerf : 0),
        xOffset: rect.x,
        yOffset: rect.y,
      };

      assignments.push(cut);
      sp.cuts.push(cut);

      // Guillotine split — remove used rect, add up to 2 remainders
      sp.freeRects.splice(bestRectIdx, 1);

      // Right remainder (same height strip, to the right of the part)
      const rightW = rect.w - part.length - settings.kerf;
      const rightH = part.width;
      if (rightW > 0.1 && rightH > 0.1) {
        sp.freeRects.push({
          x: rect.x + part.length + settings.kerf,
          y: rect.y,
          w: rightW,
          h: rightH,
        });
      }

      // Below remainder (full remaining width, below the part)
      const belowW = rect.w;
      const belowH = rect.h - part.width - settings.kerf;
      if (belowW > 0.1 && belowH > 0.1) {
        sp.freeRects.push({
          x: rect.x,
          y: rect.y + part.width + settings.kerf,
          w: belowW,
          h: belowH,
        });
      }

      placed = true;
      break;
    }

    if (!placed) unresolved.push(part);
  }

  // ─── Step 4: Calculate waste & utilization per board ─────────────────────
  const results = [];
  for (const sp of stockPieces) {
    const totalVolume = sp.usableLength * sp.usableWidth * sp.usableThickness;
    const usedVolume  = sp.cuts.reduce(
      (sum, c) => sum + c.cutLength * c.cutWidth * c.cutThickness, 0
    );
    const wastePercent = totalVolume > 0
      ? Math.round((1 - usedVolume / totalVolume) * 100)
      : 100;

    results.push({
      stockPiece: sp,
      cuts: sp.cuts,
      usedVolume,
      totalVolume,
      wastePercent,
      utilization: 100 - wastePercent,
    });
  }

  // ─── Step 5: Generate human-readable cut instructions ─────────────────────
  const instructions = [];
  for (const res of results) {
    for (const cut of res.cuts) {
      const steps = [];
      // For the first cut on a resawn slab, prepend a board-level resaw step
      if (res.stockPiece.resawnFrom && cut === res.cuts[0]) {
        const faceAllow = input.settings.resawFaceAllowance ?? 0.0625;
        steps.push(
          `RESAW first: Set bandsaw fence to ${formatFraction(res.stockPiece.resawFenceAt)}" ` +
          `(${formatFraction(res.stockPiece.resawFenceAt - faceAllow)}" part + ` +
          `${formatFraction(faceAllow)}" face allowance). ` +
          `Plane resawn face to clean up. Yields ${res.stockPiece.resawTotalSlabs} slabs from ${res.stockPiece.resawnFromLabel}.`
        );
      }
      if (cut.needsResaw) {
        const resawTarget = formatFraction(cut.cutThickness + settings.planingAllowance * 2);
        const finalThick  = formatFraction(cut.cutThickness);
        steps.push(`Resaw to ${resawTarget}" (then plane to ${finalThick}")`);
      }
      if (cut.needsRip) {
        steps.push(`Rip to ${formatFraction(cut.cutWidth)}"`);
      }
      if (cut.needsCrosscut) {
        steps.push(`Crosscut to ${formatFraction(cut.cutLength)}"`);
      }
      if (steps.length === 0) {
        steps.push('No cuts needed — use as-is');
      }

      instructions.push({
        stockLabel: res.stockPiece.label,
        partLabel: cut.partLabel,
        steps,
        finalDimensions: `${formatFraction(cut.cutLength)}" × ${formatFraction(cut.cutWidth)}" × ${formatFraction(cut.cutThickness)}"`,
      });
    }
  }

  // ─── Step 6: Summary stats ─────────────────────────────────────────────────
  const usedBoards = results.filter(r => r.cuts.length > 0);
  const overallWaste = usedBoards.length > 0
    ? Math.round(usedBoards.reduce((sum, r) => sum + r.wastePercent, 0) / usedBoards.length)
    : 0;

  return {
    assignments,
    results,
    instructions,
    unresolved,
    summary: {
      totalParts:      partsList.length,
      placedParts:     assignments.length,
      unresolvedParts: unresolved.length,
      stockUsed:       usedBoards.length,
      stockUnused:     results.filter(r => r.cuts.length === 0).length,
      overallWaste,
      resawCount: [...new Set(
        results.filter(r => r.stockPiece.resawnFrom).map(r => r.stockPiece.resawnFrom)
      )].length,
    },
  };
}

// ─── Optimized Solver ─────────────────────────────────────────────────────────

/**
 * Tries multiple board orderings and returns the result with the lowest score.
 * solve() is left completely unchanged — this is a pure wrapper.
 *
 * @param {Object} input - { stock[], parts[], settings }
 * @returns {Object} - Same shape as solve(), with extra .optimized and .orderingsTried
 */
export function solveOptimized(input) {
  const { stock, parts, settings } = input;

  // Generate candidate orderings of the ORIGINAL board list,
  // then expand each into slabs AFTER ordering — this keeps slab pairs together.
  const baseCandidates = generateCandidateOrderings(stock);

  // For each base candidate, also produce a resaw-expanded version
  // (slabs derived from that specific board order, so pairs stay adjacent)
  const allCandidates = [];
  for (const orderedBase of baseCandidates) {
    allCandidates.push(orderedBase); // non-resaw candidate
    if (settings.allowResaw) {
      const expanded = expandStockWithResaw(orderedBase, parts, settings);
      if (expanded.length !== orderedBase.length) {
        allCandidates.push(expanded); // resaw-expanded candidate
      }
    }
  }

  let best = null;
  let bestScore = Infinity;
  let orderingsTried = 0;

  for (const orderedStock of allCandidates) {
    const result = solve({ ...input, stock: orderedStock });
    const score = scoreResult(result);
    orderingsTried++;
    if (score < bestScore) {
      bestScore = score;
      best = result;
    }
  }

  best.optimized = true;
  best.orderingsTried = orderingsTried;
  best.summary.optimized = true;
  best.summary.orderingsTried = orderingsTried;
  return best;
}

function generateCandidateOrderings(stock) {
  const candidates = [];

  // Original order
  candidates.push([...stock]);

  // Sort by volume descending
  candidates.push([...stock].sort((a, b) =>
    (b.length * b.width * b.thickness) - (a.length * a.width * a.thickness)));

  // Sort by volume ascending
  candidates.push([...stock].sort((a, b) =>
    (a.length * a.width * a.thickness) - (b.length * b.width * b.thickness)));

  // Sort by width descending
  candidates.push([...stock].sort((a, b) => b.width - a.width));

  // Sort by width ascending
  candidates.push([...stock].sort((a, b) => a.width - b.width));

  if (stock.length <= 8) {
    // Full permutation search
    const perms = permutations(stock);
    for (const p of perms) candidates.push(p);
  } else {
    // Random shuffles
    for (let i = 0; i < 500; i++) {
      candidates.push(shuffle([...stock]));
    }
  }

  // Deduplicate by joining ids
  const seen = new Set();
  return candidates.filter(c => {
    const key = c.map(s => s.id).join(',');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function scoreResult(result) {
  // Primary: unresolved parts (lower is better)
  const unresolved = result.summary.unresolvedParts * 1000000;
  // Secondary: average waste % across used boards
  const usedBoards = result.results.filter(r => r.cuts.length > 0);
  const avgWaste = usedBoards.length > 0
    ? usedBoards.reduce((sum, r) => sum + r.wastePercent, 0) / usedBoards.length
    : 100;
  // Tertiary: number of boards opened
  const boardsOpened = result.summary.stockUsed * 100;
  // Quaternary: penalise part-level resaws (needsResaw on a cut) — these should
  // come from pre-resawn slabs when allowResaw is enabled, not from thick boards
  const partLevelResaws = result.assignments.filter(c => c.needsResaw).length * 500;
  return unresolved + avgWaste + boardsOpened + partLevelResaws;
}

function permutations(arr) {
  if (arr.length <= 1) return [arr];
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const perm of permutations(rest)) {
      result.push([arr[i], ...perm]);
    }
  }
  return result;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
