<template>
  <div>
    <p class="text-xs text-text-muted mb-1">Board plan — length × width (view from above)</p>
    <svg
      :viewBox="`0 0 ${SVG_W} ${svgH}`"
      class="w-full rounded border border-border"
      :style="{ maxHeight: '140px' }"
      xmlns="http://www.w3.org/2000/svg"
    >
      <!-- Board background -->
      <rect x="0" y="0" :width="SVG_W" :height="svgH" fill="#f9f8f6" />

      <!-- Waste hatch pattern -->
      <defs>
        <pattern :id="hatchId" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="8" stroke="#d1cfc8" stroke-width="1.5" />
        </pattern>
      </defs>

      <!-- Waste area (whole board) -->
      <rect x="0" y="0" :width="SVG_W" :height="svgH" :fill="`url(#${hatchId})`" />

      <!-- Part rectangles -->
      <g v-for="(sc, i) in scaledCuts" :key="i">
        <rect
          :x="sc.x"
          :y="sc.y"
          :width="sc.w"
          :height="sc.h"
          :fill="PART_COLORS[i % PART_COLORS.length]"
          opacity="0.85"
        />
        <!-- Label: foreignObject for tall rects (allows wrapping), plain text for short ones -->
        <foreignObject
          v-if="sc.w > 28 && sc.h > 28"
          :x="sc.x + 2"
          :y="sc.y + 2"
          :width="sc.w - 4"
          :height="sc.h - 4"
        >
          <div xmlns="http://www.w3.org/1999/xhtml"
               style="width:100%; height:100%; display:flex; align-items:center; justify-content:center;
                      font-size:10px; font-family:Assistant,sans-serif; color:#121212;
                      text-align:center; overflow:hidden; line-height:1.2; word-break:break-word;"
          >{{ sc.label }}</div>
        </foreignObject>
        <text
          v-else-if="sc.w > 28 && sc.h > 12"
          :x="sc.x + sc.w / 2"
          :y="sc.y + sc.h / 2"
          text-anchor="middle"
          dominant-baseline="middle"
          font-size="10"
          font-family="Assistant, sans-serif"
          fill="#121212"
        >{{ sc.label }}</text>
      </g>

      <!-- Board outline -->
      <rect x="0" y="0" :width="SVG_W" :height="svgH" fill="none" stroke="#a09a8e" stroke-width="1.5" />
    </svg>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  result: { type: Object, required: true },
})

// Unique hatch pattern ID per instance to avoid SVG id collisions
const hatchId = computed(() => `hatch-${props.result?.stockPiece?.id || Math.random().toString(36).slice(2)}`)

const SVG_W = 600
const MAX_H = 140

// Part fill colours (warm, craft-workshop tones)
const PART_COLORS = [
  '#a3c4a8', // sage green
  '#a8bfd6', // dusty blue
  '#d4b896', // warm tan
  '#c4a8d4', // muted purple
  '#d4c4a8', // warm beige
  '#a8d4cc', // sage teal
  '#d4a8a8', // muted rose
  '#b8d4a8', // light sage
]

const svgH = computed(() => {
  const sp = props.result.stockPiece
  if (!sp.usableLength || !sp.usableWidth) return 60
  return Math.min(MAX_H, Math.round(SVG_W * sp.usableWidth / sp.usableLength))
})

const scaleX = computed(() => {
  const sp = props.result.stockPiece
  return sp.usableLength ? SVG_W / sp.usableLength : 1
})

const scaleY = computed(() => {
  const sp = props.result.stockPiece
  return sp.usableWidth ? svgH.value / sp.usableWidth : 1
})

const scaledCuts = computed(() => {
  return props.result.cuts.map((cut) => ({
    x: Math.round(cut.xOffset * scaleX.value),
    y: Math.round(cut.yOffset * scaleY.value),
    w: Math.max(2, Math.round(cut.cutLength * scaleX.value)),
    h: Math.max(2, Math.round(cut.cutWidth  * scaleY.value)),
    label: cut.partLabel,
  }))
})
</script>
