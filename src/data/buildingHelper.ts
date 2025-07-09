import fs from 'fs';
import path from 'path';
import { Building } from '../types';

const buildingFilePath = path.join(__dirname, 'building.json');

// Load building data from JSON file
export const loadBuilding = (): Building => {
  if (!fs.existsSync(buildingFilePath)) {
    throw new Error(`Building file not found at ${buildingFilePath}`);
  }
  const data = fs.readFileSync(buildingFilePath, 'utf-8');
  return JSON.parse(data);
};

// Save building data to JSON file
export const saveBuilding = (building: Building) => {
  fs.writeFileSync(buildingFilePath, JSON.stringify(building, null, 2), 'utf-8');
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