import { google } from 'googleapis';

const CONFIG_SHEET = '_Config';
const COUNTER_CELL = `${CONFIG_SHEET}!B1`;
const ID_PATTERN = /^SC-\d+-(\d+)$/i;

function maxIdInRows(rows) {
  let max = 0;
  for (const row of rows) {
    const match = row?.[0] && ID_PATTERN.exec(row[0].trim());
    if (match) max = Math.max(max, parseInt(match[1], 10));
  }
  return max;
}

async function migrateCounter(sheets, sheetId) {
  const info = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
  const existingSheets = info.data.sheets || [];
  const mainSheetTitle = [...existingSheets]
    .sort((a, b) => a.properties.index - b.properties.index)[0]
    .properties.title;
  const historialTitles = existingSheets
    .map(s => s.properties.title)
    .filter(t => t.startsWith('Historial - '));

  let max = 0;
  for (const title of [mainSheetTitle, ...historialTitles]) {
    try {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: `'${title}'!A:A`,
      });
      max = Math.max(max, maxIdInRows((res.data.values || []).slice(1)));
    } catch {
      // sheet unreadable — skip
    }
  }

  if (!existingSheets.find(s => s.properties.title === CONFIG_SHEET)) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: { requests: [{ addSheet: { properties: { title: CONFIG_SHEET } } }] },
    });
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: COUNTER_CELL,
    valueInputOption: 'RAW',
    requestBody: { values: [[String(max)]] },
  });

  console.log('[counter] Migrated — initial _Config!B1 = %d', max);
  return max;
}

export async function getNextId(sheets, sheetId) {
  let current;
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: COUNTER_CELL,
    });
    current = parseInt(res.data.values?.[0]?.[0], 10);
  } catch {
    current = NaN;
  }

  if (!Number.isFinite(current)) {
    current = await migrateCounter(sheets, sheetId);
  }

  const next = current + 1;

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: COUNTER_CELL,
    valueInputOption: 'RAW',
    requestBody: { values: [[String(next)]] },
  });

  const year = String(new Date().getFullYear()).slice(2);
  const num = String(next).padStart(3, '0');
  return `SC-${year}-${num}`;
}
