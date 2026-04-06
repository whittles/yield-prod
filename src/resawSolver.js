/**
 * Resaw Planner Solver
 * Calculates production yield from rough lumber → finished kumiko strips
 */

/**
 * 1D cutting stock optimizer — finds the combination of blank lengths
 * that minimizes waste from a single board.
 * Uses dynamic programming (memoized recursion).
 *
 * @param {number} boardLength - total board length in inches
 * @param {number[]} blankLengths - acceptable blank lengths, descending
 * @param {number} kerf - saw kerf per cut
 * @returns {{ cuts: [{length, qty}], totalBlanks, lengthUsed, waste, wastePct }}
 */
export function optimizeCrosscut(boardLength, blankLengths, kerf) {
  const lengths = [...blankLengths].filter(l => l > 0).sort((a, b) => b - a);
  if (!lengths.length) return { cuts: [], totalBlanks: 0, lengthUsed: 0, waste: boardLength, wastePct: 100 };

  const minLen = Math.min(...lengths);
  const cache = new Map();

  function best(remaining) {
    // Base case: nothing useful left
    if (remaining < minLen) return { cuts: [], waste: remaining };
    const key = remaining.toFixed(3);
    if (cache.has(key)) return cache.get(key);

    let bestResult = { cuts: [], waste: remaining };

    for (const len of lengths) {
      if (len > remaining + 0.001) continue;
      // Take one blank of this length, then recurse on remainder
      const afterCut = remaining - len;
      // Only subtract kerf if there's still material left for another cut
      const remainder = afterCut > minLen ? afterCut - kerf : afterCut;
      const sub = best(Math.max(0, remainder));
      const totalWaste = sub.waste + (afterCut > minLen ? 0 : afterCut - Math.max(0, remainder));

      const combined = mergeCuts([{ length: len, qty: 1 }, ...sub.cuts]);
      // True waste for this branch = remaining waste after all cuts in this subtree
      const candidateWaste = sub.waste;
      if (candidateWaste < bestResult.waste) {
        bestResult = { cuts: combined, waste: candidateWaste };
      }
    }

    cache.set(key, bestResult);
    return bestResult;
  }

  function mergeCuts(cuts) {
    const map = {};
    for (const c of cuts) map[c.length] = (map[c.length] || 0) + c.qty;
    return Object.entries(map)
      .map(([len, qty]) => ({ length: parseFloat(len), qty }))
      .sort((a, b) => b.length - a.length);
  }

  const result = best(boardLength);
  const totalBlanks = result.cuts.reduce((sum, c) => sum + c.qty, 0);
  const kerfCount = Math.max(0, totalBlanks - 1);
  const lengthUsed = result.cuts.reduce((sum, c) => sum + c.qty * c.length, 0) + kerfCount * kerf;
  const waste = boardLength - lengthUsed;

  return {
    cuts: result.cuts,
    totalBlanks,
    lengthUsed,
    waste: Math.max(0, waste),
    wastePct: Math.round((Math.max(0, waste) / boardLength) * 100),
  };
}

/**
 * Mixed strip optimizer — finds the combination of SKU strip counts per panel
 * that minimizes width waste. Bounded knapsack variant.
 *
 * @param {number} panelWidth - usable panel width in inches
 * @param {Array}  skus       - [{roughWidth, tableKerf, name, id, ...}]
 * @param {number} tableKerf  - saw kerf for all rip cuts
 * @returns {{ mix, waste, widthUsed, wastePct }}
 */
export function optimizeMixedStrips(panelWidth, skus, tableKerf) {
  if (!skus || skus.length === 0) return { mix: [], waste: panelWidth, widthUsed: 0, wastePct: 100 };

  let bestWaste = panelWidth + tableKerf; // sentinel (worse than all-waste)
  let bestMix = [];
  let iterations = 0;
  const MAX_ITER = 10000;
  let hitLimit = false;

  function tryMix(skuIndex, remaining, currentMix, totalStrips) {
    if (hitLimit) return;
    if (skuIndex === skus.length) {
      iterations++;
      if (iterations > MAX_ITER) { hitLimit = true; return; }
      // Add back last kerf (each strip was charged width+kerf, but last strip has no trailing kerf)
      const adjustedWaste = totalStrips > 0 ? remaining + tableKerf : remaining;
      if (adjustedWaste < bestWaste) {
        bestWaste = adjustedWaste;
        bestMix = currentMix.map(m => ({ ...m }));
      }
      return;
    }

    const sku = skus[skuIndex];
    const stripPlusKerf = sku.roughWidth + tableKerf;
    const maxQty = Math.floor((remaining + tableKerf) / stripPlusKerf);

    for (let qty = maxQty; qty >= 0; qty--) {
      if (hitLimit) return;
      const used = qty > 0 ? qty * stripPlusKerf : 0;
      currentMix.push({ sku, qty });
      tryMix(skuIndex + 1, remaining - used, currentMix, totalStrips + qty);
      currentMix.pop();
    }
  }

  tryMix(0, panelWidth, [], 0);

  if (hitLimit || bestMix.length === 0) {
    // Fall back to best single-SKU
    let fallbackBest = { mix: [], waste: panelWidth, widthUsed: 0, wastePct: 100 };
    for (const sku of skus) {
      const k = tableKerf;
      const n = Math.floor((panelWidth + k) / (sku.roughWidth + k));
      if (n === 0) continue;
      const used = n * sku.roughWidth + (n - 1) * k;
      const waste = panelWidth - used;
      if (waste < fallbackBest.waste) {
        fallbackBest = {
          mix: [{ sku, qty: n }],
          waste: Math.max(0, waste),
          widthUsed: used,
          wastePct: Math.round((Math.max(0, waste) / panelWidth) * 100),
        };
      }
    }
    return fallbackBest;
  }

  // Recalculate widthUsed from bestMix for the return value
  const totalStrips = bestMix.reduce((sum, m) => sum + m.qty, 0);
  const widthUsed = totalStrips > 0
    ? bestMix.reduce((sum, m) => sum + m.qty * (m.sku.roughWidth + tableKerf), 0) - tableKerf
    : 0;
  const actualWaste = panelWidth - widthUsed;

  return {
    mix: bestMix.filter(m => m.qty > 0),
    waste: Math.max(0, actualWaste),
    widthUsed: Math.max(0, widthUsed),
    wastePct: Math.round((Math.max(0, actualWaste) / panelWidth) * 100),
  };
}

export function solveResaw(input) {
  const {
    stock,            // { thickness, width, length, qty, condition }
    resawSettings,    // { kerf, slabAllowance, panelTarget }
    stripSettings,    // [{ name, roughWidth, planeAllowance, finalWidth, tableKerf, length, panelDepth? }]
    crosscutSettings, // { blankLengths: number[], miterKerf }
  } = input;

  // Step 0: Rough crosscut — mixed length optimizer
  const blankLengths = (crosscutSettings.blankLengths || [crosscutSettings.roughBlankLength])
    .filter(l => l > 0)
    .sort((a, b) => b - a);

  const snipeBuffer = crosscutSettings.snipeBuffer || 0;
  const blankTargetLengths = (crosscutSettings.blankTargetLengths || blankLengths.map(l => l - snipeBuffer))
    .filter(l => l > 0)
    .sort((a, b) => b - a);

  const crosscutPlan = optimizeCrosscut(stock.length, blankLengths, crosscutSettings.miterKerf);

  const roughCrosscut = {
    ...crosscutPlan,
    blanksPerBoard: crosscutPlan.totalBlanks,
    blanksTotal: crosscutPlan.totalBlanks * stock.qty,
    blankLengths,
    blankTargetLengths,
    snipeBuffer,
    primaryBlankLength: blankLengths[0] || 36,
  };

  // Step 1: Usable thickness after conditioning
  const conditionLoss = {
    'rough':       0.25,
    'skip-planed': 0.125,
    's3s':         0.0625,
    's4s':         0,
  };
  const usableThickness = stock.thickness - (conditionLoss[stock.condition] || 0);
  const usableWidth = stock.width;

  // Group strip settings by panel depth.
  // Each SKU can declare its own panelDepth; fallback to global resawSettings.panelTarget.
  const groupsMap = new Map();
  for (const strip of stripSettings) {
    const depth = (strip.panelDepth != null) ? strip.panelDepth : resawSettings.panelTarget;
    const key = depth.toFixed(4);
    if (!groupsMap.has(key)) groupsMap.set(key, { panelDepth: depth, strips: [] });
    groupsMap.get(key).strips.push(strip);
  }

  // Solve each group independently
  const resawGroups = [];
  for (const [, group] of groupsMap) {
    const slabThickness = group.panelDepth + resawSettings.slabAllowance;
    const slabsPerBlank = Math.floor(
      (usableThickness + resawSettings.kerf) / (slabThickness + resawSettings.kerf)
    );

    // Redistribute offcut back into slab thickness
    const rawThicknessUsed = slabsPerBlank * slabThickness + Math.max(0, slabsPerBlank - 1) * resawSettings.kerf;
    const rawOffcut = usableThickness - rawThicknessUsed;
    const extraPerSlab = slabsPerBlank > 0 ? rawOffcut / slabsPerBlank : 0;
    const optimizedSlabThickness = slabThickness + extraPerSlab;

    const thicknessUsed = slabsPerBlank * optimizedSlabThickness + Math.max(0, slabsPerBlank - 1) * resawSettings.kerf;
    const thicknessWaste = Math.max(0, usableThickness - thicknessUsed);
    const thicknessWastePct = Math.round((thicknessWaste / usableThickness) * 100);

    const stripResults = group.strips.map(strip => {
      const finishCrosscut = crosscutPlan.cuts.map(bc => {
        const piecesPerBlank = Math.floor(
          (bc.length + crosscutSettings.miterKerf) / (strip.length + crosscutSettings.miterKerf)
        );
        const kerfLoss = Math.max(0, piecesPerBlank - 1) * crosscutSettings.miterKerf;
        const waste = bc.length - piecesPerBlank * strip.length - kerfLoss;
        return {
          blankLength: bc.length,
          qty: bc.qty,
          piecesPerBlank,
          waste: Math.max(0, waste),
          snipeBuffer,
        };
      });

      const totalFinishedPiecesPerBoard = finishCrosscut.reduce(
        (sum, fc) => sum + fc.piecesPerBlank * fc.qty, 0
      );

      const stripsPerPanel = Math.floor(
        (usableWidth + strip.tableKerf) / (strip.roughWidth + strip.tableKerf)
      );
      const widthUsed = stripsPerPanel * strip.roughWidth + Math.max(0, stripsPerPanel - 1) * strip.tableKerf;
      const widthWaste = usableWidth - widthUsed;

      return {
        ...strip,
        panelDepth: group.panelDepth,  // attach resolved depth to each result
        stripsPerPanel,
        widthUsed,
        widthWaste,
        widthWastePct: Math.round((widthWaste / usableWidth) * 100),
        finishCrosscut,
        totalFinishedPiecesPerBoard,
        finishedPiecesPerBlank: finishCrosscut[0]?.piecesPerBlank ?? 0,
        finishCrosscutWaste: finishCrosscut[0]?.waste ?? 0,
        stripsPerBoard: stripsPerPanel * totalFinishedPiecesPerBoard * slabsPerBlank,
        totalStrips: stripsPerPanel * totalFinishedPiecesPerBoard * slabsPerBlank * stock.qty,
      };
    });

    const resawSequence = Array.from({ length: slabsPerBlank }, (_, i) => ({
      cutNumber: i + 1,
      slabNumber: i + 1,
      slabThickness: optimizedSlabThickness,
      panelTarget: group.panelDepth,
    }));

    resawGroups.push({
      panelDepth: group.panelDepth,
      panelDepthLabel: `${group.panelDepth}"`,
      slabThickness: optimizedSlabThickness,
      nominalSlabThickness: slabThickness,
      extraPerSlab,
      slabsPerBlank,
      slabsPerBoard: slabsPerBlank,
      stripResults,
      resawSequence,
      thicknessUsed,
      thicknessWaste,
      thicknessWastePct,
    });
  }

  // Backward compat: expose first group's fields at top level
  const firstGroup = resawGroups[0] || {};
  const allStripResults = resawGroups.flatMap(g => g.stripResults);

  // Mixed strip optimization — uses all strips across all groups
  const primaryTableKerf = stripSettings[0]?.tableKerf ?? 0.125;
  const mixedResult = optimizeMixedStrips(usableWidth, allStripResults, primaryTableKerf);

  return {
    input: { stock, resawSettings, stripSettings, crosscutSettings },
    stock: { usableThickness, usableWidth, qty: stock.qty },
    roughCrosscut,
    // Backward compat: first group's slab data
    slabs: {
      slabThickness:      firstGroup.slabThickness      ?? 0,
      nominalSlabThickness: firstGroup.nominalSlabThickness ?? 0,
      extraPerSlab:       firstGroup.extraPerSlab       ?? 0,
      slabsPerBoard:      firstGroup.slabsPerBoard      ?? 0,
      slabsPerBlank:      firstGroup.slabsPerBlank      ?? 0,
      thicknessUsed:      firstGroup.thicknessUsed      ?? 0,
      thicknessWaste:     firstGroup.thicknessWaste     ?? 0,
      thicknessWastePct:  firstGroup.thicknessWastePct  ?? 0,
    },
    stripResults: allStripResults,           // flat list for backward compat
    resawSequence: firstGroup.resawSequence || [],
    resawGroups,                              // ← NEW: per-depth groups
    mixedOptimization: mixedResult,
    summary: {
      slabsTotal: (firstGroup.slabsPerBlank ?? 0) * crosscutPlan.totalBlanks * stock.qty,
      thicknessYield: 100 - (firstGroup.thicknessWastePct ?? 0),
    },
  };
}
