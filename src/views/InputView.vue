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

  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useProjectStore } from '@/stores/project'
import StockTable from '@/components/StockTable.vue'
import PartsTable from '@/components/PartsTable.vue'
import Settings   from '@/components/Settings.vue'

const store  = useProjectStore()
const router = useRouter()

function handleCalculate() {
  store.calculate()
  router.push('/results')
}
</script>
