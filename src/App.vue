<template>
  <div class="min-h-screen flex flex-col bg-bg">

    <!-- ── Header ─────────────────────────────────────────────── -->
    <header class="bg-header text-white no-print">
      <div class="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <!-- Brand -->
        <div class="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Althoff Woodshop logo"
            class="w-10 h-10 object-contain"
          />
          <div>
            <div class="font-semibold text-base leading-tight tracking-wide">Althoff Woodshop</div>
            <div class="text-xs text-gray-400 leading-tight">Board Yield Calculator</div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-2">
          <button
            @click="handleExport"
            class="text-xs sm:text-sm px-2 sm:px-3 py-1.5 border border-white/20 rounded hover:bg-white/10 transition-colors"
            title="Export project as JSON"
          >
            <span class="hidden sm:inline">Export</span>
            <span class="sm:hidden">⬆</span>
          </button>
          <button
            @click="handleImport"
            class="text-xs sm:text-sm px-2 sm:px-3 py-1.5 border border-white/20 rounded hover:bg-white/10 transition-colors"
            title="Import project from JSON"
          >
            <span class="hidden sm:inline">Import</span>
            <span class="sm:hidden">⬇</span>
          </button>
        </div>
      </div>

      <!-- ── Tab bar ──────────────────────────────────────────── -->
      <div class="border-t border-white/10">
        <div class="max-w-5xl mx-auto px-2 flex overflow-x-auto">
          <button
            @click="goToInput"
            :class="[
              'px-3 sm:px-5 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
              activeTab === 'input'
                ? 'border-white text-white'
                : 'border-transparent text-gray-400 hover:text-white hover:border-white/40'
            ]"
          >
            Input
          </button>
          <button
            @click="goToResults"
            :disabled="!hasResults"
            :class="[
              'px-3 sm:px-5 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
              !hasResults ? 'border-transparent text-gray-600 cursor-not-allowed' :
              activeTab === 'results'
                ? 'border-white text-white'
                : 'border-transparent text-gray-400 hover:text-white hover:border-white/40'
            ]"
          >
            Results
            <span
              v-if="hasResults"
              class="ml-1.5 text-xs bg-white/20 text-white px-1.5 py-0.5 rounded-full hidden sm:inline-flex"
            >
              {{ store.results?.summary?.placedParts }}/{{ store.results?.summary?.totalParts }}
            </span>
          </button>
          <button
            @click="goToResaw"
            :class="[
              'px-3 sm:px-5 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
              activeTab === 'resaw'
                ? 'border-white text-white'
                : 'border-transparent text-gray-400 hover:text-white hover:border-white/40'
            ]"
          >
            Resaw Planner
          </button>
        </div>
      </div>
    </header>

    <!-- ── Print header (only visible on print) ───────────────── -->
    <div class="hidden"><!-- Print header handled per-view -->
    </div>

    <!-- ── Main content ───────────────────────────────────────── -->
    <main class="flex-1">
      <router-view />
    </main>

    <!-- ── Footer ─────────────────────────────────────────────── -->
    <footer class="no-print border-t border-border mt-8 py-4 text-center text-xs text-text-muted">
      © {{ new Date().getFullYear() }}
      <a href="https://althoffwoodshop.com" target="_blank" rel="noopener"
         class="hover:text-text-primary transition-colors mx-1">
        Althoff Woodshop
      </a>
      <span class="mx-2">·</span>
      Board Yield Calculator
      <span class="mx-2">·</span>
      v{{ version }}
    </footer>

  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useProjectStore } from '@/stores/project'
import { exportProject, importProject } from '@/utils/export'

const store  = useProjectStore()
const router = useRouter()
const route  = useRoute()
const version = __APP_VERSION__

// Derive active tab from URL — survives page refresh
const activeTab = computed(() => {
  if (route.path === '/resaw') return 'resaw'
  if (route.path === '/results') return 'results'
  return 'input'
})

const hasResults = computed(() => !!store.results)

function goToInput() {
  router.push('/')
}

function goToResults() {
  if (!hasResults.value) return
  router.push('/results')
}

function handleExport() {
  exportProject(store)
}

function handleImport() {
  importProject((data) => store.loadProject(data))
}

function goToResaw() {
  router.push('/resaw')
}
</script>
