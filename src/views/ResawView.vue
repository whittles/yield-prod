<template>
  <div class="max-w-5xl mx-auto px-4 py-6 space-y-6">

    <!-- ── Page Header ──────────────────────────────────────────────── -->
    <div class="no-print">
      <h1 class="text-2xl font-bold text-text-primary">Resaw Planner</h1>
      <p class="text-text-muted text-sm mt-1">Production yield calculator for kumiko strip milling</p>
    </div>

    <!-- ── Section 1: Stock Input ──────────────────────────────────── -->
    <div class="bg-surface border border-border rounded-lg p-5 no-print">
      <h2 class="text-base font-semibold text-text-primary mb-1">Stock</h2>
      <p class="text-xs text-text-muted mb-4">Your rough lumber before any milling</p>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div>
          <label class="block text-xs text-text-muted mb-1">Qty (boards)</label>
          <input
            type="number"
            v-model.number="store.resawStock.qty"
            min="1"
            class="w-full border border-border rounded px-2 py-1.5 text-sm bg-bg text-text-primary"
          />
          <p class="text-xs text-text-muted mt-1">Number of boards in this batch</p>
        </div>
        <div>
          <label class="block text-xs text-text-muted mb-1">Nominal thickness</label>
          <input
            type="text"
            v-model="store.resawStock.thicknessStr"
            placeholder='e.g. "2" or "1 3/4"'
            class="w-full border border-border rounded px-2 py-1.5 text-sm bg-bg text-text-primary"
          />
          <p class="text-xs text-text-muted mt-1">As-purchased dimension (e.g. "2" for 8/4 lumber)</p>
        </div>
        <div>
          <label class="block text-xs text-text-muted mb-1">Width (in)</label>
          <input
            type="text"
            v-model="store.resawStock.widthStr"
            placeholder='e.g. "7"'
            class="w-full border border-border rounded px-2 py-1.5 text-sm bg-bg text-text-primary"
          />
          <p class="text-xs text-text-muted mt-1">Actual board width — usable for ripping</p>
        </div>
        <div>
          <label class="block text-xs text-text-muted mb-1">Length (in)</label>
          <input
            type="text"
            v-model="store.resawStock.lengthStr"
            placeholder='e.g. "12"'
            class="w-full border border-border rounded px-2 py-1.5 text-sm bg-bg text-text-primary"
          />
          <p class="text-xs text-text-muted mt-1">Board length — affects how many strip lengths you get</p>
        </div>
        <div>
          <label class="block text-xs text-text-muted mb-1">Condition</label>
          <select
            v-model="store.resawStock.condition"
            class="w-full border border-border rounded px-2 py-1.5 text-sm bg-bg text-text-primary"
          >
            <option value="rough">Rough</option>
            <option value="skip-planed">Skip Planed</option>
            <option value="s3s">S3S</option>
            <option value="s4s">S4S</option>
          </select>
          <p class="text-xs text-text-muted mt-1">How the lumber was surfaced at the mill</p>
        </div>
      </div>
    </div>

    <!-- ── Section 1.5: Rough Crosscut ──────────────────────────────── -->
    <div class="bg-surface border border-border rounded-lg p-5 no-print">
      <h2 class="text-base font-semibold text-text-primary mb-1">Rough Crosscut</h2>
      <p class="text-xs text-text-muted mb-4">Cut long boards to manageable lengths at the miter station before resawing</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label class="block text-xs text-text-muted mb-1">Acceptable blank lengths (in)</label>
          <div class="space-y-1">
            <div v-for="(len, i) in store.crosscutSettings.blankLengths" :key="i" class="flex items-center gap-2">
              <input type="text" v-model="store.crosscutSettings.blankLengths[i]"
                     class="w-20 border border-border rounded px-2 py-1 text-sm bg-bg text-text-primary"
                     placeholder='36' />
              <span class="text-xs text-text-muted">"</span>
              <button v-if="store.crosscutSettings.blankLengths.length > 1"
                      @click="store.removeBlankLength(i)"
                      class="text-text-muted hover:text-danger text-sm leading-none">×</button>
            </div>
            <button @click="store.addBlankLength()" class="text-xs text-accent hover:opacity-80 mt-1">+ Add length</button>
          </div>
          <p class="text-xs text-text-muted mt-1">Solver finds the mix that minimizes waste (e.g. 36" + 24")</p>
        </div>
        <div>
          <label class="block text-xs text-text-muted mb-1">Snipe buffer per blank (in)</label>
          <input type="text" v-model="store.crosscutSettings.snipeBufferStr"
                 placeholder='e.g. "2"'
                 class="w-full border border-border rounded px-2 py-1.5 text-sm bg-bg text-text-primary" />
          <p class="text-xs text-text-muted mt-1">Extra length added to each blank for planer snipe. 0" = light passes, 2" = moderate, 6" = aggressive. Trimmed off at the finish crosscut.</p>
        </div>
        <div>
          <label class="block text-xs text-text-muted mb-1">Miter saw kerf</label>
          <select v-model="store.crosscutSettings.miterKerfStr"
                  class="w-full border border-border rounded px-2 py-1.5 text-sm bg-bg text-text-primary">
            <option value="1/8">1/8" (standard)</option>
            <option value="3/32">3/32"</option>
            <option value="1/16">1/16"</option>
          </select>
          <p class="text-xs text-text-muted mt-1">Used for both rough crosscut and finish crosscut to length</p>
        </div>
        <div class="flex flex-col justify-end">
          <div class="text-xs text-text-muted mb-1">Optimal cut plan (live)</div>
          <div class="text-sm font-semibold text-text-primary px-2 py-1.5 bg-bg border border-border rounded">
            {{ crosscutPreview }}
          </div>
          <p class="text-xs text-text-muted mt-1">{{ wastePreview }}" waste from {{ store.resawStock.lengthStr }}" board</p>
        </div>
      </div>
    </div>

    <!-- ── Section 2: Resaw Settings ──────────────────────────────── -->
    <div class="bg-surface border border-border rounded-lg p-5 no-print">
      <h2 class="text-base font-semibold text-text-primary mb-1">Resaw Settings</h2>
      <p class="text-xs text-text-muted mb-4">How you'll cut the stock into thin panels</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label class="block text-xs text-text-muted mb-1">Resaw tool / kerf</label>
          <select
            v-model="store.resawSettings.kerfStr"
            class="w-full border border-border rounded px-2 py-1.5 text-sm bg-bg text-text-primary"
          >
            <option value="1/16">Bandsaw — 1/16" kerf</option>
            <option value="3/32">Bandsaw — 3/32" kerf</option>
            <option value="1/8">Table Saw — 1/8" kerf</option>
          </select>
          <p class="text-xs text-text-muted mt-1">Blade thickness lost at each cut</p>
        </div>
        <div>
          <label class="block text-xs text-text-muted mb-1">Panel target depth (strip depth in frame)</label>
          <input
            type="text"
            v-model="store.resawSettings.panelTargetStr"
            placeholder='e.g. "3/8"'
            class="w-full border border-border rounded px-2 py-1.5 text-sm bg-bg text-text-primary"
          />
          <p class="text-xs text-text-muted mt-1">Finished panel thickness after drum sanding (e.g. "3/8")</p>
        </div>
        <div>
          <label class="block text-xs text-text-muted mb-1">Drum sanding allowance</label>
          <input
            type="text"
            v-model="store.resawSettings.slabAllowanceStr"
            placeholder='e.g. "0.010"'
            class="w-full border border-border rounded px-2 py-1.5 text-sm bg-bg text-text-primary"
          />
          <p class="text-xs text-text-muted mt-1">Typically 0.010" — just enough to clean up resaw marks without long passes</p>
        </div>
        <div class="flex flex-col justify-end">
          <div class="text-xs text-text-muted mb-1">Set fence to:</div>
          <div class="text-sm font-semibold text-text-primary px-2 py-1.5 bg-bg border border-border rounded">
            {{ slabGreenThickness }}"
          </div>
          <p class="text-xs text-text-muted mt-1">Set your bandsaw fence to this dimension for each resaw pass</p>
        </div>
      </div>
    </div>

    <!-- ── Section 3: Strip SKUs ───────────────────────────────────── -->
    <div class="bg-surface border border-border rounded-lg p-5 no-print">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-base font-semibold text-text-primary mb-1">Strip SKUs</h2>
        <p class="text-xs text-text-muted mb-4">The finished strips you're producing — one row per product</p>
        <button
          @click="store.addResawSku()"
          class="text-sm px-3 py-1 border border-border rounded hover:bg-bg transition-colors text-text-primary"
        >
          + Add SKU
        </button>
      </div>
      <div class="sm:hidden space-y-3">
        <div v-for="sku in store.resawSkus" :key="sku.id"
             class="border border-border rounded-lg p-3 bg-surface space-y-2">
          <div class="flex items-center justify-between">
            <input v-model="sku.name" type="text"
                   class="flex-1 border border-border rounded px-2 py-1.5 text-sm bg-transparent text-text-primary font-medium"
                   placeholder="SKU name" />
            <button @click="store.removeResawSku(sku.id)"
                    class="ml-2 text-text-muted hover:text-danger px-1">×</button>
          </div>
          <div class="grid grid-cols-2 gap-2 text-sm">
            <div>
              <label class="block text-xs text-text-muted mb-1">Rough rip face"</label>
              <input v-model="sku.roughWidthStr" type="text"
                     class="w-full border border-border rounded px-2 py-1 bg-transparent text-text-primary" />
            </div>
            <div>
              <label class="block text-xs text-text-muted mb-1">Final face"</label>
              <input v-model="sku.finalWidthStr" type="text"
                     class="w-full border border-border rounded px-2 py-1 bg-transparent text-text-primary" />
            </div>
            <div>
              <label class="block text-xs text-text-muted mb-1">Plane allowance"</label>
              <input v-model.number="sku.planeAllowance" type="number" step="0.001"
                     class="w-full border border-border rounded px-2 py-1 bg-transparent text-text-primary" />
            </div>
            <div>
              <label class="block text-xs text-text-muted mb-1">Sander allowance"</label>
              <input v-model.number="sku.sanderAllowance" type="number" step="0.001"
                     class="w-full border border-border rounded px-2 py-1 bg-transparent text-text-primary" />
            </div>
            <div>
              <label class="block text-xs text-text-muted mb-1">Length (in)</label>
              <input v-model.number="sku.length" type="number"
                     class="w-full border border-border rounded px-2 py-1 bg-transparent text-text-primary" />
            </div>
          </div>
        </div>
        <button @click="store.addResawSku()"
                class="w-full border border-dashed border-border rounded-lg py-2 text-sm text-text-muted hover:text-text-primary hover:border-accent/50 transition-colors">
          + Add SKU
        </button>
      </div>

      <div class="hidden sm:block overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-xs text-text-muted border-b border-border">
              <th class="pb-2 pr-3" title="Product name for this strip size">SKU Name</th>
              <th class="pb-2 pr-3" title="Face dimension to rip on the table saw — includes material for hand planing and drum sanding">Rough Rip Face"</th>
              <th class="pb-2 pr-3" title="Face dimension removed by hand plane (Step 7)">Hand Plane Loss"</th>
              <th class="pb-2 pr-3" title="Face dimension removed by drum sander — thin side (Step 8)">Drum Sand Loss"</th>
              <th class="pb-2 pr-3" title="Finished strip face dimension — what you sell">Final Face"</th>
              <th class="pb-2 pr-3" title="Strip length in inches">Length"</th>
              <th class="pb-2 pr-3" title="Table saw blade thickness">Rip Kerf</th>
              <th class="pb-2"></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="sku in store.resawSkus"
              :key="sku.id"
              class="border-b border-border/50"
            >
              <td class="py-1.5 pr-3">
                <input
                  type="text"
                  v-model="sku.name"
                  class="w-full border border-border rounded px-2 py-1 text-sm bg-bg text-text-primary"
                />
              </td>
              <td class="py-1.5 pr-3">
                <input
                  type="text"
                  v-model="sku.roughWidthStr"
                  class="w-24 border border-border rounded px-2 py-1 text-sm bg-bg text-text-primary"
                />
              </td>
              <td class="py-1.5 pr-3">
                <input
                  type="number"
                  v-model.number="sku.planeAllowance"
                  step="0.001"
                  class="w-20 border border-border rounded px-2 py-1 text-sm bg-bg text-text-primary"
                />
              </td>
              <td class="py-1.5 pr-3">
                <input
                  type="number"
                  v-model.number="sku.sanderAllowance"
                  step="0.001"
                  class="w-20 border border-border rounded px-2 py-1 text-sm bg-bg text-text-primary"
                />
              </td>
              <td class="py-1.5 pr-3">
                <input
                  type="text"
                  v-model="sku.finalWidthStr"
                  class="w-24 border border-border rounded px-2 py-1 text-sm bg-bg text-text-primary"
                />
              </td>
              <td class="py-1.5 pr-3">
                <input
                  type="number"
                  v-model.number="sku.length"
                  class="w-16 border border-border rounded px-2 py-1 text-sm bg-bg text-text-primary"
                />
              </td>
              <td class="py-1.5 pr-3">
                <select
                  v-model="sku.tableKerfStr"
                  class="border border-border rounded px-2 py-1 text-sm bg-bg text-text-primary"
                >
                  <option value="1/16">1/16"</option>
                  <option value="3/32">3/32"</option>
                  <option value="1/8">1/8"</option>
                </select>
              </td>
              <td class="py-1.5">
                <button
                  @click="store.removeResawSku(sku.id)"
                  class="text-red-500 hover:text-red-700 text-xs px-2 py-1"
                  title="Remove SKU"
                >
                  ✕
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- How it works -->
    <details class="bg-surface border border-border rounded-lg no-print">
      <summary class="px-5 py-3 text-sm font-semibold text-text-primary cursor-pointer hover:bg-bg/50 transition-colors select-none">
        ℹ️ How this calculator works
      </summary>
      <div class="px-5 pb-5 pt-2 text-sm text-text-muted space-y-2 border-t border-border">
        <p>Enter your stock dimensions and condition, set your resaw parameters, define your strip SKUs, then hit Calculate.</p>
        <ol class="list-decimal ml-4 space-y-1.5">
          <li><strong class="text-text-primary">Rough crosscut</strong> — miter saw cuts long boards to manageable blank lengths (e.g. 36–48"). Kerf is 1/8".</li>
          <li><strong class="text-text-primary">Condition allowance</strong> — subtracts material lost to the mill's surfacing (e.g. skip planed removes ~⅛" from thickness)</li>
          <li><strong class="text-text-primary">Resaw</strong> — divides usable thickness into slabs. Each slab = panel target + drum sanding allowance. Kerf is lost between slabs.</li>
          <li><strong class="text-text-primary">Drum sand to panel</strong> — each slab is sanded flat to your panel target (e.g. 3/8")</li>
          <li><strong class="text-text-primary">Finish crosscut to length</strong> — miter saw cuts slabs to exact finished length per SKU (e.g. 12" or 24"). Kerf is 1/8".</li>
          <li><strong class="text-text-primary">Rip strips</strong> — panels are ripped to rough width on the table saw. Kerf lost between each strip.</li>
          <li><strong class="text-text-primary">Hand plane</strong> — strips are planed to reduce width (plane loss column)</li>
          <li><strong class="text-text-primary">Final drum sand</strong> — strips are sanded to final width on the thin side (drum sand loss column)</li>
        </ol>
        <p class="text-xs">All dimensions in inches. Accept fractions like "1 3/4" or decimals like "1.75".</p>
      </div>
    </details>

    <!-- ── Calculate Button ────────────────────────────────────────── -->
    <div class="no-print flex justify-center">
      <button
        @click="store.calculateResaw()"
        :disabled="!store.resawSkus.length"
        :class="[
          'px-8 py-3 font-semibold rounded-lg transition-opacity text-base',
          store.resawSkus.length
            ? 'bg-header text-white hover:opacity-90 cursor-pointer'
            : 'bg-header/40 text-white/40 cursor-not-allowed'
        ]"
      >
        Calculate Yield
      </button>
    </div>

    <!-- ── Error state ────────────────────────────────────────────── -->
    <div v-if="store.resawError" class="bg-red-500/10 border border-red-500/40 rounded-lg p-4 text-sm text-red-400">
      ⚠ Calculation error: {{ store.resawError }}
    </div>

    <!-- ── Results ─────────────────────────────────────────────────── -->
    <template v-if="r">

      <!-- ── Print header (full batch summary) ─────────────────────── -->
      <div class="print-only print-no-break mb-6">
        <!-- Logo + title row -->
        <div style="display:flex; align-items:center; gap:12pt; border-bottom:2px solid #333; padding-bottom:8pt; margin-bottom:8pt;">
          <img src="/logo.png" style="width:40pt; height:40pt; object-fit:contain;" alt="Althoff Woodshop"/>
          <div>
            <div style="font-size:14pt; font-weight:700; letter-spacing:0.5pt;">ALTHOFF WOODSHOP</div>
            <div style="font-size:10pt; color:#555;">Resaw Planner — Milling Sheet</div>
          </div>
          <div style="margin-left:auto; text-align:right; font-size:9pt; color:#555;">
            <div>{{ new Date().toLocaleDateString('en-US', { weekday:'short', year:'numeric', month:'short', day:'numeric' }) }}</div>
            <div>v{{ version }}</div>
          </div>
        </div>

        <!-- Batch summary table -->
        <table style="width:100%; border-collapse:collapse; font-size:10pt; margin-bottom:8pt;">
          <thead>
            <tr style="background:#f0f0f0;">
              <th style="border:1px solid #ccc; padding:4pt 6pt; text-align:left;">Condition</th>
              <th style="border:1px solid #ccc; padding:4pt 6pt; text-align:left;">Dimensions</th>
              <th style="border:1px solid #ccc; padding:4pt 6pt; text-align:left;">Boards</th>
              <th style="border:1px solid #ccc; padding:4pt 6pt; text-align:left;">Resaw Fence</th>
              <th style="border:1px solid #ccc; padding:4pt 6pt; text-align:left;">Panel Depth</th>
              <th style="border:1px solid #ccc; padding:4pt 6pt; text-align:left;">Blanks</th>
              <th style="border:1px solid #ccc; padding:4pt 6pt; text-align:left;">Slabs/Blank</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border:1px solid #ccc; padding:4pt 6pt;">{{ store.resawStock.condition }}</td>
              <td style="border:1px solid #ccc; padding:4pt 6pt; font-family:monospace;">{{ store.resawStock.thicknessStr }}" × {{ store.resawStock.widthStr }}" × {{ store.resawStock.lengthStr }}"<br/>{{ r.input.stock.thickness }}" nom · {{ fmtIn(r.stock.usableThickness) }}" usable</td>
              <td style="border:1px solid #ccc; padding:4pt 6pt; font-weight:bold;">{{ store.resawStock.qty }}</td>
              <td style="border:1px solid #ccc; padding:4pt 6pt; font-family:monospace; font-weight:bold;">{{ r.slabs.slabThickness.toFixed(4) }}"</td>
              <td style="border:1px solid #ccc; padding:4pt 6pt; font-family:monospace;">{{ fmtIn(r.input.resawSettings.panelTarget) }}"</td>
              <td style="border:1px solid #ccc; padding:4pt 6pt; font-weight:bold;">{{ r.roughCrosscut.blanksTotal }}</td>
              <td style="border:1px solid #ccc; padding:4pt 6pt; font-weight:bold;">{{ r.slabs.slabsPerBlank }}</td>
            </tr>
          </tbody>
        </table>

        <!-- SKU yield summary -->
        <table style="width:100%; border-collapse:collapse; font-size:10pt; margin-bottom:4pt;">
          <thead>
            <tr style="background:#f0f0f0;">
              <th style="border:1px solid #ccc; padding:4pt 6pt; text-align:left;">SKU</th>
              <th style="border:1px solid #ccc; padding:4pt 6pt; text-align:left;">Final Dims (Face × Depth × Length)</th>
              <th style="border:1px solid #ccc; padding:4pt 6pt; text-align:left;">Rip Fence</th>
              <th style="border:1px solid #ccc; padding:4pt 6pt; text-align:left;">Strips/Panel</th>
              <th style="border:1px solid #ccc; padding:4pt 6pt; text-align:right; font-weight:bold;">TOTAL STRIPS</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="sr in r.stripResults" :key="'ph-' + sr.id">
              <td style="border:1px solid #ccc; padding:4pt 6pt; font-weight:bold;">{{ sr.name }}</td>
              <td style="border:1px solid #ccc; padding:4pt 6pt; font-family:monospace;">{{ sr.finalWidth.toFixed(3) }}" × {{ fmtIn(r.input.resawSettings.panelTarget) }}" × {{ sr.length }}"</td>
              <td style="border:1px solid #ccc; padding:4pt 6pt; font-family:monospace;">{{ fmtIn(sr.roughWidth) }}"</td>
              <td style="border:1px solid #ccc; padding:4pt 6pt;">{{ sr.stripsPerPanel }}</td>
              <td style="border:1px solid #ccc; padding:4pt 6pt; text-align:right; font-weight:bold; font-size:12pt;">{{ sr.totalStrips }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Summary bar -->
      <div class="no-print grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div class="bg-surface border border-border rounded-lg p-4 text-center">
          <div class="text-2xl font-bold text-text-primary">{{ r.roughCrosscut.blanksPerBoard }}</div>
          <div class="text-xs text-text-muted mt-1">Blanks per board</div>
        </div>
        <div class="bg-surface border border-border rounded-lg p-4 text-center">
          <div class="text-2xl font-bold text-text-primary">{{ r.roughCrosscut.blanksTotal }}</div>
          <div class="text-xs text-text-muted mt-1">Total blanks</div>
        </div>
        <div class="bg-surface border border-border rounded-lg p-4 text-center">
          <div class="text-2xl font-bold text-text-primary">{{ r.slabs.slabsPerBlank }}</div>
          <div class="text-xs text-text-muted mt-1">Slabs per blank</div>
        </div>
        <div class="bg-surface border border-border rounded-lg p-4 text-center">
          <div class="text-2xl font-bold text-text-primary">{{ r.summary.slabsTotal }}</div>
          <div class="text-xs text-text-muted mt-1">Total slabs</div>
        </div>
        <div
          v-for="sr in r.stripResults.slice(0, 2)"
          :key="sr.id"
          class="bg-surface border border-border rounded-lg p-4 text-center"
        >
          <div class="text-2xl font-bold text-text-primary">{{ sr.totalStrips }}</div>
          <div class="text-xs text-text-muted mt-1">{{ sr.name }}</div>
        </div>
        <div v-if="r.stripResults.length > 2"
             class="bg-surface border border-border rounded-lg p-4 text-center">
          <div class="text-lg font-bold text-text-muted">+{{ r.stripResults.length - 2 }}</div>
          <div class="text-xs text-text-muted mt-1">more SKUs</div>
        </div>
      </div>


      <!-- Step 1: Rough Crosscut SVG -->
      <div class="bg-surface border border-border rounded-lg p-5 print-no-break">
        <h3 class="text-sm font-semibold text-text-primary mb-1">Step 1 — Rough Crosscut Layout</h3>
        <p class="text-xs text-text-muted mb-2">{{ r.roughCrosscut.cuts.map(c => c.qty + '\u00d7' + fmtIn(c.length) + '"').join(' + ') }} from {{ fmtIn(r.input.stock.length) }}" board · {{ fmtIn(r.roughCrosscut.waste) }}" waste</p>
        <div class="flex flex-wrap gap-3 text-xs text-text-muted mb-3">
          <span class="flex items-center gap-1"><span class="inline-block w-3 h-3 rounded bg-yellow-600 opacity-80"></span> Blank</span>
          <span class="flex items-center gap-1"><span class="inline-block w-3 h-3 rounded bg-gray-400 opacity-80"></span> Kerf / waste</span>
        </div>
        <svg viewBox="0 0 560 80" class="w-full max-w-2xl mx-auto" style="font-family: monospace;">
          <rect x="20" y="15" width="520" height="50" fill="#e8d5b0" stroke="#8B6914" stroke-width="1.5"/>
          <g v-for="(zone, i) in roughCutZones" :key="'rz-' + i">
            <rect :x="zone.x" y="15" :width="zone.w" height="50"
                  :fill="i % 2 === 0 ? '#d4a84b' : '#e8c470'" opacity="0.85" stroke="#8B6914" stroke-width="0.5"/>
            <text v-if="zone.w > 25" :x="zone.x + zone.w/2" y="44" text-anchor="middle" font-size="9" fill="#3d2000">{{ fmtIn(zone.length) }}"</text>
            <rect v-if="i < roughCutZones.length - 1" :x="zone.x + zone.w" y="15" :width="roughCutKerfW" height="50" fill="#555" opacity="0.5"/>
          </g>
          <rect v-if="roughCutWasteW > 0" :x="roughCutWasteX" y="15" :width="roughCutWasteW" height="50" fill="#aaa" opacity="0.4"/>
          <text v-if="roughCutWasteW > 15" :x="roughCutWasteX + roughCutWasteW/2" y="44" text-anchor="middle" font-size="8" fill="#666">waste</text>
        </svg>
      </div>

      <!-- Cross-section SVG (board end view) -->
      <div class="bg-surface border border-border rounded-lg p-5 print-no-break">
        <h3 class="text-sm font-semibold text-text-primary mb-3">Board Cross-Section (end grain view)</h3>
        <div class="flex flex-wrap gap-4 text-xs text-text-muted mb-3">
          <span class="flex items-center gap-1"><span class="inline-block w-3 h-3 rounded bg-yellow-600 opacity-80"></span> Slab (usable panel)</span>
          <span class="flex items-center gap-1"><span class="inline-block w-3 h-3 rounded bg-gray-400 opacity-80"></span> Kerf / waste</span>
          <span class="flex items-center gap-1"><span class="inline-block w-3 h-3 rounded bg-gray-300 opacity-60"></span> Condition loss</span>
        </div>
        <svg
          viewBox="0 0 460 220"
          class="w-full max-w-2xl mx-auto"
          style="font-family: monospace;"
        >
          <!-- Board rectangle: map usableThickness to 160px height, usableWidth to 350px wide -->
          <!-- Board sits at x=70, y=20, width=350, height=160 -->
          <defs>
            <pattern id="hatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="6" stroke="#888" stroke-width="1" opacity="0.3"/>
            </pattern>
          </defs>

          <!-- Board outline (waste = full nominal thickness) -->
          <rect x="70" y="20" width="350" height="170" fill="#e8d5b0" stroke="#8B6914" stroke-width="1.5"/>

          <!-- Condition waste zone at top (the part removed by skip planing etc.) -->
          <rect
            x="70" y="20"
            width="350"
            :height="condWasteH"
            fill="#ccc" opacity="0.5"
          />
          <text v-if="condWasteH > 8" x="245" :y="20 + condWasteH/2 + 4" text-anchor="middle" font-size="9" fill="#666">
            {{ conditionLabel }} loss
          </text>

          <!-- Slab zones -->
          <g v-for="(slab, i) in slabZones" :key="'slab-' + i">
            <rect
              :x="70"
              :y="slab.y"
              width="350"
              :height="slab.h"
              :fill="i % 2 === 0 ? '#d4a84b' : '#e8c470'"
              opacity="0.85"
              stroke="#8B6914"
              stroke-width="0.5"
            />
            <text
              x="245"
              :y="slab.y + slab.h/2 + 4"
              text-anchor="middle"
              font-size="9"
              fill="#3d2000"
            >
              Slab {{ i + 1 }}: {{ fmtIn(r.slabs.slabThickness) }}" fence → {{ fmtIn(r.input.resawSettings.panelTarget) }}" panel
            </text>
            <!-- Kerf after slab (not after last) -->
            <rect
              v-if="i < slabZones.length - 1"
              :x="70"
              :y="slab.y + slab.h"
              width="350"
              :height="kerfH"
              fill="#555"
              opacity="0.6"
            />
          </g>

          <!-- Offcut zone -->
          <rect
            v-if="offcutH > 0"
            :x="70"
            :y="offcutY"
            width="350"
            :height="offcutH"
            fill="#aaa"
            opacity="0.4"
            stroke="#888"
            stroke-width="0.5"
          />
          <text v-if="offcutH > 6" x="245" :y="offcutY + offcutH/2 + 4" text-anchor="middle" font-size="9" fill="#555">
            Offcut {{ fmtIn(r.slabs.thicknessWaste) }}
          </text>

          <!-- Dimension line: left side (usable thickness) -->
          <line x1="58" :y1="condWasteH + 20" x2="58" y2="190" stroke="#333" stroke-width="1"/>
          <line x1="54" :y1="condWasteH + 20" x2="62" :y2="condWasteH + 20" stroke="#333" stroke-width="1"/>
          <line x1="54" y1="190" x2="62" y2="190" stroke="#333" stroke-width="1"/>
          <text x="50" :y="(condWasteH + 20 + 190)/2 + 4" text-anchor="middle" font-size="9" fill="#333" transform="rotate(-90 50 110)">
            {{ fmtIn(r.stock.usableThickness) }} usable
          </text>

          <!-- Dimension line: full board height -->
          <line x1="432" y1="20" x2="432" y2="190" stroke="#666" stroke-width="1"/>
          <line x1="428" y1="20" x2="436" y2="20" stroke="#666" stroke-width="1"/>
          <line x1="428" y1="190" x2="436" y2="190" stroke="#666" stroke-width="1"/>
          <text x="448" y="110" text-anchor="middle" font-size="9" fill="#555" transform="rotate(90 448 110)">
            {{ fmtIn(r.input.stock.thickness) }} nominal
          </text>

          <!-- Width label -->
          <text x="245" y="212" text-anchor="middle" font-size="9" fill="#333">
            Width: {{ fmtIn(r.stock.usableWidth) }}"
          </text>

          <!-- Yield label -->
          <text x="245" y="14" text-anchor="middle" font-size="9" fill="#555">
            {{ r.summary.thicknessYield }}% thickness yield · {{ r.slabs.slabsPerBoard }} slabs/board
          </text>
        </svg>
      </div>

      <!-- Per-slab strip layout SVG -->
      <div class="bg-surface border border-border rounded-lg p-5">
        <h3 class="text-sm font-semibold text-text-primary mb-1">Panel Strip Layout (face view — one slab)</h3>
        <div class="flex flex-wrap gap-4 text-xs text-text-muted mb-3">
          <span class="flex items-center gap-1"><span class="inline-block w-3 h-3 rounded bg-yellow-600 opacity-80"></span> Strip (rough rip face)</span>
          <span class="flex items-center gap-1"><span class="inline-block w-3 h-3 rounded bg-gray-400 opacity-80"></span> Kerf / waste</span>
        </div>
        <p class="text-xs text-text-muted mb-3">Showing {{ r.stripResults[0]?.name ?? 'first SKU' }} rip layout. Width = {{ fmtIn(r.stock.usableWidth) }}", Length = {{ r.stripResults[0]?.length }}"</p>

        <svg
          viewBox="0 0 460 120"
          class="w-full max-w-2xl mx-auto"
          style="font-family: monospace;"
        >
          <!-- Panel rectangle: 420px wide × 80px tall -->
          <rect x="20" y="20" width="420" height="80" fill="#e8d5b0" stroke="#8B6914" stroke-width="1.5"/>

          <!-- Strip zones for first SKU -->
          <g v-for="(strip, i) in stripZonesFirst" :key="'strip-' + i">
            <!-- Kerf before strip (not before first) -->
            <rect
              v-if="i > 0"
              :x="strip.x - stripKerfW"
              y="20"
              :width="stripKerfW"
              height="80"
              fill="#555"
              opacity="0.5"
            />
            <rect
              :x="strip.x"
              y="20"
              :width="strip.w"
              height="80"
              :fill="i % 2 === 0 ? '#d4a84b' : '#e8c470'"
              opacity="0.8"
              stroke="#8B6914"
              stroke-width="0.3"
            />
            <text
              v-if="strip.w > 12"
              :x="strip.x + strip.w/2"
              y="64"
              text-anchor="middle"
              font-size="7"
              fill="#3d2000"
            >
              {{ i + 1 }}
            </text>
          </g>

          <!-- Waste zone at right -->
          <rect
            v-if="stripWasteW > 0"
            :x="20 + 420 - stripWasteW"
            y="20"
            :width="stripWasteW"
            height="80"
            fill="#aaa"
            opacity="0.4"
          />
          <text
            v-if="stripWasteW > 10"
            :x="20 + 420 - stripWasteW/2"
            y="64"
            text-anchor="middle"
            font-size="7"
            fill="#555"
          >W</text>

          <!-- Labels -->
          <text x="230" y="14" text-anchor="middle" font-size="9" fill="#555">
            {{ r.stripResults[0]?.stripsPerPanel || 0 }} strips × {{ fmtIn(r.stripResults[0]?.roughWidth || 0) }}" rough rip ({{ r.stripResults[0]?.name }})
          </text>
          <text x="20" y="115" font-size="8" fill="#666">← {{ fmtIn(r.stock.usableWidth) }}" panel width →</text>
        </svg>
      </div>

      <!-- Step-by-step instructions -->
      <div class="bg-surface border border-border rounded-lg p-5 print-break-before">
        <div class="mb-4 no-print">
          <h3 class="text-sm font-semibold text-text-primary">Milling Instructions</h3>
        </div>

        <div class="space-y-4 text-sm font-mono">
          <!-- Step 1: Rough crosscut -->
          <div class="print-step">
            <div class="font-semibold text-text-primary">Step 1 — Rough crosscut (miter saw)</div>
            <div class="text-text-muted mt-1 ml-4">
              Cut each board into blanks (stop block recommended, not a fence):<br/>
              <div v-for="cut in r.roughCrosscut.cuts" :key="cut.length" class="mt-0.5">
                {{ cut.qty }}× {{ fmtIn(cut.length) }}" blanks
                <span v-if="r.roughCrosscut.snipeBuffer > 0" class="opacity-70">
                  ({{ fmtIn(cut.length - r.roughCrosscut.snipeBuffer) }}" nominal + {{ fmtIn(r.roughCrosscut.snipeBuffer) }}" snipe buffer)
                </span>
              </div>
              Total: {{ r.roughCrosscut.blanksTotal }} blanks · Waste per board: {{ fmtIn(r.roughCrosscut.waste) }}"
            </div>
          </div>

          <!-- Step 2 -->
          <div class="print-step">
            <div class="font-semibold text-text-primary">Step 2 — Joint reference face</div>
            <div class="text-text-muted mt-1 ml-4">
              <span v-if="r.input.stock.condition === 'skip-planed'">One face already skip planed — run a light jointer pass to establish a true reference face.</span>
              <span v-else-if="r.input.stock.condition === 'rough'">Rough stock: joint one face flat before resawing. Take passes until face is true.</span>
              <span v-else>{{ conditionLabel }} stock — reference face should already be suitable.</span><br/>
              Nominal: {{ fmtIn(r.input.stock.thickness) }}" → Usable after conditioning: {{ fmtIn(r.stock.usableThickness) }}"
            </div>
          </div>

          <!-- Step 3: Resaw -->
          <div class="print-step">
            <div class="font-semibold text-text-primary">Step 3 — Resaw on bandsaw</div>
            <div class="text-text-muted mt-1 ml-4">
              Fence setting: {{ r.slabs.slabThickness.toFixed(4) }}" — jointed face against fence<br/>
              <span v-if="r.slabs.extraPerSlab > 0.001" class="text-success">
                ✓ Offcut redistributed: +{{ r.slabs.extraPerSlab.toFixed(4) }}" per slab (nominal was {{ r.slabs.nominalSlabThickness.toFixed(4) }}", extra absorbed by drum sander)
              </span><br/>
              Kerf: {{ fmtIn(r.input.resawSettings.kerf) }}" per cut<br/>
              <div v-for="seq in r.resawSequence" :key="seq.cutNumber" class="mt-0.5">
                Cut {{ seq.cutNumber }}: {{ fmtIn(r.slabs.slabThickness) }}" fence → Slab {{ seq.slabNumber }}
              </div>
              <div class="mt-1" v-if="r.slabs.thicknessWaste > 0.01">
                <span v-if="r.slabs.thicknessWaste >= r.slabs.slabThickness * 0.5" class="text-warning">
                  ⚠ Offcut {{ r.slabs.thicknessWaste.toFixed(3) }}" — consider adjusting fence to distribute this across slabs for blade drift buffer
                </span>
                <span v-else>
                  Offcut: {{ r.slabs.thicknessWaste.toFixed(3) }}" (insufficient for another slab)
                </span>
              </div>
            </div>
          </div>

          <!-- Step 4: Drum sand -->
          <div class="print-step">
            <div class="font-semibold text-text-primary">Step 4 — Drum sand to panel depth</div>
            <div class="text-text-muted mt-1 ml-4">
              Target depth: {{ fmtIn(r.input.resawSettings.panelTarget) }}" ± 0.003" (this becomes the strip depth in the kumiko frame)<br/>
              Sand {{ r.slabs.slabsPerBlank }} slabs per blank ({{ r.summary.slabsTotal }} total across all blanks)
            </div>
          </div>

          <!-- Step 5: Finish crosscut to length -->
          <div class="print-step">
            <div class="font-semibold text-text-primary">Step 5 — Finish crosscut to length (miter saw)</div>
            <div class="text-text-muted mt-1 ml-4">
              <span v-if="r.roughCrosscut.snipeBuffer > 0">Snipe buffer ({{ fmtIn(r.roughCrosscut.snipeBuffer) }}") trimmed off here. Square the snipe end first (trailing end from the bandsaw), then measure and cut to length from the clean end.</span>
              <span v-else>Square one end, then measure and cut to length from the clean end.</span><br/>
              <div v-for="sr in r.stripResults" :key="'fc-' + sr.id" class="mt-1">
                <span class="text-text-primary">{{ sr.name }}:</span>
                <div v-for="fc in sr.finishCrosscut" :key="fc.blankLength" class="ml-2 mt-0.5">
                  From {{ fmtIn(fc.blankLength) }}" blank → cut to {{ sr.length }}" × {{ fc.piecesPerBlank }} pieces ({{ fc.qty }} blanks like this) · {{ fmtIn(fc.waste) }}" waste
                </div>
              </div>
            </div>
          </div>

          <!-- Step 6: Rip -->
          <div class="print-step">
            <div class="font-semibold text-text-primary">Step 6 — Rip strips on table saw</div>
            <div class="text-text-muted mt-1 ml-4">
              Ripping sets the strip face dimension (visible front of kumiko strip):<br/>
              <div v-for="sr in r.stripResults" :key="sr.id" class="mt-0.5">
                {{ sr.name }}: fence {{ fmtIn(sr.roughWidth) }}" rough face · {{ sr.stripsPerPanel }} strips/panel · {{ sr.stripsPerBoard }}/board · {{ sr.totalStrips }} total
              </div>
            </div>
          </div>

          <!-- Step 7: Hand plane -->
          <div class="print-step">
            <div class="font-semibold text-text-primary">Step 7 — Hand plane strips to dimension</div>
            <div class="text-text-muted mt-1 ml-4">
              Plane each strip to reduce face from rough rip to near-final:<br/>
              <div v-for="sr in r.stripResults" :key="'p-' + sr.id" class="mt-0.5">
                {{ sr.name }}: {{ fmtIn(sr.roughWidth) }}" → {{ (sr.roughWidth - sr.planeAllowance).toFixed(3) }}" · remove {{ sr.planeAllowance.toFixed(3) }}"
              </div>
            </div>
          </div>

          <!-- Step 8: Final sander -->
          <div class="print-step">
            <div class="font-semibold text-text-primary">Step 8 — Drum sand to final face dimension</div>
            <div class="text-text-muted mt-1 ml-4">
              Sand the strip face to final dimension:<br/>
              <div v-for="sr in r.stripResults" :key="'s-' + sr.id" class="mt-0.5">
                {{ sr.name }}: {{ (sr.roughWidth - sr.planeAllowance).toFixed(3) }}" → {{ sr.finalWidth.toFixed(3) }}" ± 0.003" final face
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Yield report table -->
      <div class="bg-surface border border-border rounded-lg p-5 no-print">
        <h3 class="text-sm font-semibold text-text-primary mb-3">Yield Report</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-xs text-text-muted border-b border-border">
                <th class="pb-2 pr-4">SKU</th>
                <th class="pb-2 pr-4">Final Dims (Face × Depth × Length)</th>
                <th class="pb-2 pr-4">Strips/Panel</th>
                <th class="pb-2 pr-4">Pieces/Blank</th>
                <th class="pb-2 pr-4">Panels (slabs)</th>
                <th class="pb-2 pr-4 font-bold">Total Strips</th>
                <th class="pb-2">Width Waste</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="sr in r.stripResults"
                :key="'yield-' + sr.id"
                class="border-b border-border/50"
              >
                <td class="py-2 pr-4 font-medium">{{ sr.name }}</td>
                <td class="py-2 pr-4 text-text-muted">
                  {{ sr.finalWidth.toFixed(3) }}" × {{ fmtIn(r.input.resawSettings.panelTarget) }}" × {{ sr.length }}"
                </td>
                <td class="py-2 pr-4">{{ sr.stripsPerPanel }}</td>
                <td class="py-2 pr-4">{{ sr.finishedPiecesPerBlank }}</td>
                <td class="py-2 pr-4">{{ r.summary.slabsTotal }}</td>
                <td class="py-2 pr-4 font-semibold">{{ sr.totalStrips }}</td>
                <td class="py-2">{{ sr.widthWastePct }}%</td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="text-xs text-text-muted border-t border-border">
                <td colspan="7" class="pt-2">
                  Total strips = blanks/board × slabs/blank × pieces/blank × strips/panel × boards<br/>
                  Thickness yield: {{ r.summary.thicknessYield }}% · {{ r.slabs.slabsPerBlank }} slabs/blank from {{ fmtIn(r.stock.usableThickness) }}" usable
                </td>
              </tr>
            </tfoot>
          </table>
          <p class="text-xs text-text-muted mt-3">Face = visible front dimension (set by table saw rip → plane → drum sand) · Depth = how deep strip sits in kumiko frame (set by panel thickness) · Length</p>
        </div>
      </div>

    </template>

    <!-- ── FAB: Print Sheet ───────────────────────────────────────────── -->
    <Teleport to="body">
      <button
        v-if="r"
        @click="printInstructions"
        class="no-print fixed bottom-6 right-6 z-50
               flex items-center gap-2
               bg-accent hover:bg-indigo-600 active:bg-indigo-700
               text-white font-semibold
               px-5 py-3 rounded-full
               shadow-lg
               transition-all duration-150
               text-sm"
        aria-label="Print milling sheet"
      >
        🖨 <span class="hidden sm:inline">Print Sheet</span>
      </button>
    </Teleport>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useProjectStore } from '@/stores/project'
import { parseFraction, formatFraction } from '@/utils/fractions'
import { optimizeCrosscut } from '@/resawSolver'

const store = useProjectStore()
const r = computed(() => store.resawResults)
const version = __APP_VERSION__

// Live: optimal crosscut plan preview
const crosscutPreview = computed(() => {
  try {
    const boardLen = parseFraction(store.resawStock.lengthStr)
    const kerf = parseFraction(store.crosscutSettings.miterKerfStr)
    const buffer = parseFraction(store.crosscutSettings.snipeBufferStr) || 0
    const lengths = store.crosscutSettings.blankLengths.map(s => parseFraction(s) + buffer).filter(l => l > 0)
    if (!boardLen || !lengths.length) return '—'
    const plan = optimizeCrosscut(boardLen, lengths, kerf)
    if (!plan.cuts.length) return 'No cuts fit'
    return plan.cuts.map(c => `${c.qty}×${fmtIn(c.length)}"${buffer > 0 ? ` (${fmtIn(c.length - buffer)}+${fmtIn(buffer)})` : ''}`).join(' + ')
  } catch { return '—' }
})

const wastePreview = computed(() => {
  try {
    const boardLen = parseFraction(store.resawStock.lengthStr)
    const kerf = parseFraction(store.crosscutSettings.miterKerfStr)
    const buffer = parseFraction(store.crosscutSettings.snipeBufferStr) || 0
    const lengths = store.crosscutSettings.blankLengths.map(s => parseFraction(s) + buffer).filter(l => l > 0)
    if (!boardLen || !lengths.length) return '—'
    const plan = optimizeCrosscut(boardLen, lengths, kerf)
    return fmtIn(plan.waste)
  } catch { return '—' }
})

// Live: slab green thickness
const slabGreenThickness = computed(() => {
  const pt = parseFraction(store.resawSettings.panelTargetStr)
  const sa = parseFraction(store.resawSettings.slabAllowanceStr)
  return (pt + sa).toFixed(4)
})

// Human-readable condition label
const conditionLabel = computed(() => {
  const map = { 'rough': 'Rough', 'skip-planed': 'Skip Planed', 's3s': 'S3S', 's4s': 'S4S' }
  return map[store.resawStock.condition] || store.resawStock.condition
})

// Format decimal inches to fraction string
function fmtIn(val) {
  if (val === undefined || val === null) return '?'
  // Small dimensions (< 0.5") should show as decimals, not fractions
  // e.g. 0.150" not "1/8", 0.375" not "3/8" — actually 0.375 is fine as a fraction
  // Rule: if it looks like it came from a strip/slab dimension, use decimal
  if (val < 0.5 && val > 0) return val.toFixed(3)
  return formatFraction(val)
}

// ── SVG geometry ────────────────────────────────────────────────────────────

// Board cross-section SVG
// Board rect: x=70, y=20, width=350, height=170 (represents full nominal thickness)
const SVG_BOARD_H = 170  // px for full nominal thickness
const SVG_BOARD_Y = 20

const condWasteH = computed(() => {
  if (!r.value) return 0
  const nominal = r.value.input.stock.thickness
  const usable = r.value.stock.usableThickness
  const condLoss = nominal - usable
  return (condLoss / nominal) * SVG_BOARD_H
})

const slabZones = computed(() => {
  if (!r.value) return []
  const nominal = r.value.input.stock.thickness
  const usable = r.value.stock.usableThickness
  const condLossH = condWasteH.value
  const usableH = SVG_BOARD_H - condLossH

  const slabT = r.value.slabs.slabThickness
  const kerfT = r.value.input.resawSettings.kerf
  const n = r.value.slabs.slabsPerBoard

  const slabPx = (slabT / usable) * usableH
  const kerfPx = (kerfT / usable) * usableH

  const zones = []
  let cursor = SVG_BOARD_Y + condLossH
  for (let i = 0; i < n; i++) {
    zones.push({ y: cursor, h: slabPx })
    cursor += slabPx
    if (i < n - 1) cursor += kerfPx
  }
  return zones
})

const kerfH = computed(() => {
  if (!r.value) return 0
  const nominal = r.value.input.stock.thickness
  const usable = r.value.stock.usableThickness
  const condLossH = condWasteH.value
  const usableH = SVG_BOARD_H - condLossH
  return (r.value.input.resawSettings.kerf / usable) * usableH
})

const offcutY = computed(() => {
  if (!r.value || slabZones.value.length === 0) return 0
  const last = slabZones.value[slabZones.value.length - 1]
  return last.y + last.h
})

const offcutH = computed(() => {
  if (!r.value) return 0
  return (SVG_BOARD_Y + SVG_BOARD_H) - offcutY.value
})

// Rough crosscut SVG computeds
const SVG_ROUGH_W = 520
const roughCutZones = computed(() => {
  if (!r.value || !r.value.roughCrosscut.cuts.length) return []
  const boardLen = r.value.input.stock.length
  const kerf = r.value.input.crosscutSettings.miterKerf
  const zones = []
  let cursor = 20
  for (const cut of r.value.roughCrosscut.cuts) {
    for (let i = 0; i < cut.qty; i++) {
      const w = (cut.length / boardLen) * SVG_ROUGH_W
      zones.push({ x: cursor, w, length: cut.length })
      cursor += w + (cursor + w < 538 ? (kerf / boardLen) * SVG_ROUGH_W : 0)
    }
  }
  return zones
})
const roughCutKerfW = computed(() => {
  if (!r.value) return 0
  return (r.value.input.crosscutSettings.miterKerf / r.value.input.stock.length) * SVG_ROUGH_W
})
const roughCutWasteX = computed(() => {
  if (!roughCutZones.value.length) return 540
  const last = roughCutZones.value[roughCutZones.value.length - 1]
  return last.x + last.w
})
const roughCutWasteW = computed(() => {
  if (!r.value) return 0
  return Math.max(0, 540 - roughCutWasteX.value)
})

// Per-slab strip layout SVG
// Panel rect: x=20, y=20, width=420, height=80
const SVG_STRIP_W = 420

const stripZonesFirst = computed(() => {
  if (!r.value || !r.value.stripResults.length) return []
  const sr = r.value.stripResults[0]
  const usableW = r.value.stock.usableWidth
  if (!usableW || usableW <= 0) return []
  const stripW = sr.roughWidth
  const kerfW = sr.tableKerf
  const n = sr.stripsPerPanel

  const stripPx = (stripW / usableW) * SVG_STRIP_W
  const kerfPx = (kerfW / usableW) * SVG_STRIP_W

  const zones = []
  let cursor = 20
  for (let i = 0; i < n; i++) {
    if (i > 0) cursor += kerfPx
    zones.push({ x: cursor, w: stripPx })
    cursor += stripPx
  }
  return zones
})

const stripKerfW = computed(() => {
  if (!r.value || !r.value.stripResults.length) return 0
  const sr = r.value.stripResults[0]
  return (sr.tableKerf / r.value.stock.usableWidth) * SVG_STRIP_W
})

const stripWasteW = computed(() => {
  if (!r.value || !r.value.stripResults.length) return 0
  const sr = r.value.stripResults[0]
  const usableW = r.value.stock.usableWidth
  if (!usableW || usableW <= 0) return 0
  return Math.max(0, (sr.widthWaste / usableW) * SVG_STRIP_W)
})

function printInstructions() {
  window.print()
}
</script>
