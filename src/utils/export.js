/**
 * Export the current project state to a JSON file download.
 */
export function exportProject(state) {
  const data = JSON.stringify({
    stock: state.stock,
    parts: state.parts,
    settings: state.settings,
    resawStock: state.resawStock,
    resawSettings: state.resawSettings,
    crosscutSettings: state.crosscutSettings,
    resawSkus: state.resawSkus,
  }, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `yield-plan-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Trigger a file picker and import project from JSON.
 * onLoad(data) is called with the parsed object on success.
 */
export function importProject(onLoad) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        onLoad(data);
      } catch {
        alert('Invalid file — could not parse JSON.');
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

/**
 * Print the results view.
 */
export function printResults() {
  window.print();
}
