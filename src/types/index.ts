export type BuildingSchema = {
  [floor: number]: Floor;
};

export type Apartment = {
  residents: string[];
  numbers: string[];
};

export type Floor = {
  [apartment: number]: Apartment;
};

export type Building = {
  version: number;
  schema: BuildingSchema;
};