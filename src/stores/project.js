import { defineStore } from 'pinia'
import { ref } from 'vue'
import { solve } from '@/solver'
import { parseFraction } from '@/utils/fractions'
import { solveResaw } from '@/resawSolver'

export const useProjectStore = defineStore('project', () => {
  // ─── Settings ──────────────────────────────────────────────────────────────
  const settings = ref({
    kerf: 0.125,
    planingAllowance: 0.0625,
    conditionAllowances: {
      'rough':       { thickness: 0.25,   width: 0.25  },
      'skip-planed': { thickness: 0.125,  width: 0.25  },
      's3s':         { thickness: 0.0625, width: 0.125 },
      's4s':         { thickness: 0,      width: 0     },
    },
  })

  // ─── Stock (sample data pre-filled) ────────────────────────────────────────
  const stock = ref([
    {
      id: 's1',
      label: 'Board 1',
      lengthStr: '96',
      widthStr: '8',
      thicknessStr: '1 1/2',
      qty: 1,
      condition: 'skip-planed',
    },
  ])

  // ─── Parts (sample data pre-filled) ────────────────────────────────────────
  const parts = ref([
    { id: 'p1', label: 'Leg',  lengthStr: '28', widthStr: '1 3/4', thicknessStr: '1 1/2', qty: 4 },
    { id: 'p2', label: 'Rail', lengthStr: '36', widthStr: '3',     thicknessStr: '3/4',   qty: 2 },
  ])

  const results  = ref(null)
  const activeTab = ref('input') // 'input' | 'results'
  const nextId   = ref(10)

  // ─── Stock management ──────────────────────────────────────────────────────
  function addStock() {
    stock.value.push({
      id: `s${nextId.value++}`,
      label: `Board ${stock.value.length + 1}`,
      lengthStr: '96',
      widthStr: '8',
      thicknessStr: '1 1/2',
      qty: 1,
      condition: 'skip-planed',
    })
  }

  function removeStock(id) {
    stock.value = stock.value.filter(s => s.id !== id)
  }

  // ─── Parts management ──────────────────────────────────────────────────────
  function addPart() {
    parts.value.push({
      id: `p${nextId.value++}`,
      label: `Part ${parts.value.length + 1}`,
      lengthStr: '24',
      widthStr: '3',
      thicknessStr: '3/4',
      qty: 1,
    })
  }

  function removePart(id) {
    parts.value = parts.value.filter(p => p.id !== id)
  }

  // ─── Calculate ─────────────────────────────────────────────────────────────
  function calculate() {
    const parsedStock = stock.value.map(s => ({
      ...s,
      length:    parseFraction(s.lengthStr),
      width:     parseFraction(s.widthStr),
      thickness: parseFraction(s.thicknessStr),
    }))

    const parsedParts = parts.value.map(p => ({
      ...p,
      length:    parseFraction(p.lengthStr),
      width:     parseFraction(p.widthStr),
      thickness: parseFraction(p.thicknessStr),
    }))

    results.value  = solve({ stock: parsedStock, parts: parsedParts, settings: settings.value })
    activeTab.value = 'results'
  }

  // ─── Import / Export ────────────────────────────────────────────────────────
  function loadProject(data) {
    if (data.stock)    stock.value    = data.stock
    if (data.parts)    parts.value    = data.parts
    if (data.settings) settings.value = data.settings
    if (data.resawStock)    resawStock.value    = data.resawStock
    if (data.resawSettings) resawSettings.value = data.resawSettings
    if (data.resawSkus)     resawSkus.value     = data.resawSkus
    if (data.crosscutSettings) {
      crosscutSettings.value = {
        blankLengths:   data.crosscutSettings.blankLengths   ?? ['36'],
        miterKerfStr:   data.crosscutSettings.miterKerfStr   ?? '1/8',
        snipeBufferStr: data.crosscutSettings.snipeBufferStr ?? '0',
      }
    }
    results.value      = null
    resawResults.value = null
    activeTab.value    = 'input'
  }

  // ─── Resaw Planner ─────────────────────────────────────────────────────────
  const resawStock = ref({
    qty: 5,
    thicknessStr: '1 15/16',
    widthStr: '7',
    lengthStr: '120',
    condition: 'skip-planed',
  })

  const resawSettings = ref({
    kerfStr: '1/16',
    panelTargetStr: '3/8',
    slabAllowanceStr: '0.010',
  })

  const crosscutSettings = ref({
    blankLengths: ['36', '24'],  // multiple acceptable blank lengths for optimizer
    miterKerfStr: '1/8',
    snipeBufferStr: '2',          // extra length per blank to account for planer snipe / safety
  })

  const defaultSkus = [
    { id: 'sku1', name: 'Standard 12"', roughWidthStr: '0.150', planeAllowance: 0.010, sanderAllowance: 0.010, finalWidthStr: '0.130', length: 12, tableKerfStr: '1/8' },
    { id: 'sku2', name: 'Wide 12"',     roughWidthStr: '0.800', planeAllowance: 0.025, sanderAllowance: 0.025, finalWidthStr: '0.750', length: 12, tableKerfStr: '1/8' },
    { id: 'sku3', name: 'Standard 24"', roughWidthStr: '0.150', planeAllowance: 0.010, sanderAllowance: 0.010, finalWidthStr: '0.130', length: 24, tableKerfStr: '1/8' },
    { id: 'sku4', name: 'Wide 24"',     roughWidthStr: '0.800', planeAllowance: 0.025, sanderAllowance: 0.025, finalWidthStr: '0.750', length: 24, tableKerfStr: '1/8' },
  ]

  const resawSkus = ref([...defaultSkus])
  const resawResults = ref(null)
  const resawError = ref(null)

  function addResawSku() {
    resawSkus.value.push({
      id: `rsku${nextId.value++}`,
      name: 'New SKU',
      roughWidthStr: '0.150',
      planeAllowance: 0.010,
      sanderAllowance: 0.010,
      finalWidthStr: '0.130',
      length: 12,
      tableKerfStr: '1/8',
    })
  }

  function removeResawSku(id) {
    resawSkus.value = resawSkus.value.filter(s => s.id !== id)
  }

  function calculateResaw() {
    resawError.value = null
    // Validate SKU geometry
    for (const s of resawSkus.value) {
      const rough = parseFraction(s.roughWidthStr)
      const final = parseFraction(s.finalWidthStr)
      if (final >= rough) {
        resawError.value = `SKU "${s.name}": Final face (${final}") must be less than rough rip face (${rough}"). Check plane and sander allowances.`
        resawResults.value = null
        return
      }
    }
    try {
    resawResults.value = solveResaw({
      stock: {
        thickness: parseFraction(resawStock.value.thicknessStr),
        width:     parseFraction(resawStock.value.widthStr),
        length:    parseFraction(resawStock.value.lengthStr),
        qty:       resawStock.value.qty,
        condition: resawStock.value.condition,
      },
      resawSettings: {
        kerf:          parseFraction(resawSettings.value.kerfStr),
        panelTarget:   parseFraction(resawSettings.value.panelTargetStr),
        slabAllowance: parseFraction(resawSettings.value.slabAllowanceStr),
      },
      crosscutSettings: {
        // Add snipe buffer to each blank length before optimizer runs
        blankLengths: crosscutSettings.value.blankLengths
          .map(s => parseFraction(s) + parseFraction(crosscutSettings.value.snipeBufferStr))
          .filter(l => l > 0),
        blankTargetLengths: crosscutSettings.value.blankLengths.map(s => parseFraction(s)).filter(l => l > 0), // nominal (without buffer)
        snipeBuffer: parseFraction(crosscutSettings.value.snipeBufferStr),
        miterKerf:    parseFraction(crosscutSettings.value.miterKerfStr),
      },
      stripSettings: resawSkus.value.map(s => ({
        ...s,
        roughWidth: parseFraction(s.roughWidthStr),
        finalWidth: parseFraction(s.finalWidthStr),
        tableKerf:  parseFraction(s.tableKerfStr),
        depth:      parseFraction(resawSettings.value.panelTargetStr),
      })),
    })
    } catch(e) {
      console.error('[calculateResaw]', e)
      resawResults.value = null
      resawError.value = e.message || 'Unknown error'
    }
  }

  function addBlankLength() { crosscutSettings.value.blankLengths.push('12') }
  function removeBlankLength(i) { if (crosscutSettings.value.blankLengths.length > 1) crosscutSettings.value.blankLengths.splice(i, 1) }

  return {
    settings, stock, parts, results, activeTab,
    addStock, removeStock, addPart, removePart,
    calculate, loadProject,
    // Resaw Planner
    resawStock, resawSettings, crosscutSettings, resawSkus, resawResults, resawError,
    addBlankLength, removeBlankLength,
    addResawSku, removeResawSku, calculateResaw,
  }
})
