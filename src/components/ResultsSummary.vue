<template>
  <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
    <div class="bg-surface border border-border rounded-lg px-4 py-3">
      <div class="text-xs text-text-muted uppercase tracking-wide mb-1">Parts Placed</div>
      <div class="text-2xl font-bold text-text-primary leading-none">
        {{ summary.placedParts }}
        <span class="text-sm font-normal text-text-muted">/ {{ summary.totalParts }}</span>
      </div>
    </div>

    <div class="bg-surface border border-border rounded-lg px-4 py-3">
      <div class="text-xs text-text-muted uppercase tracking-wide mb-1">Boards Used</div>
      <div class="text-2xl font-bold text-text-primary leading-none">
        {{ summary.stockUsed }}
        <span v-if="summary.stockUnused > 0" class="text-sm font-normal text-text-muted">
          ({{ summary.stockUnused }} unused)
        </span>
      </div>
    </div>

    <div class="bg-surface border border-border rounded-lg px-4 py-3">
      <div class="text-xs text-text-muted uppercase tracking-wide mb-1">Avg Waste</div>
      <div
        class="text-2xl font-bold leading-none"
        :class="summary.overallWaste <= 20 ? 'text-success' :
                summary.overallWaste <= 40 ? 'text-warning' : 'text-danger'"
      >
        {{ summary.overallWaste }}%
      </div>
    </div>

    <div class="bg-surface border border-border rounded-lg px-4 py-3">
      <div class="text-xs text-text-muted uppercase tracking-wide mb-1">Avg Yield</div>
      <div
        class="text-2xl font-bold leading-none"
        :class="(100 - summary.overallWaste) >= 80 ? 'text-success' :
                (100 - summary.overallWaste) >= 60 ? 'text-warning' : 'text-danger'"
      >
        {{ 100 - summary.overallWaste }}%
      </div>
    </div>
  </div>

  <div v-if="summary.resawCount > 0" class="bg-surface border border-border rounded-lg px-4 py-3">
    <div class="text-xs text-text-muted uppercase tracking-wide mb-1">Resaw Ops</div>
    <div class="text-2xl font-bold text-text-primary leading-none">{{ summary.resawCount }}</div>
  </div>

  <div v-if="summary.optimized" class="mt-2 text-xs text-text-muted">
    ✓ Optimized across {{ summary.orderingsTried }} board orderings
  </div>
</template>

<script setup>
defineProps({ summary: { type: Object, required: true } })
</script>
