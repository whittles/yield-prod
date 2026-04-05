<template>
  <div class="px-5 pb-4">
    <h3 class="text-xs font-medium text-text-muted uppercase tracking-wide mb-2">Cut Instructions</h3>
    <table class="w-full text-sm">
      <thead>
        <tr class="text-xs text-text-muted uppercase tracking-wide border-b border-border">
          <th class="text-left py-1 pr-4 font-medium w-36">Part</th>
          <th class="text-left py-1 pr-4 font-medium">Steps</th>
          <th class="text-right py-1 font-medium">Final Size</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(cut, i) in result.cuts"
          :key="cut.partId"
          :class="i % 2 === 1 ? 'bg-surface-alt/50' : ''"
          class="border-b border-border/40 last:border-0"
        >
          <td class="py-1.5 pr-4 font-medium text-text-primary align-top">
            {{ cut.partLabel }}
          </td>
          <td class="py-1.5 pr-4 text-text-muted align-top">
            <div v-if="!cut.needsResaw && !cut.needsRip && !cut.needsCrosscut" class="italic">
              Use as-is (no cuts needed)
            </div>
            <ol v-else class="list-decimal list-inside space-y-0.5">
              <li v-if="cut.needsResaw">
                Resaw to <strong>{{ fmt(cut.cutThickness + planingAllowance * 2) }}"</strong>
                → plane to <strong>{{ fmt(cut.cutThickness) }}"</strong>
              </li>
              <li v-if="cut.needsRip">
                Rip to <strong>{{ fmt(cut.cutWidth) }}"</strong>
              </li>
              <li v-if="cut.needsCrosscut">
                Crosscut to <strong>{{ fmt(cut.cutLength) }}"</strong>
              </li>
            </ol>
          </td>
          <td class="py-1.5 text-right text-text-muted font-mono text-xs align-top whitespace-nowrap">
            {{ fmt(cut.cutLength) }}" × {{ fmt(cut.cutWidth) }}" × {{ fmt(cut.cutThickness) }}"
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { useProjectStore } from '@/stores/project'
import { formatFraction } from '@/utils/fractions'

defineProps({ result: { type: Object, required: true } })

const store = useProjectStore()
const fmt   = formatFraction
const planingAllowance = store.settings.planingAllowance
</script>
