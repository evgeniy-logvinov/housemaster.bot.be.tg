import fs from 'fs';
import path from 'path';
import { Building } from '../types';
import dotenv from 'dotenv';
import { generateSvg } from '../data/generateBuildingSvg';
import sharp from 'sharp';
import translationsData from '../dictionary/translations.json';
import { mainKeyboard } from '../handlers/keyboard';
import TelegramBot from 'node-telegram-bot-api';
import { uploadToYandexDisk } from '../backup/yandex';
import logger from '../logger';

dotenv.config();

const language = (process.env.LANGUAGE as unknown as 'en' | 'ru') || 'en';
const translations = translationsData[language];

const buildingFilePath = path.join(__dirname, 'building.json');
const yandexDiskFolder = process.env.YANDEX_DISK_FOLDER || '/housemaster';

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
  // Upload to Yandex Disk and don't wait for completion
  const remotePath = `${yandexDiskFolder}/building.v${building.version}.json`;
  uploadToYandexDisk(buildingFilePath, remotePath)
    .then(() => logger.info('building.json uploaded to Yandex Disk'))
    .catch((err) => logger.error('Failed to upload building.json:', err));
  // Here you can immediately return/respond to the user
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