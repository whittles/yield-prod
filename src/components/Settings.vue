<template>
  <section class="bg-surface border border-border rounded-lg overflow-hidden">
    <!-- Collapsible header -->
    <button
      @click="open = !open"
      class="w-full px-5 py-3 border-b border-border bg-surface-alt flex items-center justify-between text-left"
    >
      <h2 class="font-semibold text-text-primary">Settings</h2>
      <span class="text-text-muted text-sm select-none">{{ open ? '▲' : '▼' }}</span>
    </button>

    <div v-show="open" class="px-5 py-4 space-y-6">

      <!-- Basic settings -->
      <div class="grid grid-cols-2 gap-6 sm:grid-cols-4">
        <div>
          <label class="block text-xs font-medium text-text-muted mb-1 uppercase tracking-wide">
            Saw Kerf (in)
          </label>
          <input
            v-model="kerfStr"
            type="text"
            class="w-full border border-border rounded px-3 py-1.5 text-sm
                   focus:border-accent focus:outline-none bg-surface"
            placeholder="1/8"
          />
          <p class="mt-1 text-xs text-text-light">Width of material lost per cut</p>
        </div>
        <div>
          <label class="block text-xs font-medium text-text-muted mb-1 uppercase tracking-wide">
            Planing Allow. (in)
          </label>
          <input
            v-model="planingStr"
            type="text"
            class="w-full border border-border rounded px-3 py-1.5 text-sm
                   focus:border-accent focus:outline-none bg-surface"
            placeholder="1/16"
          />
          <p class="mt-1 text-xs text-text-light">Per face, after resawing</p>
        </div>
      </div>

      <!-- Condition allowances -->
      <div>
        <h3 class="text-xs font-medium text-text-muted uppercase tracking-wide mb-2">
          Condition Allowances
          <span class="ml-2 font-normal normal-case">— material removed from nominal size during milling</span>
        </h3>
        <div class="overflow-x-auto">
          <table class="text-sm w-full">
            <thead>
              <tr class="text-xs text-text-muted uppercase tracking-wide border-b border-border">
                <th class="text-left py-1 pr-4 font-medium">Condition</th>
                <th class="text-center py-1 px-3 font-medium w-36">Thickness removed (in)</th>
                <th class="text-center py-1 px-3 font-medium w-36">Width removed (in)</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(cond, key) in store.settings.conditionAllowances"
                :key="key"
                class="border-b border-border/50 last:border-0"
              >
                <td class="py-1.5 pr-4 font-medium capitalize">{{ formatConditionName(key) }}</td>
                <td class="py-1.5 px-3 text-center">
                  <input
                    v-model.number="store.settings.conditionAllowances[key].thickness"
                    type="number" step="0.0625" min="0"
                    class="w-28 border border-border rounded px-2 py-1 text-sm text-center
                           focus:border-accent focus:outline-none bg-surface"
                  />
                </td>
                <td class="py-1.5 px-3 text-center">
                  <input
                    v-model.number="store.settings.conditionAllowances[key].width"
                    type="number" step="0.0625" min="0"
                    class="w-28 border border-border rounded px-2 py-1 text-sm text-center
                           focus:border-accent focus:outline-none bg-surface"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="mt-2 text-xs text-text-light">
          S4S means the board is already milled to final dimension — zero allowance on all sides.
        </p>
      </div>

    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useProjectStore } from '@/stores/project'
import { parseFraction, formatFraction } from '@/utils/fractions'

const store = useProjectStore()
const open  = ref(false)

const kerfStr = computed({
  get: () => formatFraction(store.settings.kerf),
  set: (v) => { store.settings.kerf = parseFraction(v) },
})

const planingStr = computed({
  get: () => formatFraction(store.settings.planingAllowance),
  set: (v) => { store.settings.planingAllowance = parseFraction(v) },
})

function formatConditionName(key) {
  const names = {
    'rough': 'Rough', 'skip-planed': 'Skip Planed',
    's3s': 'S3S', 's4s': 'S4S',
  }
  return names[key] ?? key
}
</script>
