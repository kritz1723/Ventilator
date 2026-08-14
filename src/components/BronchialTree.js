// Generates a bronchial tree by recursive bifurcation.
//
// Drawing the airway as a handful of fixed strokes gives a lung that looks
// like a diagram of a lung. Generating it produces the branching structure
// itself — a parent dividing into two smaller daughters, each turning away
// from the parent axis, repeating until the branches are too fine to draw.
// That is what makes the picture read as an airway rather than as decoration.
//
// The generator is deterministic: the same seed yields the same tree, so the
// illustration is stable across renders instead of writhing every frame.

function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Each generation is shorter and narrower than its parent. The ratios are
// loosely those of a real airway tree, where calibre falls faster than length.
const LENGTH_RATIO = 0.76
const WIDTH_RATIO = 0.72

export function generateTree({
  x, y, angle, length, width, depth, seed = 1, spread = 0.42,
}) {
  const rand = mulberry32(seed)
  const branches = []

  const walk = (bx, by, bAngle, bLength, bWidth, level) => {
    if (level <= 0 || bLength < 2) return

    // A slight curve on each segment; a perfectly straight airway looks drawn
    // rather than grown.
    const bend = (rand() - 0.5) * 0.25
    const midAngle = bAngle + bend * 0.5
    const ex = bx + Math.cos(bAngle) * bLength
    const ey = by + Math.sin(bAngle) * bLength
    const cx = bx + Math.cos(midAngle) * bLength * 0.55
    const cy = by + Math.sin(midAngle) * bLength * 0.55

    branches.push({
      d: `M ${bx.toFixed(1)} ${by.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`,
      width: bWidth,
      level,
    })

    // Asymmetric division: real daughters are rarely equal, and the asymmetry
    // is what stops the tree looking like a fractal ornament.
    const skew = 0.75 + rand() * 0.5
    const nextLength = bLength * LENGTH_RATIO
    const nextWidth = bWidth * WIDTH_RATIO

    walk(ex, ey, bAngle - spread * skew, nextLength * skew, nextWidth, level - 1)
    walk(ex, ey, bAngle + spread / skew, nextLength / skew, nextWidth, level - 1)
  }

  walk(x, y, angle, length, width, depth)
  return branches
}

// Terminal points of the finest branches, used to place the alveolar glow so
// it sits where gas exchange actually happens rather than scattered at random.
export function terminals(branches, minLevel = 1) {
  return branches
    .filter((b) => b.level === minLevel)
    .map((b) => {
      const parts = b.d.split(' ')
      return { x: Number(parts[parts.length - 2]), y: Number(parts[parts.length - 1]) }
    })
}
