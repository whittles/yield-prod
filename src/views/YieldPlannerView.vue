<template>
  <div class="max-w-5xl mx-auto px-4 py-6 space-y-6">

    <!-- Stock Boards -->
    <StockTable />

    <!-- Required Parts -->
    <PartsTable />

    <!-- Settings (collapsible) -->
    <Settings />

    <!-- Calculate button -->
    <div class="flex justify-center pt-2">
      <button
        @click="handleCalculate"
        :disabled="store.stock.length === 0 || store.parts.length === 0"
        class="px-8 py-3 bg-accent text-white font-semibold text-base rounded
               hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed
               transition-colors shadow-sm"
      >
        Calculate Cut Plan
      </button>
    </div>

    <!-- ── Results (inline, shown after calculate) ───────────────────────── -->
    <template v-if="store.results">
      <div ref="resultsAnchor" class="border-t border-border pt-6 space-y-6">

        <!-- Summary bar -->
        <ResultsSummary :summary="store.results.summary" />

        <!-- Unresolved warning -->
        <div
          v-if="store.results.unresolved.length > 0"
          class="bg-warning-bg border border-warning/30 rounded-lg p-4"
        >
          <div class="font-semibold text-warning mb-2">
            ⚠ {{ store.results.unresolved.length }} part{{ store.results.unresolved.length !== 1 ? 's' : '' }} could not be placed — insufficient stock
          </div>
          <ul class="text-sm space-y-1">
            <li v-for="p in store.results.unresolved" :key="p.instanceId" class="text-warning">
              {{ p.label }} — {{ fmt(p.length) }}" × {{ fmt(p.width) }}" × {{ fmt(p.thickness) }}"
            </li>
          </ul>
        </div>

        <!-- Per-board results -->
        <div
          v-for="result in usedResults"
          :key="result.stockPiece.id"
          class="bg-surface border border-border rounded-lg overflow-hidden"
        >
          <!-- Board header -->
          <div class="px-5 py-3 border-b border-border bg-surface-alt flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4">
            <div>
              <span class="font-semibold text-text-primary">{{ result.stockPiece.label }}</span>
              <span class="ml-2 text-sm text-text-muted">
                {{ fmt(result.stockPiece.usableLength) }}" × {{ fmt(result.stockPiece.usableWidth) }}" × {{ fmt(result.stockPiece.usableThickness) }}"
                <span class="italic">(usable after conditioning)</span>
              </span>
            </div>
            <div class="text-sm font-medium"
                 :class="result.utilization >= 70 ? 'text-success' : result.utilization >= 40 ? 'text-warning' : 'text-danger'">
              {{ result.utilization }}% yield
            </div>
          </div>

          <!-- Utilization bar -->
          <div class="px-5 pt-3 pb-1">
            <div class="w-full h-2 bg-surface-alt rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all"
                :class="result.utilization >= 70 ? 'bg-success' : result.utilization >= 40 ? 'bg-warning' : 'bg-danger'"
                :style="{ width: result.utilization + '%' }"
              ></div>
            </div>
          </div>

          <!-- SVG cut diagram -->
          <div class="px-5 py-3">
            <CutDiagram :result="result" />
          </div>

          <!-- Cut instructions -->
          <CutPlanTable :result="result" />
        </div>

        <!-- Action buttons -->
        <div class="flex gap-3 no-print pt-2">
          <button
            @click="printResults"
            class="px-5 py-2 border border-border rounded text-sm font-medium hover:bg-surface-alt transition-colors"
          >
            🖨 Print
          </button>
          <button
            @click="handleExport"
            class="px-5 py-2 border border-border rounded text-sm font-medium hover:bg-surface-alt transition-colors"
          >
            Export JSON
          </button>
        </div>

      </div>
    </template>

  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useProjectStore } from '@/stores/project'
import { exportProject, printResults as doPrint } from '@/utils/export'
import { formatFraction } from '@/utils/fractions'
import StockTable      from '@/components/StockTable.vue'
import PartsTable      from '@/components/PartsTable.vue'
import Settings        from '@/components/Settings.vue'
import ResultsSummary  from '@/components/ResultsSummary.vue'
import CutDiagram      from '@/components/CutDiagram.vue'
import CutPlanTable    from '@/components/CutPlanTable.vue'

const store = useProjectStore()
const resultsAnchor = ref(null)
const fmt = formatFraction

const usedResults = computed(() =>
  (store.results?.results ?? []).filter(r => r.cuts.length > 0)
)

async function handleCalculate() {
  store.calculate()
  await nextTick()
  resultsAnchor.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function printResults() { doPrint() }
function handleExport() { exportProject(store) }
</script>
