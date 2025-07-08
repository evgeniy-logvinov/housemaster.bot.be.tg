export type Building = {
  [floor: number]: Floor;
};

export type Apartment = {
    residents: string[];
    numbers: string[];
};

export type Floor = {
  [apartment: number]: Apartment;
};