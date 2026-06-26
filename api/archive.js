import { google } from 'googleapis';

const HEADERS = [
  'ID', 'Fecha', 'Cliente', 'Proyecto', 'Contacto', 'Email',
  'Tipo de tarea', 'Prioridad', 'Estado', 'Deadline',
  'Archivos', 'Referencias', 'Notas', 'Fecha cierre', 'Responsable', 'Descripción',
];

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const STATUS_REVERSE = {
  'Pendiente': 'pendiente', 'En espera': 'en_espera', 'En ejecución': 'en_ejecucion',
  'Para revisar': 'para_revisar', 'En corrección': 'en_correccion',
  'Aprobado': 'aprobado', 'Entregado': 'entregado', 'Cerrado': 'cerrado',
};

function parseFd(str) {
  if (!str) return null;
  const parts = str.split('.');
  if (parts.length !== 3) return null;
  const [d, m, y] = parts;
  return `20${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T12:00:00.000Z`;
}

function rowToOrder([id, fecha, client, project, name, email, taskType, priority, status, deadline, archivos, referencias, internalNotes, fechaCierre, responsable, descripcion]) {
  return {
    id,
    createdAt: parseFd(fecha),
    client,
    project,
    name,
    email,
    taskType,
    priority,
    status: STATUS_REVERSE[status] || status || 'cerrado',
    deadline: deadline ? parseFd(deadline) : null,
    driveFiles: archivos ? archivos.split(', ').filter(Boolean).map(n => ({ name: n })) : [],
    files: referencias || '',
    internalNotes: internalNotes || '',
    deliveredAt: fechaCierre ? parseFd(fechaCierre) : null,
    responsable: responsable || '',
    desc: descripcion || '',
  };
}

export default async function handler(req, res) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  const sheetId = process.env.GOOGLE_SHEET_ID;

  if (!clientId || !clientSecret || !refreshToken || !sheetId) {
    return res.status(500).json({ error: 'Missing Google credentials or GOOGLE_SHEET_ID' });
  }

  const auth = new google.auth.OAuth2(clientId, clientSecret);
  auth.setCredentials({ refresh_token: refreshToken });
  const sheets = google.sheets({ version: 'v4', auth });

  try {
    // ── GET ──────────────────────────────────────────────────────────────────
    if (req.method === 'GET') {
      const action = req.query?.action;
      const sheetName = req.query?.sheet;

      if (action === 'list') {
        const info = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
        const histSheets = (info.data.sheets || [])
          .map(s => s.properties.title)
          .filter(t => t.startsWith('Historial - '))
          .sort();
        return res.status(200).json({ sheets: histSheets });
      }

      if (action === 'read' && sheetName) {
        try {
          const response = await sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            range: `'${sheetName}'!A:P`,
          });
          const rows = response.data.values || [];
          const orders = rows.length > 1
            ? rows.slice(1).filter(r => r[0]).map(rowToOrder)
            : [];
          return res.status(200).json({ orders });
        } catch {
          return res.status(200).json({ orders: [] });
        }
      }

      return res.status(400).json({ error: 'Missing or unknown action' });
    }

    // ── POST — archive ────────────────────────────────────────────────────────
    if (req.method === 'POST') {
      const now = new Date();
      const histSheetName = `Historial - ${MONTHS_ES[now.getMonth()]} ${now.getFullYear()}`;

      // 1. Read all rows from main sheet
      const mainData = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: 'A:P',
      });
      const allRows = mainData.data.values || [];
      if (allRows.length <= 1) {
        return res.status(200).json({ ok: true, archived: 0, sheetName: histSheetName });
      }

      // 2. Identify closed rows (Estado column = index 8)
      const closedRows = [];
      const closedRowNums = []; // 1-based row numbers in the sheet
      allRows.slice(1).forEach((row, i) => {
        if ((row[8] || '').trim() === 'Cerrado' && row[0]) {
          closedRows.push(row);
          closedRowNums.push(i + 2); // offset: +1 for 0-index, +1 for header row
        }
      });

      if (closedRows.length === 0) {
        return res.status(200).json({ ok: true, archived: 0, sheetName: histSheetName });
      }

      // 3. Fetch spreadsheet metadata to get main sheet's numeric ID
      const ssInfo = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
      const existingSheets = ssInfo.data.sheets || [];
      const mainSheetApiId = [...existingSheets]
        .sort((a, b) => a.properties.index - b.properties.index)[0]
        .properties.sheetId;

      // 4. Create history sheet if it doesn't exist yet
      if (!existingSheets.find(s => s.properties.title === histSheetName)) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: sheetId,
          requestBody: {
            requests: [{ addSheet: { properties: { title: histSheetName } } }],
          },
        });
      }

      // 5. Write headers to history sheet if missing
      const histHeaderRes = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: `'${histSheetName}'!A1:P1`,
      });
      if (JSON.stringify(histHeaderRes.data.values?.[0] || []) !== JSON.stringify(HEADERS)) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: sheetId,
          range: `'${histSheetName}'!A1`,
          valueInputOption: 'RAW',
          requestBody: { values: [HEADERS] },
        });
      }

      // 6. Append closed rows to history sheet
      await sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: `'${histSheetName}'!A:P`,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: closedRows },
      });

      // 7. Delete closed rows from main sheet — process bottom-to-top so indices don't shift
      const deleteRequests = [...closedRowNums]
        .sort((a, b) => b - a)
        .map(rowNum => ({
          deleteDimension: {
            range: {
              sheetId: mainSheetApiId,
              dimension: 'ROWS',
              startIndex: rowNum - 1, // 0-based inclusive
              endIndex: rowNum,        // 0-based exclusive
            },
          },
        }));
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: sheetId,
        requestBody: { requests: deleteRequests },
      });

      console.log('[archive] %d orders moved to "%s"', closedRows.length, histSheetName);
      return res.status(200).json({ ok: true, archived: closedRows.length, sheetName: histSheetName });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[archive] Error: %s', err.message);
    return res.status(500).json({ error: err.message });
  }
}
