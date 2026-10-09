import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createMatrix } from '../assets/qr-engine.js';
import { PALETTES, qrSvg, tableUrl } from '../qr-svg.js';

const logoFile = readFileSync(new URL('../assets/logo.png', import.meta.url));

test('chaque palette exporte le QR de la bonne table et le vrai logo centré, sans fiche', () => {
  assert.equal(tableUrl(1), 'https://nyabungo-menu.vercel.app/?table=01');
  assert.equal(tableUrl(99), 'https://nyabungo-menu.vercel.app/?table=99');
  assert.notEqual(qrSvg(1), qrSvg(2));
  for (const [paletteName, palette] of Object.entries(PALETTES)) {
    for (const table of [1, 7, 99]) {
      const svg = qrSvg(table, paletteName);
      const qr = createMatrix(tableUrl(table));
      const size = qr.size + 8;
      assert.match(svg, new RegExp(`width="80mm" height="80mm" viewBox="0 0 ${size} ${size}"`));
      assert.ok(svg.includes(`<rect width="${size}" height="${size}" fill="${palette.paper}"/>`));
      assert.ok(svg.includes(`fill="${palette.ink}"`));
      assert.ok(svg.includes(`fill="${palette.finder}"`));
      assert.doesNotMatch(svg, /<text\b|<circle\b|NYABUNGO|HÔTEL|RESTAURANT|SCANNEZ/i);

      const logo = svg.match(/<image x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)" href="data:image\/png;base64,([^"]+)"/);
      assert.ok(logo, 'le SVG doit intégrer le logo sans ressource externe');
      assert.deepEqual(Buffer.from(logo[5], 'base64'), logoFile);
      const center = 4 + qr.size / 2;
      assert.equal(Number(logo[1]) + Number(logo[3]) / 2, center);
      assert.equal(Number(logo[2]) + Number(logo[4]) / 2, center);
      assert.equal(Number(logo[3]), 8);
      assert.match(svg, new RegExp(`<rect x="${center - 4.5}" y="${center - 4.5}" width="9" height="9" fill="#fff"/>`));
      assert.equal((svg.match(/<image\b/g) || []).length, 1);

      // Both colored SVG paths combined must match the QR matrix exactly;
      // the quiet zone remains four empty modules on each side.
      const filled = new Set();
      const runs = [...svg.matchAll(/M(\d+) (\d+)h(\d+)v1h-(\d+)z/g)];
      assert.ok(runs.length > 0);
      for (const [, left, top, width, back] of runs) {
        assert.equal(width, back);
        for (let x = Number(left); x < Number(left) + Number(width); x++) filled.add(`${x},${top}`);
      }
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const dark = x >= 4 && x < size - 4 && y >= 4 && y < size - 4 &&
            Boolean(qr.data[(y - 4) * qr.size + x - 4]);
          assert.equal(filled.has(`${x},${y}`), dark, `${paletteName} table ${table} : module ${x},${y}`);
        }
      }
    }
  }
  assert.throws(() => qrSvg(1, 'inconnue'), /Couleur/);
});
