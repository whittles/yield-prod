/**
 * Japanese sliding-lid tool box planner
 * Calculates piece dimensions and packs onto plywood sheets.
 */

function formatIn(val) {
  if (!val && val !== 0) return '?'
  if (val < 0.5 && val > 0) return val.toFixed(3)
  // Format as fraction (16ths)
  const whole = Math.floor(val)
  const rem = val - whole
  const num = Math.round(rem * 16)
  if (num === 0) return `${whole}"`
  const gcd = (a, b) => b === 0 ? a : gcd(b, a % b)
  const g = gcd(num, 16)
  const frac = `${num / g}/${16 / g}`
  return whole > 0 ? `${whole} ${frac}"` : `${frac}"`
}

export { formatIn }

/**
 * Calculate all piece dimensions for a Japanese sliding-lid tool box.
 * Supports both inner and outer dimension input.
 * Construction: single sliding lid panel, held by fixed battens nailed to end panels,
 * locked with a tapered wedge.
 */
export function calculatePieces(input) {
  const {
    mode,             // 'inner' | 'outer'
    length,           // longest dimension
    width,            // depth front-to-back
    height,           // height of box body
    matThickness,     // plywood thickness (default 0.5)
    dadoDepth,        // dado groove depth (default 0.25)
    handleHeight,     // handle strip height (default 0.75)
  } = input

  // Derive inner dimensions
  let iL, iW, iH
  if (mode === 'inner') {
    iL = length
    iW = width
    iH = height
  } else {
    // outer → inner
    iL = length - 2 * matThickness
    iW = width - 2 * matThickness
    iH = height - matThickness
  }

  // Derived outer dimensions
  const oL = iL + 2 * matThickness
  const oW = iW + 2 * matThickness
  const oH = iH + matThickness // height of carcass body (not including lid/battens)

  // Lid dimensions
  const lidClearance = 0.0625        // 1/16" clearance each side
  const lidThickness = 0.25          // 1/4" (6mm) — notably thinner than walls

  // Batten dimensions
  const battensOverlap = 0.5         // how much batten overlaps lid end (captures it)
  const battensWidth = handleHeight + battensOverlap  // batten sits on handle + overlaps lid

  const pieces = [
    {
      id: 'front',
      label: 'Front',
      qty: 1,
      length: oL,
      width: oH,
      grainDir: 'length',
      notes: `Dado ${dadoDepth}" deep on inside bottom edge (for bottom panel). Dado ${dadoDepth}" deep on inside faces at each end (for end panels). No lid runner groove needed.`,
    },
    {
      id: 'back',
      label: 'Back',
      qty: 1,
      length: oL,
      width: oH,
      grainDir: 'length',
      notes: 'Same as front.',
    },
    {
      id: 'end',
      label: 'End',
      qty: 2,
      length: oW,
      width: oH,
      grainDir: 'length',
      notes: `Dado ${dadoDepth}" deep on inside bottom edge (for bottom). Fits in dado grooves in front and back.`,
    },
    {
      id: 'bottom',
      label: 'Bottom',
      qty: 1,
      length: iL,
      width: iW,
      grainDir: 'length',
      notes: 'Sits in dado grooves in all four walls. No glue needed — allows wood movement.',
    },
    {
      id: 'lid',
      label: 'Lid Panel',
      qty: 1,
      length: iL - lidClearance * 2,
      width: iW - lidClearance * 2,
      grainDir: 'length',
      notes: `Single sliding panel. Rests on top edges of front and back. Slides lengthwise under fixed battens. Lid clearance: ${lidClearance}" each side. Thickness: ${formatIn(lidThickness)}" (thinner than walls).`,
    },
    {
      id: 'fixed-batten',
      label: 'Fixed Batten',
      qty: 2,
      length: oW,
      width: battensWidth,
      grainDir: 'length',
      notes: `Nailed to top of end panels, sits on top of handle strips. Overlaps lid panel by ~${formatIn(battensOverlap)}" each end to capture it. Handle strips must be fitted BEFORE these battens.`,
    },
    {
      id: 'handle',
      label: 'Handle/Grip Strip',
      qty: 2,
      length: oW,
      width: handleHeight,
      grainDir: 'length',
      notes: `Fitted to end panels BEFORE fixed battens. Glue first, then nail from inside. 15° bevel on inside bottom edge for grip. The fixed battens sit on top of these.`,
    },
    {
      id: 'wedge',
      label: 'Locking Wedge',
      qty: 1,
      length: oW,
      width: battensWidth,
      grainDir: 'length',
      notes: `Tapered 1:6 along the length. Drive in to lock lid, knock out to open. Cut from offcuts — no additional sheet material needed. Shown here for completeness.`,
    },
  ]

  return {
    pieces,
    dimensions: {
      iL, iW, iH,
      oL, oW, oH,
      lidLength: iL - lidClearance * 2,
      lidWidth: iW - lidClearance * 2,
      lidThickness,
      battensWidth,
      battensOverlap,
    },
    input,
  }
}

/**
 * Pack rectangular pieces onto plywood sheets using guillotine cuts.
 * Returns sheet assignments with x,y positions for SVG rendering.
 */
export function packSheets(pieces, sheetW, sheetH, kerf) {
  // Expand pieces by qty into individual items
  const items = []
  for (const p of pieces) {
    for (let i = 0; i < p.qty; i++) {
      items.push({
        ...p,
        instanceId: `${p.id}-${i}`,
        w: p.length + kerf,
        h: p.width + kerf,
      })
    }
  }

  // Sort by area descending (largest first)
  items.sort((a, b) => (b.w * b.h) - (a.w * a.h))

  const sheets = []

  function newSheet() {
    return {
      sheetIndex: sheets.length,
      placed: [],
      freeRects: [{ x: 0, y: 0, w: sheetW, h: sheetH }],
    }
  }

  function tryPlace(sheet, item) {
    for (const [iw, ih, rotated] of [
      [item.w, item.h, false],
      [item.h, item.w, true],
    ]) {
      for (let ri = 0; ri < sheet.freeRects.length; ri++) {
        const r = sheet.freeRects[ri]
        if (iw <= r.w && ih <= r.h) {
          sheet.placed.push({
            ...item,
            x: r.x,
            y: r.y,
            placedW: iw - kerf,
            placedH: ih - kerf,
            rotated,
          })
          const newRects = []
          if (r.w - iw > kerf) newRects.push({ x: r.x + iw, y: r.y, w: r.w - iw, h: ih })
          if (r.h - ih > kerf) newRects.push({ x: r.x, y: r.y + ih, w: r.w, h: r.h - ih })
          sheet.freeRects.splice(ri, 1, ...newRects)
          return true
        }
      }
    }
    return false
  }

  let currentSheet = newSheet()
  sheets.push(currentSheet)

  for (const item of items) {
    if (!tryPlace(currentSheet, item)) {
      currentSheet = newSheet()
      sheets.push(currentSheet)
      tryPlace(currentSheet, item)
    }
  }

  return sheets
}

/**
 * Pack pieces across multiple sheets of potentially different sizes.
 * Tries each sheet in order — useful for partial sheets.
 * @param {Array} pieces
 * @param {Array<{w,h}>} sheetSizes - array of available sheets in order
 * @param {number} kerf
 */
export function packMultipleSheets(pieces, sheetSizes, kerf, allowRotation = true) {
  if (!sheetSizes.length) return packSheets(pieces, 48, 96, kerf);

  // Expand pieces by qty
  const items = [];
  for (const p of pieces) {
    for (let i = 0; i < p.qty; i++) {
      items.push({ ...p, instanceId: `${p.id}-${i}`, w: p.length + kerf, h: p.width + kerf });
    }
  }
  items.sort((a, b) => (b.w * b.h) - (a.w * a.h));

  const sheets = [];
  let remaining = [...items];

  for (const size of sheetSizes) {
    if (!remaining.length) break;
    // Try to fit as many remaining items as possible on this sheet
    const sheet = {
      sheetIndex: sheets.length,
      sheetW: size.w,
      sheetH: size.h,
      placed: [],
      freeRects: [{ x: 0, y: 0, w: size.w, h: size.h }],
    };
    const stillRemaining = [];
    for (const item of remaining) {
      if (!_tryPlace(sheet, item, kerf, allowRotation)) stillRemaining.push(item);
    }
    sheets.push(sheet);
    remaining = stillRemaining;
  }

  // If anything still left, overflow onto additional full sheets (last size)
  const lastSize = sheetSizes[sheetSizes.length - 1];
  while (remaining.length) {
    const sheet = {
      sheetIndex: sheets.length,
      sheetW: lastSize.w,
      sheetH: lastSize.h,
      placed: [],
      freeRects: [{ x: 0, y: 0, w: lastSize.w, h: lastSize.h }],
    };
    const stillRemaining = [];
    for (const item of remaining) {
      if (!_tryPlace(sheet, item, kerf, allowRotation)) stillRemaining.push(item);
    }
    sheets.push(sheet);
    if (stillRemaining.length === remaining.length) break; // safety
    remaining = stillRemaining;
  }

  return sheets;
}

/**
 * Calculate the minimum bounding sheet needed to fit all pieces.
 * Uses a row-packing heuristic: sort by height desc, pack into rows
 * trying both orientations to minimise width.
 * Returns { w, h, sheet } where sheet has .placed[] for SVG rendering.
 */
/**
 * Find the minimum sheet size by trying many widths with row-packing
 * and picking the layout with smallest total area.
 */
export function minimumSheet(pieces, kerf, allowRotation = true) {
  const items = [];
  for (const p of pieces) {
    for (let i = 0; i < p.qty; i++) {
      items.push({ ...p, instanceId: `${p.id}-${i}` });
    }
  }
  items.sort((a, b) => Math.max(b.length, b.width) - Math.max(a.length, a.width));

  const maxDim = Math.max(...items.map(it => Math.max(it.length, it.width)));
  // Width range: from widest piece up to 2× widest (covers most practical cases)
  // Use finer steps for narrower widths where the optimum typically lives
  const minW = maxDim + kerf;
  const maxW = maxDim * 2 + kerf;

  let best = null;
  for (let i = 0; i <= 60; i++) {
    const trialW = minW + (maxW - minW) * (i / 60);
    const result = _rowPack(items, trialW, kerf, allowRotation);
    if (result.placed.length === items.length) {
      if (!best || result.w * result.h < best.w * best.h) best = result;
    }
  }
  return best ?? _rowPack(items, maxW, kerf, allowRotation);
}

function _rowPack(items, sheetW, kerf, allowRotation = true) {
  const placed = [];
  let curRowX = 0, curRowY = 0, curRowH = 0;

  for (const item of items) {
    let iw = item.length + kerf, ih = item.width + kerf;
    // Try rotating if doesn't fit in row
    if (curRowX + iw > sheetW + 0.001 && curRowX + ih + kerf <= sheetW + 0.001) {
      [iw, ih] = [ih, iw];
    }
    // Try rotating from scratch if wider than sheet
    if (iw > sheetW + 0.001) { [iw, ih] = [item.width + kerf, item.length + kerf]; }
    if (iw > sheetW + 0.001) continue;

    if (curRowX + iw > sheetW + 0.001) {
      curRowY += curRowH; curRowX = 0; curRowH = 0;
    }
    placed.push({ ...item, x: curRowX, y: curRowY, placedW: iw - kerf, placedH: ih - kerf });
    curRowX += iw;
    curRowH = Math.max(curRowH, ih);
  }

  const h = curRowY + curRowH;
  const usedArea = placed.reduce((s, p) => s + p.placedW * p.placedH, 0);
  return {
    w: sheetW, h, sheetW, sheetH: h,
    placed, totalItems: items.length,
    wastePct: Math.round((1 - usedArea / (sheetW * h)) * 100),
  };
}

function _tryPlace(sheet, item, kerf, allowRotation = true) {
  const orientations = allowRotation
    ? [[item.w, item.h, false], [item.h, item.w, true]]
    : [[item.w, item.h, false]]
  for (const [iw, ih, rotated] of orientations) {
    for (let ri = 0; ri < sheet.freeRects.length; ri++) {
      const r = sheet.freeRects[ri];
      if (iw <= r.w && ih <= r.h) {
        sheet.placed.push({ ...item, x: r.x, y: r.y, placedW: iw - kerf, placedH: ih - kerf, rotated });
        const newRects = [];
        if (r.w - iw > kerf) newRects.push({ x: r.x + iw, y: r.y, w: r.w - iw, h: ih });
        if (r.h - ih > kerf) newRects.push({ x: r.x, y: r.y + ih, w: r.w, h: r.h - ih });
        sheet.freeRects.splice(ri, 1, ...newRects);
        return true;
      }
    }
  }
  return false;
}
