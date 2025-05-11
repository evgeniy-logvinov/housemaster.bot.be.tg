import fs from 'fs';
import path from 'path';

const buildingFilePath = path.join(__dirname, 'building.json');

// Load building data from JSON file
export const loadBuilding = (): { [floor: number]: { [apartment: number]: string[] } } => {
  if (!fs.existsSync(buildingFilePath)) {
    throw new Error(`Building file not found at ${buildingFilePath}`);
  }
  const data = fs.readFileSync(buildingFilePath, 'utf-8');
  return JSON.parse(data);
};

// Save building data to JSON file
export const saveBuilding = (building: { [floor: number]: { [apartment: number]: string[] } }) => {
  fs.writeFileSync(buildingFilePath, JSON.stringify(building, null, 2), 'utf-8');
};

// Get residents by apartment number
export const getResidentsByApartment = (apartmentNumber: number): string[] => {
  const building = loadBuilding();

  for (const floor of Object.values(building)) {
    if (floor[apartmentNumber]) {
      return floor[apartmentNumber];
    }
  }

  throw new Error(`Apartment number ${apartmentNumber} not found.`);
};