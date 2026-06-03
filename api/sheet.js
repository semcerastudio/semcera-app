import { google } from 'googleapis';

const HEADERS = [
  'ID', 'Fecha', 'Cliente', 'Proyecto', 'Contacto', 'Email',
  'Tipo de tarea', 'Prioridad', 'Estado', 'Deadline',
  'Archivos', 'Notas', 'Fecha cierre',
];

const STATUS_LABELS = {
  pendiente: 'Pendiente', en_espera: 'En espera', en_ejecucion: 'En ejecución',
  para_revisar: 'Para revisar', en_correccion: 'En corrección',
  aprobado: 'Aprobado', entregado: 'Entregado', cerrado: 'Cerrado',
};

function fd(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getFullYear()).slice(2)}`;
}

function toRow(r) {
  return [
    r.id || '',
    fd(r.createdAt),
    r.client || '',
    r.project || '',
    r.name || '',
    r.email || '',
    r.taskType || '',
    r.priority || '',
    STATUS_LABELS[r.status] || r.status || '',
    r.deadline ? fd(r.deadline) : '',
    (r.driveFiles || []).map(f => f.driveLink || f.name || '').filter(Boolean).join(', '),
    r.internalNotes || '',
    r.deliveredAt ? fd(r.deliveredAt) : '',
  ];
}

async function ensureHeaders(sheets, sheetId) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: 'A1:M1',
  });
  const existing = res.data.values?.[0] || [];
  if (JSON.stringify(existing) !== JSON.stringify(HEADERS)) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: 'A1',
      valueInputOption: 'RAW',
      requestBody: { values: [HEADERS] },
    });
    console.log('[sheet] Headers updated');
  }
}

async function appendRow(sheets, sheetId, r) {
  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: 'A:M',
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [toRow(r)] },
  });
}

async function updateRow(sheets, sheetId, r) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: 'A:A',
  });
  const rows = res.data.values || [];
  const rowIndex = rows.findIndex(row => row[0] === r.id);

  if (rowIndex === -1) {
    console.log('[sheet] id %s not found — appending instead', r.id);
    await appendRow(sheets, sheetId, r);
    return;
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `A${rowIndex + 1}:M${rowIndex + 1}`,
    valueInputOption: 'RAW',
    requestBody: { values: [toRow(r)] },
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  const sheetId = process.env.GOOGLE_SHEET_ID;

  if (!clientId || !clientSecret || !refreshToken) {
    console.error('[sheet] Missing OAuth2 env vars — clientId:%s clientSecret:%s refreshToken:%s',
      !!clientId, !!clientSecret, !!refreshToken);
    return res.status(500).json({ error: 'Missing GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, or GOOGLE_REFRESH_TOKEN' });
  }

  if (!sheetId) {
    console.error('[sheet] Missing GOOGLE_SHEET_ID');
    return res.status(500).json({ error: 'Missing GOOGLE_SHEET_ID' });
  }

  const { action, req: r } = req.body || {};
  if (!action || !r) {
    console.error('[sheet] Missing action or req — action:%s hasReq:%s', action, !!r);
    return res.status(400).json({ error: 'Missing action or req' });
  }

  console.log('[sheet] action=%s id=%s driveFiles=%d', action, r.id, (r.driveFiles || []).length);

  try {
    const auth = new google.auth.OAuth2(clientId, clientSecret);
    auth.setCredentials({ refresh_token: refreshToken });

    const sheets = google.sheets({ version: 'v4', auth });
    await ensureHeaders(sheets, sheetId);

    if (action === 'create') await appendRow(sheets, sheetId, r);
    else if (action === 'update') await updateRow(sheets, sheetId, r);

    console.log('[sheet] %s OK for %s', action, r.id);
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[sheet] Error: %s | status:%s | errors:%j', err.message, err.status, err.errors);
    if (err.message?.includes('insufficient authentication scopes')) {
      return res.status(500).json({
        error: 'GOOGLE_REFRESH_TOKEN is missing the spreadsheets scope. Regenerate it from OAuth Playground with https://www.googleapis.com/auth/spreadsheets added.',
      });
    }
    res.status(500).json({ error: err.message });
  }
}
