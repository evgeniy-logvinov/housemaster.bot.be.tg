import fs from 'fs';
import { google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config();

const DRIVE_FOLDER_ID = '1YMk_ULhjGT_C8x_osQTNjiOIT542inRA';

function getServiceAccountFromEnv() {
  return {
    type: 'service_account',
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLIENT_ID,
    auth_uri: process.env.GOOGLE_AUTH_URI,
    token_uri: process.env.GOOGLE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.GOOGLE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.GOOGLE_CLIENT_X509_CERT_URL,
  };
}

async function getDriveClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: getServiceAccountFromEnv(),
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });
  return google.drive({ version: 'v3', auth });
}

export async function uploadToDrive(localPath: string, version: number) {
  const drive = await getDriveClient();
  const fileName = `building.v${version}.json`;
  const fileMetadata = {
    name: fileName,
    parents: [DRIVE_FOLDER_ID],
  };
  const media = {
    mimeType: 'application/json',
    body: fs.createReadStream(localPath),
  };

  // Optional: delete previous file with same name (to avoid duplicates)
  const existing = await drive.files.list({
    q: `'${DRIVE_FOLDER_ID}' in parents and name='${fileName}' and trashed=false`,
    fields: 'files(id, name)',
  });
  if (existing.data.files && existing.data.files.length > 0) {
    await drive.files.delete({ fileId: existing.data.files[0].id! });
  }

  await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: 'id',
  });
}