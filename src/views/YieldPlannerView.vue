<template>
  <div class="max-w-5xl mx-auto px-4 py-6 space-y-6">

    <!-- Stock Boards -->
    <div class="no-print">
      <StockTable />
    </div>

    <!-- Required Parts -->
    <div class="no-print">
      <PartsTable />
    </div>

    <!-- Settings (collapsible) -->
    <div class="no-print">
      <Settings />
    </div>

    <!-- Calculate button -->
    <div class="no-print flex justify-center pt-2">
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

      <!-- ── Print-only branded header ─────────────────────────────────── -->
      <div class="print-only print-no-break mb-6">
        <!-- Logo + title row -->
        <div style="display:flex; align-items:center; gap:12pt; border-bottom:2px solid #333; padding-bottom:8pt; margin-bottom:8pt;">
          <img src="/logo.png" style="width:40pt; height:40pt; object-fit:contain;" alt="Althoff Woodshop"/>
          <div>
            <div style="font-size:14pt; font-weight:700; letter-spacing:0.5pt;">ALTHOFF WOODSHOP</div>
            <div style="font-size:10pt; color:#555;">Yield Planner — Cut Sheet</div>
          </div>
          <div style="margin-left:auto; text-align:right; font-size:9pt; color:#555;">
            <div>{{ new Date().toLocaleDateString('en-US', { weekday:'short', year:'numeric', month:'short', day:'numeric' }) }}</div>
            <div>v{{ version }}</div>
          </div>
        </div>

        <!-- Stock summary table -->
        <div style="margin-bottom:8pt;">
          <div style="font-size:10pt; font-weight:600; margin-bottom:4pt;">Stock Boards Used</div>
          <table style="width:100%; border-collapse:collapse; font-size:10pt;">
            <thead>
              <tr style="background:#f0f0f0;">
                <th style="border:1px solid #ccc; padding:4pt 6pt; text-align:left;">Board</th>
                <th style="border:1px solid #ccc; padding:4pt 6pt; text-align:left;">Qty</th>
                <th style="border:1px solid #ccc; padding:4pt 6pt; text-align:left;">Dimensions (L × W × T)</th>
                <th style="border:1px solid #ccc; padding:4pt 6pt; text-align:left;">Condition</th>
                <th style="border:1px solid #ccc; padding:4pt 6pt; text-align:right;">Board Feet</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in usedStockEntries" :key="s.id">
                <td style="border:1px solid #ccc; padding:4pt 6pt; font-weight:bold;">{{ s.label }}</td>
                <td style="border:1px solid #ccc; padding:4pt 6pt;">{{ s.qty }}</td>
                <td style="border:1px solid #ccc; padding:4pt 6pt; font-family:monospace;">{{ s.lengthStr }}" × {{ s.widthStr }}" × {{ s.thicknessStr }}"</td>
                <td style="border:1px solid #ccc; padding:4pt 6pt; text-transform:capitalize;">{{ s.condition }}</td>
                <td style="border:1px solid #ccc; padding:4pt 6pt; text-align:right; font-family:monospace;">{{ stockBoardFeet(s) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Parts summary table -->
        <div style="margin-bottom:8pt;">
          <div style="font-size:10pt; font-weight:600; margin-bottom:4pt;">Required Parts</div>
          <table style="width:100%; border-collapse:collapse; font-size:10pt;">
            <thead>
              <tr style="background:#f0f0f0;">
                <th style="border:1px solid #ccc; padding:4pt 6pt; text-align:left;">Part</th>
                <th style="border:1px solid #ccc; padding:4pt 6pt; text-align:left;">Qty</th>
                <th style="border:1px solid #ccc; padding:4pt 6pt; text-align:left;">Dimensions (L × W × T)</th>
                <th style="border:1px solid #ccc; padding:4pt 6pt; text-align:right;">Board Feet</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in store.parts" :key="p.id">
                <td style="border:1px solid #ccc; padding:4pt 6pt; font-weight:bold;">{{ p.label }}</td>
                <td style="border:1px solid #ccc; padding:4pt 6pt;">{{ p.qty }}</td>
                <td style="border:1px solid #ccc; padding:4pt 6pt; font-family:monospace;">{{ p.lengthStr }}" × {{ p.widthStr }}" × {{ p.thicknessStr }}"</td>
                <td style="border:1px solid #ccc; padding:4pt 6pt; text-align:right; font-family:monospace;">{{ partBoardFeet(p) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Results summary -->
        <table style="width:100%; border-collapse:collapse; font-size:10pt;">
          <thead>
            <tr style="background:#f0f0f0;">
              <th style="border:1px solid #ccc; padding:4pt 6pt; text-align:left;">Parts Placed</th>
              <th style="border:1px solid #ccc; padding:4pt 6pt; text-align:left;">Boards Used</th>
              <th style="border:1px solid #ccc; padding:4pt 6pt; text-align:left;">Avg Waste</th>
              <th style="border:1px solid #ccc; padding:4pt 6pt; text-align:left;">Avg Yield</th>
              <th v-if="store.results.optimized" style="border:1px solid #ccc; padding:4pt 6pt; text-align:left;">Optimization</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border:1px solid #ccc; padding:4pt 6pt; font-weight:bold;">{{ store.results.summary.placedParts }} / {{ store.results.summary.totalParts }}</td>
              <td style="border:1px solid #ccc; padding:4pt 6pt; font-weight:bold;">{{ store.results.summary.stockUsed }}</td>
              <td style="border:1px solid #ccc; padding:4pt 6pt;">{{ store.results.summary.overallWaste }}%</td>
              <td style="border:1px solid #ccc; padding:4pt 6pt;">{{ 100 - store.results.summary.overallWaste }}%</td>
              <td v-if="store.results.optimized" style="border:1px solid #ccc; padding:4pt 6pt;">Optimized across {{ store.results.orderingsTried }} orderings</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Screen results anchor -->
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
          <!-- Print-only board heading -->
          <div class="print-only" style="font-size:11pt; font-weight:700; padding:6pt 0 4pt 0; border-bottom:1px solid #ccc; margin-bottom:4pt;">
            Board: {{ result.stockPiece.label }} — {{ fmt(result.stockPiece.usableLength) }}" × {{ fmt(result.stockPiece.usableWidth) }}" × {{ fmt(result.stockPiece.usableThickness) }}" usable
          </div>

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

          <!-- Utilization bar (screen only) -->
          <div class="no-print px-5 pt-3 pb-1">
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

        <!-- Action buttons (screen only) -->
        <div class="no-print flex gap-3 pt-2">
          <button
            @click="handleExport"
            class="px-5 py-2 border border-border rounded text-sm font-medium hover:bg-surface-alt transition-colors"
          >
            Export JSON
          </button>
        </div>

      </div>
    </template>

    <!-- ── FAB: Print Sheet ───────────────────────────────────────────── -->
    <Teleport to="body">
      <button
        v-if="store.results"
        @click="printResults"
        class="no-print fixed bottom-6 right-6 z-50
               flex items-center gap-2
               bg-accent hover:bg-indigo-600 active:bg-indigo-700
               text-white font-semibold
               px-5 py-3 rounded-full
               shadow-lg
               transition-all duration-150
               text-sm"
        aria-label="Print cut plan"
      >
        🖨 <span class="hidden sm:inline">Print Sheet</span>
      </button>
    </Teleport>

  </div>

  <!-- Print footer — appears at the bottom of every printed page -->
  <div class="print-only print-footer">
    www.althoffwoodshop.com
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useProjectStore } from '@/stores/project'
import { exportProject } from '@/utils/export'
import { formatFraction, parseFraction } from '@/utils/fractions'
import StockTable      from '@/components/StockTable.vue'
import PartsTable      from '@/components/PartsTable.vue'
import Settings        from '@/components/Settings.vue'
import ResultsSummary  from '@/components/ResultsSummary.vue'
import CutDiagram      from '@/components/CutDiagram.vue'
import CutPlanTable    from '@/components/CutPlanTable.vue'

const store = useProjectStore()
const resultsAnchor = ref(null)
const fmt = formatFraction
const version = __APP_VERSION__

const usedResults = computed(() =>
  (store.results?.results ?? []).filter(r => r.cuts.length > 0)
)

// Stock entries whose pieces appear in the results (have cuts)
const usedStockEntries = computed(() => {
  if (!store.results) return []
  const usedStockIds = new Set(usedResults.value.map(r => r.stockPiece.stockId))
  return store.stock.filter(s => usedStockIds.has(s.id))
})

function stockBoardFeet(s) {
  const l = parseFraction(s.lengthStr)
  const w = parseFraction(s.widthStr)
  const t = parseFraction(s.thicknessStr)
  const bf = (l * w * t * (s.qty || 1)) / 144
  return bf.toFixed(2) + ' bf'
}

function partBoardFeet(p) {
  const l = parseFraction(p.lengthStr)
  const w = parseFraction(p.widthStr)
  const t = parseFraction(p.thicknessStr)
  const bf = (l * w * t * (p.qty || 1)) / 144
  return bf.toFixed(2) + ' bf'
}

async function handleCalculate() {
  store.calculate()
  await nextTick()
  resultsAnchor.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function printResults() { window.print() }
function handleExport() { exportProject(store) }
</script>
