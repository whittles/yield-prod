/**
 * Simple open-top bin (box without lid) calculator.
 * Dado bottom joint — bottom panel sits in dado grooves in all four walls.
 */

function formatIn(val) {
  if (!val && val !== 0) return '?'
  if (val < 0.5 && val > 0) return val.toFixed(3)
  const whole = Math.floor(val)
  const rem = val - whole
  const num = Math.round(rem * 16)
  if (num === 0) return `${whole}"`
  const gcd = (a, b) => b === 0 ? a : gcd(b, a % b)
  const g = gcd(num, 16)
  const frac = `${num/g}/${16/g}`
  return whole > 0 ? `${whole} ${frac}"` : `${frac}"`
}
export { formatIn }

/**
 * Calculate all piece dimensions for a simple open-top bin.
 * Butt-joint walls, dado bottom.
 *
 * Construction:
 * - Front and back run full outer width
 * - Left and right sides fit between front and back
 * - Bottom sits in dado grooves in all four walls
 * - Dado depth = dadoDepth (default 1/4")
 *
 * @param {object} input
 * @param {string} input.mode - 'inner' | 'outer'
 * @param {number} input.width - left-to-right dimension
 * @param {number} input.depth - front-to-back dimension
 * @param {number} input.height - vertical dimension
 * @param {number} input.matThickness - plywood thickness (default 0.469 for 15/32")
 * @param {number} input.dadoDepth - depth of dado groove (default 0.25)
 * @param {number} input.qty - number of bins to cut
 */
export function calculateBin(input) {
  const { mode, width, depth, height, matThickness, dadoDepth, qty } = input

  // Derive inner/outer dimensions
  let iW, iD, iH  // inner
  let oW, oD, oH  // outer

  if (mode === 'inner') {
    iW = width; iD = depth; iH = height
    oW = iW + 2 * matThickness
    oD = iD + 2 * matThickness
    // The dado sits at the bottom of the walls, so:
    oH = iH + dadoDepth  // inner height is measured from dado floor to top of wall
  } else {
    oW = width; oD = depth; oH = height
    iW = oW - 2 * matThickness
    iD = oD - 2 * matThickness
    iH = oH - dadoDepth  // inner usable height
  }

  // Piece dimensions:
  // Front & Back: run full outer width, full outer height
  const frontBackLength = oW
  const frontBackWidth = oH

  // Left & Right: fit between front and back, full outer height
  const sideLength = oD - 2 * matThickness  // = iD
  const sideWidth = oH

  // Bottom: fits inside walls, sits in dado
  // Width of bottom = inner width (fits in dado grooves on left/right)
  // Depth of bottom = inner depth (fits in dado grooves on front/back)
  const bottomLength = iW
  const bottomDepth = iD

  const pieces = [
    {
      id: 'front',
      label: 'Front',
      qty,
      length: frontBackLength,
      width: frontBackWidth,
      notes: `Outer face. Dado ${dadoDepth}" deep × ${matThickness}" wide on inside bottom edge (for bottom panel).`,
    },
    {
      id: 'back',
      label: 'Back',
      qty,
      length: frontBackLength,
      width: frontBackWidth,
      notes: 'Same as front.',
    },
    {
      id: 'side',
      label: 'Side',
      qty: qty * 2,
      length: sideLength,
      width: sideWidth,
      notes: `Fits between front and back. Dado ${dadoDepth}" deep on inside bottom edge (for bottom panel).`,
    },
    {
      id: 'bottom',
      label: 'Bottom',
      qty,
      length: bottomLength,
      width: bottomDepth,
      notes: `Sits in dado grooves in all four walls. No glue needed — allows wood movement.`,
    },
  ]

  return {
    pieces,
    dimensions: {
      iW, iD, iH,
      oW, oD, oH,
      matThickness,
      dadoDepth,
    },
    input,
  }
}

/**
 * Generate a strip-cut plan for the bin pieces.
 * Groups pieces by their width dimension (the rip dimension).
 * Returns strips with rip width, total strip length needed, and crosscuts.
 *
 * @param {Array} pieces - from calculateBin().pieces
 * @param {number} sheetWidth - available sheet width (default 48")
 * @param {number} kerf - saw kerf (default 0.125")
 * @returns {Array} strips - [{ripWidth, items: [{label, qty, crosscutLength}], totalCrosscuts, totalLength, stripsFromSheet}]
 */
export function stripCutPlan(pieces, sheetWidth = 48, kerf = 0.125) {
  // Group pieces by their width (the rip dimension)
  // For each piece, the rip width = piece.width, crosscut length = piece.length
  // BUT — we should orient each piece so the longer dimension is the crosscut (length)
  // and the shorter dimension is the rip width. This minimises the number of rip passes.

  const groups = new Map()

  for (const piece of pieces) {
    // Orient: rip width = shorter dimension, crosscut = longer
    // Actually for bins, piece.width is the height of the wall (set by box height)
    // and piece.length is the length of the wall
    // The rip width should be piece.width (wall height)
    const ripWidth = piece.width
    const crosscutLength = piece.length
    const key = ripWidth.toFixed(4)

    if (!groups.has(key)) {
      groups.set(key, { ripWidth, items: [] })
    }
    groups.get(key).items.push({
      label: piece.label,
      qty: piece.qty,
      crosscutLength,
    })
  }

  const strips = []

  for (const [, group] of groups) {
    // Total linear inches needed from this strip width:
    // Sum of (qty × crosscutLength) + (qty - 1) × kerf per piece type + between-piece kerfs
    const totalCrosscuts = group.items.reduce((sum, it) => sum + it.qty, 0)
    const totalLength = group.items.reduce((sum, it) => sum + it.qty * it.crosscutLength, 0)
      + (totalCrosscuts - 1) * kerf  // kerf between each crosscut

    // How many strips of this width fit across the sheet?
    // (accounting for rip kerf between strips)
    const stripsFromSheet = Math.floor((sheetWidth + kerf) / (group.ripWidth + kerf))

    // How many actual strips of this width do we need?
    // Each strip is assumed to be sheetLength long (96" default), but we track total needed
    // For display, just show total length needed and let user figure out how many strips

    strips.push({
      ripWidth: group.ripWidth,
      items: group.items,
      totalCrosscuts,
      totalLength,
      stripsFromSheet,
    })
  }

  // Sort by rip width descending (cut wide strips first)
  strips.sort((a, b) => b.ripWidth - a.ripWidth)

  return strips
}
