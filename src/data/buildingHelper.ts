import fs from 'fs';
import path from 'path';
import { Building } from '../types';
import { google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config();

const buildingFilePath = path.join(__dirname, 'building.json');
const DRIVE_FOLDER_ID = '1YMk_ULhjGT_C8x_osQTNjiOIT542inRA';

// Build credentials from env
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

// Upload file to Google Drive
async function uploadToDrive(localPath: string, version: number) {
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

// Load building data from JSON file
export const loadBuilding = (): Building => {
  if (!fs.existsSync(buildingFilePath)) {
    throw new Error(`Building file not found at ${buildingFilePath}`);
  }
  const data = fs.readFileSync(buildingFilePath, 'utf-8');
  return JSON.parse(data);
};

// Save building data to JSON file and upload to Google Drive
export const saveBuilding = async (building: Building) => {
  building.version = (building.version || 1) + 1;
  fs.writeFileSync(buildingFilePath, JSON.stringify(building, null, 2), 'utf-8');
  try {
    await uploadToDrive(buildingFilePath, building.version);
    console.log(`building.json uploaded to Google Drive as building.v${building.version}.json`);
  } catch (err) {
    console.error('Failed to upload building.json to Google Drive:', err);
  }
};

// Get residents by apartment number
export const getResidentsByApartment = (apartmentNumber: number): string[] => {
  const building = loadBuilding();

  for (const floor of Object.values(building.schema)) {
    if (floor[apartmentNumber]) {
      return floor[apartmentNumber].residents;
    }
  }

  throw new Error(`Apartment number ${apartmentNumber} not found.`);
};

// Get phone numbers by apartment number
export const getNumbersByApartment = (apartmentNumber: number): string[] => {
  const building = loadBuilding();

  for (const floor of Object.values(building.schema)) {
    if (floor[apartmentNumber]) {
      return floor[apartmentNumber].numbers;
    }
  }

  throw new Error(`Apartment number ${apartmentNumber} not found.`);
};