<template>
  <section class="bg-surface border border-border rounded-lg overflow-hidden">
    <!-- Section header -->
    <div class="px-5 py-3 border-b border-border bg-surface-alt flex items-center justify-between">
      <h2 class="font-semibold text-text-primary">Required Parts</h2>
      <span class="text-xs text-text-muted">Finished dimensions</span>
    </div>

    <!-- Mobile card view (shown only on small screens) -->
    <div class="sm:hidden space-y-3 px-4 pb-4">
      <div v-for="(part, i) in store.parts" :key="part.id"
           class="border border-border rounded-lg p-3 bg-surface space-y-3">
        <div class="flex items-center gap-2">
          <input v-model="part.label" type="text"
                 class="flex-1 border border-border rounded px-2 py-1.5 text-sm bg-transparent text-text-primary"
                 placeholder="Part name" />
          <button @click="store.removePart(part.id)"
                  class="text-text-muted hover:text-danger text-lg leading-none px-1">×</button>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-xs text-text-muted mb-1">Qty</label>
            <input v-model.number="part.qty" type="number" min="1"
                   class="w-full border border-border rounded px-2 py-1.5 text-sm bg-transparent text-text-primary" />
          </div>
          <div>
            <label class="block text-xs text-text-muted mb-1">Length"</label>
            <input v-model="part.lengthStr" type="text"
                   class="w-full border border-border rounded px-2 py-1.5 text-sm bg-transparent text-text-primary" placeholder="24" />
          </div>
          <div>
            <label class="block text-xs text-text-muted mb-1">Width"</label>
            <input v-model="part.widthStr" type="text"
                   class="w-full border border-border rounded px-2 py-1.5 text-sm bg-transparent text-text-primary" placeholder="3" />
          </div>
          <div>
            <label class="block text-xs text-text-muted mb-1">Thickness"</label>
            <input v-model="part.thicknessStr" type="text"
                   class="w-full border border-border rounded px-2 py-1.5 text-sm bg-transparent text-text-primary" placeholder="3/4" />
          </div>
        </div>
      </div>
      <button @click="store.addPart()"
              class="w-full border border-dashed border-border rounded-lg py-2 text-sm text-text-muted hover:text-text-primary hover:border-accent/50 transition-colors">
        + Add Part
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
            <th class="px-3 py-2 w-10"></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(part, i) in store.parts"
            :key="part.id"
            :class="i % 2 === 1 ? 'bg-surface-alt/60' : ''"
            class="border-b border-border/60 last:border-0"
          >
            <td class="px-4 py-1.5">
              <input
                v-model="part.label"
                type="text"
                class="w-full border border-transparent rounded px-2 py-1 text-sm
                       bg-transparent hover:border-border focus:border-accent focus:outline-none"
                placeholder="Part name"
              />
            </td>
            <td class="px-3 py-1.5">
              <input
                v-model.number="part.qty"
                type="number" min="1"
                class="w-full border border-transparent rounded px-2 py-1 text-sm text-center
                       bg-transparent hover:border-border focus:border-accent focus:outline-none"
              />
            </td>
            <td class="px-3 py-1.5">
              <input
                v-model="part.lengthStr"
                type="text"
                class="w-full border border-transparent rounded px-2 py-1 text-sm text-center
                       bg-transparent hover:border-border focus:border-accent focus:outline-none"
                placeholder='24'
              />
            </td>
            <td class="px-3 py-1.5">
              <input
                v-model="part.widthStr"
                type="text"
                class="w-full border border-transparent rounded px-2 py-1 text-sm text-center
                       bg-transparent hover:border-border focus:border-accent focus:outline-none"
                placeholder='3'
              />
            </td>
            <td class="px-3 py-1.5">
              <input
                v-model="part.thicknessStr"
                type="text"
                class="w-full border border-transparent rounded px-2 py-1 text-sm text-center
                       bg-transparent hover:border-border focus:border-accent focus:outline-none"
                placeholder='3/4'
              />
            </td>
            <td class="px-3 py-1.5 text-center">
              <button
                @click="store.removePart(part.id)"
                class="text-text-muted hover:text-danger transition-colors text-base leading-none"
                title="Remove part"
              >×</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    </div>

    <!-- Add row -->
    <div class="hidden sm:block px-5 py-3 border-t border-border bg-surface-alt/40">
      <button
        @click="store.addPart()"
        class="text-sm text-accent font-medium hover:underline"
      >
        + Add Part
      </button>
    </div>

    <!-- Hint -->
    <div class="px-5 pb-3 text-xs text-text-muted">
      These are <strong>finished dimensions</strong> — the size the part must be after all milling. The solver accounts for kerf and planing allowances automatically.
    </div>
  </section>
</template>

<script setup>
import { useProjectStore } from '@/stores/project'
const store = useProjectStore()
</script>
