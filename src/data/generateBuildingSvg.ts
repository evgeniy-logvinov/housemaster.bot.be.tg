import fs from 'fs';
import translations from './translations.json';

const language = (process.env.LANGUAGE as unknown as 'en' | 'ru') || 'en';
const t = translations[language];

// Load JSON data
const buildingData = require('./building.json');

// Configuration
const floorBottomPadding = 30; // Extra space after apartments
const apartmentHeight = 110; // Height of each apartment
const apartmentsOffsetY = 32; // Смещение квартир вниз относительно названия этажа
const floorHeight = apartmentsOffsetY + apartmentHeight + floorBottomPadding; // Height of each floor (корректно учитывает смещение)
const apartmentWidth = 140; // Width of each apartment
const margin = 20; // Margin around the SVG
const textOffset = 24; // Offset for text labels (увеличено для сдвига названия этажа ниже)
const labelToApartmentOffset = 20; // Offset between label and apartment (increased)

// Updated colors and styles
const emptyColor = '#f4f5f7'; // Modern light gray for empty apartments
const occupiedColor = '#6ee7b7'; // Soft green for occupied apartments
const textColor = '#22223b'; // Deep blue-gray for text
const borderColor = '#b5b5c3'; // Subtle border for apartments
const backgroundGradient = `
  <defs>
    <linearGradient id="bgGradient" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fdf6e3"/>
      <stop offset="100%" stop-color="#e0c3fc"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#b0b0b0" flood-opacity="0.18"/>
    </filter>
  </defs>
`;

function getResidentLabel(count: number, lang: string) {
  if (lang === 'ru') {
    if (count % 10 === 1 && count % 100 !== 11) return t.svgResidentOne;
    if (
      [2, 3, 4].includes(count % 10) &&
      ![12, 13, 14].includes(count % 100)
    )
      return t.svgResidentFew;
    return t.svgResidentMany;
  } else {
    return count === 1 ? t.svgResidentOne : t.svgResidentMany;
  }
}

// Generate SVG content
export function generateSvg(data: any) {
  // Get floors (sorted numerically)
  const floors = Object.keys(data).sort((a, b) => Number(a) - Number(b));
  
  // Calculate the maximum number of apartments on any floor
  const maxApartments = Math.max(...Object.values(data).map((floor: any) => Object.keys(floor).length));

  // Calculate SVG width dynamically
  const width = maxApartments * apartmentWidth + 2 * margin;

  // Calculate SVG height
  const height = floors.length * floorHeight + 2 * margin;

  // Start SVG
  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">\n`;
  svg += backgroundGradient;
  svg += `  <rect x="0" y="0" width="${width}" height="${height}" fill="url(#bgGradient)" rx="24" ry="24" filter="url(#shadow)" />\n`;

  // Draw each floor
  floors.forEach((floorNumber, floorIndex) => {
    const apartments = data[floorNumber];
    const apartmentKeys = Object.keys(apartments).sort((a, b) => Number(a) - Number(b));

    // Draw floor label
    svg += `  <text x="${margin}" y="${margin + floorIndex * floorHeight + textOffset}" fill="${textColor}" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="bold">${t.svgFloor} ${floorNumber}</text>\n`;

    // Draw apartments
    apartmentKeys.forEach((apartmentNumber, aptIndex) => {
      const apartment = apartments[apartmentNumber];
      const isOccupied = apartment.residents && apartment.residents.length > 0;

      // Calculate position
      const x = margin + aptIndex * apartmentWidth;
      const y = margin + floorIndex * floorHeight + textOffset + apartmentsOffsetY; // increased offset for apartments

      // Draw apartment rectangle with shadow and rounded corners
      svg += `  <rect x="${x}" y="${y}" width="${apartmentWidth - 10}" height="${apartmentHeight}" rx="14" ry="14" fill="${isOccupied ? occupiedColor : emptyColor}" stroke="${borderColor}" stroke-width="1.5" filter="url(#shadow)" />\n`;

      // Draw apartment number
      svg += `  <text x="${x + 10}" y="${y + 24}" fill="${textColor}" font-family="Segoe UI, Arial, sans-serif" font-size="13" font-weight="bold">${t.svgApt} ${apartmentNumber}</text>\n`;

      // Use a dark color for text on green background
      const occupiedTextColor = '#22223b';

      // Draw resident count and names
      if (isOccupied) {
        const residentLabel = getResidentLabel(apartment.residents.length, language);
        const residentsText = `${apartment.residents.length} ${residentLabel}`;
        svg += `  <text x="${x + 10}" y="${y + 44}" fill="${occupiedTextColor}" font-family="Segoe UI, Arial, sans-serif" font-size="13" font-weight="bold">${residentsText}</text>\n`;
        // Draw resident names, each on a new line
        apartment.residents.forEach((name: string, idx: number) => {
          svg += `  <text x="${x + 10}" y="${y + 64 + idx * 16}" fill="${occupiedTextColor}" font-family="Segoe UI, Arial, sans-serif" font-size="12">${name}</text>\n`;
        });
      }
    });
  });

  // Close SVG
  svg += '</svg>';
  return svg;
}

// Generate and save the SVG
const svgContent = generateSvg(buildingData);
fs.writeFileSync('building.svg', svgContent);
console.log('SVG generated: building.svg');