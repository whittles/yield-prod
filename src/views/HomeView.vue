<template>
  <div class="max-w-4xl mx-auto px-4 py-10 space-y-10">

    <!-- Hero -->
    <div class="text-center space-y-3">
      <h1 class="text-3xl font-bold text-text-primary">Woodworking Calculators</h1>
      <p class="text-text-muted text-base max-w-xl mx-auto">
        Free tools for woodworkers. No login, no account — just enter your dimensions and get a cut plan.
      </p>
      <p class="text-xs text-text-muted">
        By <a href="https://althoffwoodshop.com" target="_blank" rel="noopener" class="hover:text-text-primary transition-colors underline">Althoff Woodshop</a>
      </p>
    </div>

    <!-- Tool cards grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

      <!-- Board Yield Planner -->
      <button @click="$router.push('/')"
        class="text-left bg-surface border border-border rounded-xl p-5 hover:border-accent/50 hover:bg-surface/80 transition-all group">
        <div class="text-2xl mb-3">📐</div>
        <h2 class="text-base font-semibold text-text-primary mb-1 group-hover:text-accent transition-colors">Board Yield Planner</h2>
        <p class="text-xs text-text-muted leading-relaxed">
          Have lumber, need parts. Enter your available boards and the parts you need — it finds the most efficient cuts with minimal waste. Shows a visual cut diagram and step-by-step instructions.
        </p>
        <div class="mt-3 text-xs text-accent font-medium">Open →</div>
      </button>

      <!-- Resaw Planner -->
      <button @click="$router.push('/resaw')"
        class="text-left bg-surface border border-border rounded-xl p-5 hover:border-accent/50 hover:bg-surface/80 transition-all group">
        <div class="text-2xl mb-3">🪵</div>
        <h2 class="text-base font-semibold text-text-primary mb-1 group-hover:text-accent transition-colors">Resaw Planner</h2>
        <p class="text-xs text-text-muted leading-relaxed">
          Built for kumiko strip production. Enter your rough stock and target strip dimensions — it calculates the full milling sequence: crosscuts, bandsaw fence settings, drum sanding targets, table saw rips, and total strip yield.
        </p>
        <div class="mt-3 text-xs text-accent font-medium">Open →</div>
      </button>

      <!-- Box Planner -->
      <button @click="$router.push('/bin')"
        class="text-left bg-surface border border-border rounded-xl p-5 hover:border-accent/50 hover:bg-surface/80 transition-all group">
        <div class="text-2xl mb-3">📦</div>
        <h2 class="text-base font-semibold text-text-primary mb-1 group-hover:text-accent transition-colors">Box Planner</h2>
        <p class="text-xs text-text-muted leading-relaxed">
          Simple open-top storage bin with a dado bottom. Enter inner or outer dimensions and quantity — get a complete cut list and optimised sheet layout showing the minimum stock needed.
        </p>
        <div class="mt-3 text-xs text-accent font-medium">Open →</div>
      </button></div>

    <!-- Beta notice -->
    <div class="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800">
      ⚠️ <strong>Beta:</strong> These tools are actively being developed. Results are algorithmically generated — always verify dimensions and cut plans before cutting. <a href="https://althoffwoodshop.com/pages/contact" target="_blank" rel="noopener" class="underline hover:opacity-80">Send feedback →</a>
    </div>

    <!-- Quick tips -->
    <div class="bg-surface border border-border rounded-xl p-5 space-y-3">
      <h2 class="text-sm font-semibold text-text-primary">Quick tips</h2>
      <ul class="space-y-2 text-xs text-text-muted">
        <li class="flex items-start gap-2"><span class="text-accent mt-0.5">→</span> All dimension inputs accept fractions — type <span class="font-mono bg-bg px-1 rounded">1 3/4</span> or <span class="font-mono bg-bg px-1 rounded">1.75</span></li>
        <li class="flex items-start gap-2"><span class="text-accent mt-0.5">→</span> Use the Print button to get a shop-ready sheet you can hang at the machine</li>
        <li class="flex items-start gap-2"><span class="text-accent mt-0.5">→</span> Export your inputs as JSON to save and reload a project later</li>
        <li class="flex items-start gap-2"><span class="text-accent mt-0.5">→</span> Nominal ½" plywood is typically 15/32" (0.469") — measure your actual sheet</li>
      </ul>
    </div>

    <!-- Feedback nudge -->
    <p class="text-center text-xs text-text-muted">
      Found a bug or have a suggestion?
      <a href="https://althoffwoodshop.com/pages/contact" target="_blank" rel="noopener"
         class="text-accent hover:opacity-80 transition-opacity ml-1">Send feedback →</a>
    </p>

  </div>
</template>

<script setup>
// No logic needed — all navigation via router
</script>
