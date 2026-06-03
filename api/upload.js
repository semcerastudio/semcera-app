import { google } from 'googleapis';
import busboy from 'busboy';
import { Readable } from 'stream';

export const config = {
  api: {
    bodyParser: false,
  },
};

const FOLDER_ID = '11zznxsGlD2OWGFeQ_t_Cl2eOl1F8V3hl';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    console.error('[upload] Missing env vars — clientId:%s clientSecret:%s refreshToken:%s',
      !!clientId, !!clientSecret, !!refreshToken);
    return res.status(500).json({
      error: 'Missing GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET or GOOGLE_REFRESH_TOKEN. See OAUTH_SETUP.md.',
    });
  }

  try {
    const auth = new google.auth.OAuth2(clientId, clientSecret);
    auth.setCredentials({ refresh_token: refreshToken });

    // Verify token exchange before attempting upload
    let accessToken;
    try {
      const result = await auth.getAccessToken();
      accessToken = result.token;
      console.log('[upload] OAuth2 token obtained: %s', !!accessToken);
    } catch (tokenErr) {
      console.error('[upload] OAuth2 token refresh failed:', tokenErr.message, tokenErr.response?.data);
      return res.status(500).json({ error: `OAuth2 token refresh failed: ${tokenErr.message}` });
    }

    const drive = google.drive({ version: 'v3', auth });
    const files = await parseAndUpload(req, drive);
    console.log('[upload] Done — %d file(s) uploaded', files.length);
    res.status(200).json({ files });
  } catch (err) {
    console.error('[upload] Unhandled error:', err.message, err.errors || '', err.stack);
    res.status(500).json({ error: err.message });
  }
}

function parseAndUpload(req, drive) {
  return new Promise((resolve, reject) => {
    const contentType = req.headers['content-type'] || '';
    console.log('[upload] Content-Type: %s', contentType);

    if (!contentType.includes('multipart/form-data')) {
      return reject(new Error(`Expected multipart/form-data, got: ${contentType}`));
    }

    const bb = busboy({ headers: req.headers, limits: { fileSize: 10 * 1024 * 1024 } });
    const uploads = [];
    let fileCount = 0;

    bb.on('file', (_field, fileStream, info) => {
      const safeName = info.filename || `upload-${Date.now()}`;
      const safeMime = info.mimeType || 'application/octet-stream';
      fileCount++;
      console.log('[upload] File %d: name="%s" mimeType="%s"', fileCount, safeName, safeMime);

      const chunks = [];
      const uploadPromise = new Promise((ok, fail) => {
        fileStream.on('data', chunk => chunks.push(chunk));
        fileStream.on('end', async () => {
          const buffer = Buffer.concat(chunks);
          console.log('[upload] "%s" buffered %d bytes — calling Drive API...', safeName, buffer.length);
          try {
            const createRes = await drive.files.create({
              requestBody: { name: safeName, parents: [FOLDER_ID] },
              media: { mimeType: safeMime, body: Readable.from(buffer) },
              fields: 'id,name,webViewLink',
            });
            console.log('[upload] Drive create OK: id=%s', createRes.data.id);

            await drive.permissions.create({
              fileId: createRes.data.id,
              requestBody: { role: 'reader', type: 'anyone' },
            });
            console.log('[upload] Permissions set for %s', createRes.data.id);

            ok({ name: createRes.data.name, driveId: createRes.data.id, driveLink: createRes.data.webViewLink });
          } catch (driveErr) {
            console.error('[upload] Drive API error for "%s": %s — errors: %j — status: %s',
              safeName, driveErr.message, driveErr.errors, driveErr.status);
            fail(driveErr);
          }
        });
        fileStream.on('error', err => {
          console.error('[upload] File stream error for "%s":', safeName, err.message);
          fail(err);
        });
      });
      uploads.push(uploadPromise);
    });

    bb.on('finish', () => {
      console.log('[upload] Busboy finished — %d file(s) detected', fileCount);
      Promise.all(uploads).then(resolve).catch(reject);
    });
    bb.on('error', err => {
      console.error('[upload] Busboy error:', err.message);
      reject(err);
    });

    req.pipe(bb);
  });
}
