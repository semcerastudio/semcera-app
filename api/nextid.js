import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  const sheetId = process.env.GOOGLE_SHEET_ID;

  if (!clientId || !clientSecret || !refreshToken || !sheetId) {
    return res.status(500).json({ error: 'Missing Google OAuth2 env vars' });
  }

  try {
    const auth = new google.auth.OAuth2(clientId, clientSecret);
    auth.setCredentials({ refresh_token: refreshToken });
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'A:A',
    });

    const rows = response.data.values || [];
    const dataRows = rows.length > 0 ? rows.slice(1) : [];
    const num = String(dataRows.length).padStart(3, '0');
    const year = String(new Date().getFullYear()).slice(2);

    res.status(200).json({ id: `SC-${year}-${num}` });
  } catch (err) {
    console.error('[nextid] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
