<template>
  <section class="bg-surface border border-border rounded-lg overflow-hidden">
    <!-- Section header -->
    <div class="px-5 py-3 border-b border-border bg-surface-alt flex items-center justify-between">
      <h2 class="font-semibold text-text-primary">Stock Boards</h2>
      <span class="text-xs text-text-muted">Available lumber</span>
    </div>

    <!-- Mobile card view (shown only on small screens) -->
    <div class="sm:hidden space-y-3 px-4 pb-4">
      <div v-for="(board, i) in store.stock" :key="board.id"
           class="border border-border rounded-lg p-3 bg-surface space-y-3">
        <!-- Row 1: Label + delete -->
        <div class="flex items-center gap-2">
          <input v-model="board.label" type="text"
                 class="flex-1 border border-border rounded px-2 py-1.5 text-sm bg-transparent text-text-primary"
                 placeholder="Board name" />
          <button @click="store.removeStock(board.id)"
                  class="text-text-muted hover:text-danger text-lg leading-none px-1">×</button>
        </div>
        <!-- Row 2: Qty + Condition -->
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-xs text-text-muted mb-1">Qty</label>
            <input v-model.number="board.qty" type="number" min="1"
                   class="w-full border border-border rounded px-2 py-1.5 text-sm bg-transparent text-text-primary" />
          </div>
          <div>
            <label class="block text-xs text-text-muted mb-1">Condition</label>
            <select v-model="board.condition"
                    class="w-full border border-border rounded px-2 py-1.5 text-sm bg-surface text-text-primary">
              <option value="rough">Rough</option>
              <option value="skip-planed">Skip Planed</option>
              <option value="s3s">S3S</option>
              <option value="s4s">S4S</option>
            </select>
          </div>
        </div>
        <!-- Row 3: Length + Width + Thickness -->
        <div class="grid grid-cols-3 gap-2">
          <div>
            <label class="block text-xs text-text-muted mb-1">Length"</label>
            <input v-model="board.lengthStr" type="text"
                   class="w-full border border-border rounded px-2 py-1.5 text-sm bg-transparent text-text-primary"
                   placeholder='96' />
          </div>
          <div>
            <label class="block text-xs text-text-muted mb-1">Width"</label>
            <input v-model="board.widthStr" type="text"
                   class="w-full border border-border rounded px-2 py-1.5 text-sm bg-transparent text-text-primary"
                   placeholder='8' />
          </div>
          <div>
            <label class="block text-xs text-text-muted mb-1">Thick"</label>
            <input v-model="board.thicknessStr" type="text"
                   class="w-full border border-border rounded px-2 py-1.5 text-sm bg-transparent text-text-primary"
                   placeholder='1 1/2' />
          </div>
        </div>
        <!-- Board Feet -->
        <div class="flex items-center justify-between text-xs text-text-muted">
          <span>Board Feet:</span>
          <span class="font-medium text-text-primary">
            {{ (() => { const v = parseFraction(board.lengthStr) * parseFraction(board.widthStr) * parseFraction(board.thicknessStr) * board.qty / 144; return (!v || isNaN(v)) ? '—' : v.toFixed(2) })() }}
          </span>
        </div>
      </div>
      <!-- Mobile total -->
      <div class="text-xs text-text-muted text-right pt-1">
        Total: <span class="font-semibold text-text-primary">{{ totalBoardFeet }} bd ft</span>
      </div>
      <!-- Add button -->
      <button @click="store.addStock()"
              class="w-full border border-dashed border-border rounded-lg py-2 text-sm text-text-muted hover:text-text-primary hover:border-accent/50 transition-colors">
        + Add Board
      </button>
    </div>

    <!-- Table -->
    <div class="hidden sm:block">
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-border text-text-muted text-xs uppercase tracking-wide">
            <th class="px-4 py-2 text-left font-medium">Label</th>
            <th class="px-3 py-2 text-center font-medium w-20">Qty</th>
            <th class="px-3 py-2 text-center font-medium w-32">Length (in)</th>
            <th class="px-3 py-2 text-center font-medium w-32">Width (in)</th>
            <th class="px-3 py-2 text-center font-medium w-32">Thickness (in)</th>
            <th class="px-3 py-2 text-center font-medium w-20">Bd Ft</th>
            <th class="px-3 py-2 text-center font-medium w-40">Condition</th>
            <th class="px-3 py-2 w-10"></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(board, i) in store.stock"
            :key="board.id"
            :class="i % 2 === 1 ? 'bg-surface-alt/60' : ''"
            class="border-b border-border/60 last:border-0"
          >
            <td class="px-4 py-1.5">
              <input
                v-model="board.label"
                type="text"
                class="w-full border border-transparent rounded px-2 py-1 text-sm
                       bg-transparent hover:border-border focus:border-accent focus:outline-none"
                placeholder="Board name"
              />
            </td>
            <td class="px-3 py-1.5">
              <input
                v-model.number="board.qty"
                type="number" min="1"
                class="w-full border border-transparent rounded px-2 py-1 text-sm text-center
                       bg-transparent hover:border-border focus:border-accent focus:outline-none"
              />
            </td>
            <td class="px-3 py-1.5">
              <input
                v-model="board.lengthStr"
                type="text"
                class="w-full border border-transparent rounded px-2 py-1 text-sm text-center
                       bg-transparent hover:border-border focus:border-accent focus:outline-none"
                placeholder='96'
              />
            </td>
            <td class="px-3 py-1.5">
              <input
                v-model="board.widthStr"
                type="text"
                class="w-full border border-transparent rounded px-2 py-1 text-sm text-center
                       bg-transparent hover:border-border focus:border-accent focus:outline-none"
                placeholder='8'
              />
            </td>
            <td class="px-3 py-1.5">
              <input
                v-model="board.thicknessStr"
                type="text"
                class="w-full border border-transparent rounded px-2 py-1 text-sm text-center
                       bg-transparent hover:border-border focus:border-accent focus:outline-none"
                placeholder='1 1/2'
              />
            </td>
            <td class="px-3 py-1.5 text-center text-sm text-text-muted">
              {{ (() => { const v = parseFraction(board.lengthStr) * parseFraction(board.widthStr) * parseFraction(board.thicknessStr) * board.qty / 144; return (!v || isNaN(v)) ? '—' : v.toFixed(2) })() }}
            </td>
            <td class="px-3 py-1.5">
              <select
                v-model="board.condition"
                class="w-full border border-transparent rounded px-2 py-1 text-sm
                       bg-transparent hover:border-border focus:border-accent focus:outline-none"
              >
                <option value="rough">Rough</option>
                <option value="skip-planed">Skip Planed</option>
                <option value="s3s">S3S</option>
                <option value="s4s">S4S</option>
              </select>
            </td>
            <td class="px-3 py-1.5 text-center">
              <button
                @click="store.removeStock(board.id)"
                class="text-text-muted hover:text-danger transition-colors text-base leading-none"
                title="Remove board"
              >×</button>
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="border-t-2 border-border font-semibold bg-surface-alt/60">
            <td class="px-4 py-2 text-right text-sm text-text-muted" colspan="5">Total</td>
            <td class="px-3 py-2 text-center text-sm text-text-primary font-bold">{{ totalBoardFeet }}</td>
            <td colspan="2"></td>
          </tr>
        </tfoot>
      </table>
    </div>
    </div>

    <!-- Add row -->
    <div class="hidden sm:block px-5 py-3 border-t border-border bg-surface-alt/40">
      <button
        @click="store.addStock()"
        class="text-sm text-accent font-medium hover:underline"
      >
        + Add Board
      </button>
    </div>

    <!-- Dimension hint -->
    <div class="px-5 pb-3 text-xs text-text-muted">
      Dimensions accept fractions: <code class="bg-surface-alt px-1 rounded">1 3/4</code> or decimals: <code class="bg-surface-alt px-1 rounded">1.75</code>. Length and width are nominal (pre-milling) inches.
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useProjectStore } from '@/stores/project'
import { parseFraction } from '@/utils/fractions'
const store = useProjectStore()

const totalBoardFeet = computed(() => {
  const total = store.stock.reduce((sum, b) => {
    const val = parseFraction(b.lengthStr) * parseFraction(b.widthStr) * parseFraction(b.thicknessStr) * (b.qty || 1) / 144
    return sum + (isNaN(val) ? 0 : val)
  }, 0)
  return total > 0 ? total.toFixed(2) : '—'
})
</script>
