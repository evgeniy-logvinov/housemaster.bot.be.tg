import fs from 'fs';
import https from 'https';

const YANDEX_DISK_TOKEN = process.env.YANDEX_DISK_TOKEN;

export async function uploadToYandexDisk(localPath: string, remotePath: string) {
  if (!YANDEX_DISK_TOKEN) {
    console.log('Yandex Disk upload skipped: token not set');
    return;
  }

  const fileBuffer = fs.readFileSync(localPath);

  // 1. Получить ссылку для загрузки
  const uploadUrl = await getUploadUrl(remotePath);

  // 2. Загрузить файл по полученной ссылке
  return new Promise((resolve, reject) => {
    const url = new URL(uploadUrl);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Length': fileBuffer.length,
      },
    };

    const req = https.request(options, (res) => {
      if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
        console.log(`Uploaded to Yandex.Disk: ${remotePath}`);
        resolve(true);
      } else {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          console.error('Yandex Disk upload error:', res.statusCode, data);
          reject(new Error(`Upload failed: ${res.statusCode} ${data}`));
        });
      }
    });

    req.on('error', (err) => {
      console.error('Yandex Disk upload error:', err);
      reject(err);
    });

    req.write(fileBuffer);
    req.end();
  });
}

async function getUploadUrl(remotePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!YANDEX_DISK_TOKEN) {
      reject(new Error('YANDEX_DISK_TOKEN not set'));
      return;
    }
    const apiPath = `/v1/disk/resources/upload?path=${encodeURIComponent(remotePath)}&overwrite=true`;
    const options = {
      hostname: 'cloud-api.yandex.net',
      port: 443,
      path: apiPath,
      method: 'GET',
      headers: {
        'Authorization': `OAuth ${YANDEX_DISK_TOKEN}`,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const json = JSON.parse(data);
            resolve(json.href);
          } catch (e) {
            reject(new Error('Failed to parse upload URL response'));
          }
        } else {
          reject(new Error(`Failed to get upload URL: ${res.statusCode} ${data}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
}