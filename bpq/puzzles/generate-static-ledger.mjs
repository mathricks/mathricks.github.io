import { readFile, writeFile } from 'node:fs/promises';

const htmlPath = new URL('./index.html', import.meta.url);
const dataPath = new URL('./puzzles.json', import.meta.url);
const startMarker = '              <!-- STATIC_SOLVED_ROWS_START -->';
const endMarker = '              <!-- STATIC_SOLVED_ROWS_END -->';

const escapeHTML = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const data = JSON.parse(await readFile(dataPath, 'utf8'));
const formatBTC = (amount) => `${new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 3
}).format(amount)} BTC`;
const rows = Object.entries(data)
  .map(([number, entry]) => ({ number: Number(number), entry }))
  .filter(({ entry }) => entry.solvedDate || entry.solvedKey)
  .sort((a, b) => b.number - a.number)
  .map(({ number, entry }) => {
    const puzzleLabel = `#${number}`;
    const hasRecordPage = number === 69 || number === 135;
    const puzzleContent = hasRecordPage
      ? `<a href="/bpq/puzzles/${number}/">${puzzleLabel}</a>`
      : puzzleLabel;
    const date = entry.solvedDate
      ? `<time datetime="${escapeHTML(entry.solvedDate)}">${escapeHTML(entry.solvedDate)}</time>`
      : '—';
    const key = entry.solvedKey
      ? `<code class="key-value" title="${escapeHTML(entry.solvedKey)}">${escapeHTML(entry.solvedKey)}</code>`
      : '<span class="key-unpublished">Not published yet</span>';

    return [
      `              <tr id="puzzle-${number}">`,
      `                <th scope="row" class="puzzle-number">${puzzleContent}</th>`,
      `                <td class="reward">${formatBTC(entry.rewardBTC)}</td>`,
      '                <td><span class="status-pill status-solved">Solved</span></td>',
      `                <td class="date-cell">${date}</td>`,
      `                <td><a class="mono-link" href="https://mempool.space/address/${encodeURIComponent(entry.address)}"`,
      `                    rel="external noopener noreferrer">${escapeHTML(entry.address)}</a></td>`,
      `                <td>${key}</td>`,
      '              </tr>'
    ].join('\n');
  })
  .join('\n');

const html = await readFile(htmlPath, 'utf8');
const start = html.indexOf(startMarker);
const end = html.indexOf(endMarker);
if (start === -1 || end === -1 || end <= start) {
  throw new Error('Static ledger markers are missing or out of order.');
}

const updated = [
  html.slice(0, start),
  startMarker,
  '\n',
  rows,
  '\n',
  html.slice(end)
].join('');

await writeFile(htmlPath, updated);
console.log(`Rendered ${rows ? rows.split('<tr id=').length - 1 : 0} solved puzzle rows.`);

// Figures for the Bitcoin Puzzle Quest card inside Factoring Quest: RSA numbers,
// which reads /bpq/promo.json once a day. Only the two figures are rewritten:
// `active` (the kill switch) and any optional `headline`/`message` copy
// overrides are kept. Overrides may use {btc} and {puzzles} placeholders.
const promoPath = new URL('../promo.json', import.meta.url);
const promo = JSON.parse(await readFile(promoPath, 'utf8'));
const unsolved = Object.values(data).filter((entry) => !(entry.solvedDate || entry.solvedKey));
promo.unsolvedPuzzles = unsolved.length;
promo.unclaimedBTC = Math.round(unsolved.reduce((sum, entry) => sum + entry.rewardBTC, 0) * 1000) / 1000;
await writeFile(promoPath, `${JSON.stringify(promo, null, 2)}\n`);
console.log(`Promo figures: ${promo.unsolvedPuzzles} unsolved puzzles, ${promo.unclaimedBTC} BTC unclaimed.`);
