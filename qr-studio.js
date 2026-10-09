import { zipFiles } from './assets/qr-engine.js';
import { pad, tableUrl, qrSvg } from './qr-svg.js?v=3';

const state = { mode: 'single', palette: 'cacao', cards: [] };
const $ = selector => document.querySelector(selector);

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
    state.cards = tables.map(table => ({ table, svg: qrSvg(table, state.palette) }));
    const gallery = $('#gallery');
    gallery.classList.toggle('single', state.mode === 'single');
    gallery.innerHTML = state.cards.map(({ table, svg }) => `<article class="qr-card">
      <div class="card-stage">${svg}</div>
      <div class="card-meta"><strong>Fichier : qr-table-${pad(table)}</strong><span>Repère non inclus dans le QR</span></div>
      <div class="card-actions"><button type="button" data-format="svg" data-table="${table}" aria-label="Télécharger le SVG de la table ${pad(table)}">Télécharger SVG</button>
      <button type="button" data-format="png" data-table="${table}" aria-label="Télécharger le PNG de la table ${pad(table)}">PNG haute qualité</button></div>
    </article>`).join('');
    $('#count').textContent = `${pad(tables.length)} QR`;
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
    canvas.width = 1600; canvas.height = 1600; // Square QR, ~508 dpi at 80 mm.
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Votre navigateur ne permet pas la création du PNG. Téléchargez le SVG.');
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
  const filename = `qr-table-${pad(card.table)}.${button.dataset.format}`;
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
    const files = Object.fromEntries(state.cards.map(({ table, svg }) => [`qr-table-${pad(table)}.svg`, svg]));
    saveBlob(new Blob([zipFiles(files)], { type: 'application/zip' }), `qr-tables-${pad(state.cards[0].table)}-${pad(state.cards.at(-1).table)}.zip`);
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
