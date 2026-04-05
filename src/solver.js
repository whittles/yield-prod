import { formatFraction } from '@/utils/fractions';

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
        // Remaining space (updated greedily)
        remainingLength: s.length,
        remainingWidth: s.width - allow.width,
        remainingThickness: s.thickness - allow.thickness,
        cuts: [],
        offcuts: [],
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
  partsList.sort(
    (a, b) => b.length * b.width * b.thickness - a.length * a.width * a.thickness
  );

  // ─── Step 3: First Fit Decreasing assignment ──────────────────────────────
  const assignments = [];
  const unresolved = [];

  for (const part of partsList) {
    let placed = false;

    for (const sp of stockPieces) {
      const thicknessFits = part.thickness <= sp.remainingThickness + 0.001;
      const widthFits     = part.width     <= sp.remainingWidth     + 0.001;
      const lengthFits    = part.length    <= sp.remainingLength    + 0.001;

      if (thicknessFits && widthFits && lengthFits) {
        const cut = {
          partId: part.instanceId,
          partLabel: part.label,
          partIndex: part.instanceIndex,
          stockPieceId: sp.id,
          stockLabel: sp.label,
          // Operations required
          needsResaw:    part.thickness < sp.remainingThickness - 0.01,
          needsRip:      part.width     < sp.remainingWidth     - 0.01,
          needsCrosscut: part.length    < sp.remainingLength    - 0.01,
          // Final dimensions
          cutThickness: part.thickness,
          cutWidth:     part.width,
          cutLength:    part.length,
          // Waste dimensions
          wasteWidth:  sp.remainingWidth  - part.width  - (part.width  < sp.remainingWidth  - 0.01 ? settings.kerf : 0),
          wasteLength: sp.remainingLength - part.length - (part.length < sp.remainingLength - 0.01 ? settings.kerf : 0),
          // Position along board (for SVG diagram)
          xOffset: sp.usableLength - sp.remainingLength,
          yOffset: sp.usableWidth  - sp.remainingWidth,
        };

        assignments.push(cut);
        sp.cuts.push(cut);

        // Update remaining space (strip-based greedy)
        if (cut.needsRip) {
          sp.remainingWidth -= (part.width + settings.kerf);
        }
        if (cut.needsCrosscut && !cut.needsRip) {
          sp.remainingLength -= (part.length + settings.kerf);
        }

        placed = true;
        break;
      }
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
    },
  };
}
