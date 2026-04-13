<template>
  <div class="min-h-screen flex flex-col bg-bg">

    <!-- ── Header ─────────────────────────────────────────────── -->
    <header class="bg-header text-white no-print">
      <div class="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <!-- Brand -->
        <a href="https://althoffwoodshop.com" class="flex items-center gap-3 no-underline hover:opacity-80 transition-opacity">
          <img
            src="/logo.png"
            alt="Althoff Woodshop logo"
            class="w-10 h-10 object-contain"
          />
          <div>
            <div class="font-semibold text-base leading-tight tracking-wide">Althoff Woodshop</div>
            <div class="text-xs text-gray-400 leading-tight">Board Yield Calculator</div>
          </div>
        </a>

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
            @click="router.push('/home')"
            :class="[
              'px-3 sm:px-5 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
              activeTab === 'home'
                ? 'border-white text-white'
                : 'border-transparent text-gray-400 hover:text-white hover:border-white/40'
            ]"
          >
            Home
          </button>
          <button
            @click="router.push('/')"
            :class="[
              'px-3 sm:px-5 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
              activeTab === 'yield'
                ? 'border-white text-white'
                : 'border-transparent text-gray-400 hover:text-white hover:border-white/40'
            ]"
          >
            Yield Planner
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
          <button
            @click="router.push('/bin')"
            :class="[
              'px-3 sm:px-5 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
              activeTab === 'bin'
                ? 'border-white text-white'
                : 'border-transparent text-gray-400 hover:text-white hover:border-white/40'
            ]"
          >
            Box Planner
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
      <span class="mx-2">·</span>
      <a href="https://althoffwoodshop.com/pages/contact" target="_blank" rel="noopener"
         class="hover:text-text-primary transition-colors">
        Feedback
      </a>
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
  if (route.path === '/home') return 'home'
  if (route.path === '/resaw') return 'resaw'
  if (route.path === '/bin') return 'bin'
  return 'yield'
})

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
