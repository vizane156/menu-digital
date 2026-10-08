import { createMatrix, zipFiles } from './assets/qr-engine.js';

// Source: assets/apple-touch-icon.png (180px), the N/H monogram derived from LOGO NYABUNGO.gif.
// Embedded so downloaded SVGs remain self-contained and printable offline.
const MONOGRAM_DATA = 'data:image/png;base64,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';
const BASE_URL = 'https://nyabungo-menu.vercel.app/';
const PALETTES = {
  cacao: { ink: '#34251e', finder: '#81401e', paper: '#fffaf0', card: '#f8f0e3', accent: '#a96532' },
  terre: { ink: '#693a28', finder: '#833b24', paper: '#fff8ef', card: '#faf0e6', accent: '#a65533' },
  foret: { ink: '#294439', finder: '#295548', paper: '#fafff6', card: '#f0f4e9', accent: '#567553' }
};
const state = { mode: 'single', palette: 'cacao', cards: [] };
const $ = selector => document.querySelector(selector);
const pad = value => String(value).padStart(2, '0');
const tableUrl = table => `${BASE_URL}?table=${pad(table)}`;

function tableValue(input) {
  const raw = input.value.trim();
  if (!/^(?:0?[1-9]|[1-9][0-9])$/.test(raw)) throw new Error('Saisissez un numéro de table entier entre 01 et 99.');
  const number = Number(raw);
  if (number < 1 || number > 99) throw new Error('Les tables doivent être numérotées de 01 à 99.');
  return number;
}
function selectedTables() {
  if (state.mode === 'single') return [tableValue($('#singleTable'))];
  const from = tableValue($('#batchStart'));
  const to = tableValue($('#batchEnd'));
  if (from > to) throw new Error('La première table doit précéder la dernière.');
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}
function finderModule(x, y, size) {
  return (x < 7 && y < 7) || (x >= size - 7 && y < 7) || (x < 7 && y >= size - 7);
}
function matrixPaths(qr) {
  const paths = { ink: [], finder: [] };
  const moduleSize = 296 / qr.size;
  const position = n => Number((n * moduleSize).toFixed(4));
  for (let y = 0; y < qr.size; y++) {
    for (let x = 0; x < qr.size;) {
      if (!qr.data[y * qr.size + x]) { x++; continue; }
      const kind = finderModule(x, y, qr.size) ? 'finder' : 'ink';
      let end = x + 1;
      while (end < qr.size && qr.data[y * qr.size + end] && (finderModule(end, y, qr.size) ? 'finder' : 'ink') === kind) end++;
      const left = 92 + position(x), top = 244 + position(y);
      const width = position(end) - position(x), height = position(y + 1) - position(y);
      paths[kind].push(`M${left} ${top}h${width}v${height}h-${width}z`);
      x = end;
    }
  }
  return { ink: paths.ink.join(''), finder: paths.finder.join('') };
}
function cardSvg(table, paletteName) {
  const palette = PALETTES[paletteName];
  const qr = createMatrix(tableUrl(table)); // QR Model 2, error correction H (high).
  const paths = matrixPaths(qr);
  const number = pad(table);
  // Quiet zone: 4 modules on each edge. Logo plate: 56 / 296 ≈ 19% of the symbol's width.
  // Finder and timing patterns are left untouched; all modules use opaque, high-contrast inks.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="105mm" height="148mm" viewBox="0 0 480 680" role="img" aria-label="Code QR pour la table ${number}">
  <rect width="480" height="680" fill="${palette.card}"/>
  <path d="M0 0h480v12H0z" fill="${palette.accent}"/>
  <rect x="19" y="23" width="442" height="634" rx="19" fill="none" stroke="#d6c6b0" stroke-width="1.4"/>
  <text x="49" y="69" fill="${palette.ink}" font-family="Arial,Helvetica,sans-serif" font-size="29" font-weight="800" letter-spacing="3">NYABUNGO</text>
  <text x="51" y="91" fill="${palette.accent}" font-family="Arial,Helvetica,sans-serif" font-size="10" font-weight="700" letter-spacing="3">HÔTEL · RESTAURANT</text>
  <path d="M49 111h382" stroke="#d8c7ae" stroke-width="1.5"/>
  <text x="50" y="145" fill="${palette.accent}" font-family="Arial,Helvetica,sans-serif" font-size="12" font-weight="700" letter-spacing="3">VOTRE TABLE</text>
  <text x="47" y="197" fill="${palette.ink}" font-family="Georgia,serif" font-size="73" font-weight="700">${number}</text>
  <circle cx="402" cy="163" r="29" fill="none" stroke="${palette.accent}" stroke-width="1.3"/>
  <path d="M391 163h22M402 152v22" stroke="${palette.accent}" stroke-width="1.5"/>
  <rect x="60" y="212" width="360" height="360" rx="17" fill="${palette.paper}" stroke="#d7c7b2" stroke-width="1.4"/>
  <g shape-rendering="crispEdges"><path d="${paths.ink}" fill="${palette.ink}"/><path d="${paths.finder}" fill="${palette.finder}"/></g>
  <rect x="212" y="364" width="56" height="56" rx="12" fill="${palette.paper}" stroke="#d8c7af" stroke-width="1.7"/>
  <image x="218" y="370" width="44" height="44" href="${MONOGRAM_DATA}" preserveAspectRatio="xMidYMid meet"/>
  <text x="240" y="610" text-anchor="middle" fill="${palette.ink}" font-family="Arial,Helvetica,sans-serif" font-size="13" font-weight="700" letter-spacing="1.3">SCANNEZ POUR CONSULTER LE MENU</text>
  <text x="240" y="632" text-anchor="middle" fill="${palette.accent}" font-family="Arial,Helvetica,sans-serif" font-size="12">nyabungo-menu.vercel.app · TABLE ${number}</text>
  </svg>`;
}
function setStatus(message, error = false) {
  const node = $('#status');
  node.textContent = message;
  node.classList.toggle('error', error);
}
function updateUrlHint(tables) {
  const first = tableUrl(tables[0]);
  $('#currentUrl').textContent = tables.length > 1 ? `${first}\n${tableUrl(tables.at(-1))}` : first;
}
function render() {
  try {
    const tables = selectedTables();
    updateUrlHint(tables);
    state.cards = tables.map(table => ({ table, svg: cardSvg(table, state.palette) }));
    const gallery = $('#gallery');
    gallery.classList.toggle('single', state.mode === 'single');
    gallery.innerHTML = state.cards.map(({ table, svg }) => `<article class="qr-card">
      <div class="card-stage">${svg}</div>
      <div class="card-meta"><strong>TABLE ${pad(table)}</strong><span>SVG · PNG · impression</span></div>
      <div class="card-actions"><button type="button" data-format="svg" data-table="${table}" aria-label="Télécharger le SVG de la table ${pad(table)}">Télécharger SVG</button>
      <button type="button" data-format="png" data-table="${table}" aria-label="Télécharger le PNG de la table ${pad(table)}">PNG haute qualité</button></div>
    </article>`).join('');
    $('#count').textContent = `${pad(tables.length)} carte${tables.length > 1 ? 's' : ''}`;
    $('#printBtn').disabled = false;
    $('#zipBtn').disabled = false;
    setStatus(`${tables.length} QR ${tables.length > 1 ? 'prêts' : 'prêt'} · chaque code pointe vers sa propre table.`);
  } catch (error) {
    state.cards = [];
    $('#gallery').innerHTML = '';
    $('#count').textContent = '—';
    $('#currentUrl').textContent = 'Numéro de table invalide';
    $('#printBtn').disabled = true;
    $('#zipBtn').disabled = true;
    setStatus(error.message || 'Impossible de générer les QR codes.', true);
  }
}
function saveBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function downloadPng(svg, filename) {
  const source = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const image = new Image();
    image.src = source;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = 1920; canvas.height = 2720; // 4× the vector viewport, ~465 dpi on A6.
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Votre navigateur ne permet pas la création du PNG. Téléchargez le SVG.');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('Impossible de créer le PNG. Téléchargez le SVG.');
    saveBlob(blob, filename);
  } finally { URL.revokeObjectURL(source); }
}
function setMode(mode) {
  state.mode = mode;
  $('#modeSingle').setAttribute('aria-pressed', String(mode === 'single'));
  $('#modeBatch').setAttribute('aria-pressed', String(mode === 'batch'));
  $('#singleFields').hidden = mode !== 'single';
  $('#batchFields').hidden = mode !== 'batch';
  $('#zipBtn').hidden = mode !== 'batch';
  $('#generateBtn span').textContent = mode === 'single' ? "Actualiser l'aperçu" : 'Générer la série';
  render();
}
$('#modeSingle').addEventListener('click', () => setMode('single'));
$('#modeBatch').addEventListener('click', () => setMode('batch'));
for (const input of ['singleTable', 'batchStart', 'batchEnd']) {
  $('#' + input).addEventListener('change', render);
  $('#' + input).addEventListener('input', () => {
    clearTimeout(render.timer);
    render.timer = setTimeout(render, 260);
  });
}
document.querySelectorAll('[data-palette]').forEach(button => button.addEventListener('click', () => {
  state.palette = button.dataset.palette;
  document.querySelectorAll('[data-palette]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  render();
}));
$('#generateBtn').addEventListener('click', render);
$('#gallery').addEventListener('click', async event => {
  const button = event.target.closest('[data-format]');
  if (!button) return;
  const card = state.cards.find(item => item.table === Number(button.dataset.table));
  if (!card) return;
  const filename = `nyabungo-table-${pad(card.table)}.${button.dataset.format}`;
  button.disabled = true;
  try {
    if (button.dataset.format === 'svg') saveBlob(new Blob([card.svg], { type: 'image/svg+xml;charset=utf-8' }), filename);
    else await downloadPng(card.svg, filename);
    setStatus(`${filename} prêt pour l'impression.`);
  } catch (error) { setStatus(error.message || 'Téléchargement impossible.', true); }
  finally { button.disabled = false; }
});
$('#zipBtn').addEventListener('click', () => {
  if (!state.cards.length) return;
  try {
    const files = Object.fromEntries(state.cards.map(({ table, svg }) => [`nyabungo-table-${pad(table)}.svg`, svg]));
    saveBlob(new Blob([zipFiles(files)], { type: 'application/zip' }), `nyabungo-tables-${pad(state.cards[0].table)}-${pad(state.cards.at(-1).table)}.zip`);
    setStatus('Archive ZIP prête : un SVG autonome par table.');
  } catch { setStatus('Impossible de préparer le ZIP.', true); }
});
$('#printBtn').addEventListener('click', () => {
  if (!state.cards.length) return;
  $('#printArea').innerHTML = state.cards.map(card => `<div class="print-sheet">${card.svg}</div>`).join('');
  window.print(); // Imprimer ou « Enregistrer au format PDF » dans le dialogue du navigateur.
});
window.addEventListener('afterprint', () => { $('#printArea').innerHTML = ''; });
render();
