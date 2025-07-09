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
const squareRows = 3;
const rowGap = 10;
const floorHeight = apartmentsOffsetY + (apartmentHeight * squareRows) + (rowGap * (squareRows - 1)) + floorBottomPadding; // Height of each floor (корректно учитывает смещение)
const apartmentWidth = 140; // Width of each apartment
const margin = 20; // Margin around the SVG
const textOffset = 24; // Offset for text labels (увеличено для сдвига названия этажа ниже)
const labelToApartmentOffset = 20; // Offset between label and apartment (increased)

// Updated colors and styles
const emptyColor = '#12343b'; // Night Blue Shadow для пустых квартир
const occupiedColor = '#2d545e'; // Night Blue для занятых квартир
const textColor = '#c89666'; // Sand Tan Shadow для основного текста
const borderColor = '#e1b382'; // Sand Tan для бордера
const accentColor = '#e1b382'; // Sand Tan для номера квартиры

const backgroundGradient = `
  <defs>
    <linearGradient id="bgGradient" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#e1b382"/>
      <stop offset="100%" stop-color="#c89666"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#b0b0b0" flood-opacity="0.10"/>
    </filter>
  </defs>
`;

// Для текста внутри занятых квартир используйте белый:
const occupiedTextColor = '#fff';
// Для пустых — textColor:
const emptyTextColor = textColor;

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

// Размеры "квадрата" этажа
const squareCols = 2;
const floorsPerRow = 6; // Количество этажей в ряду

// Generate SVG content
export function generateSvg(data: any) {
  const floors = Object.keys(data).sort((a, b) => Number(a) - Number(b));
  const numRows = Math.ceil(floors.length / floorsPerRow);

  // Ширина SVG: 6 этажей в ряд
  const width = floorsPerRow * (squareCols * (apartmentWidth + 20) + 50) + margin;
  const height = numRows * floorHeight + 2 * margin;

  // Start SVG
  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">\n`;
  svg += backgroundGradient;
  svg += `  <rect x="0" y="0" width="${width}" height="${height}" fill="url(#bgGradient)" rx="24" ry="24" filter="url(#shadow)" />\n`;

  // Draw each floor
  floors.forEach((floorNumber, floorIndex) => {
    const apartments = data[floorNumber];
    const apartmentKeys = Object.keys(apartments).sort((a, b) => Number(a) - Number(b));

    // Координаты "этажа" в сетке
    const row = Math.floor(floorIndex / floorsPerRow);
    const col = floorIndex % floorsPerRow;

    // Смещение этажа по X и Y
    const floorX = margin + col * (squareCols * (apartmentWidth + 20) + 50); // 50 - отступ между этажами по горизонтали
    const floorY = margin + row * floorHeight;

    // Название этажа
    svg += `  <text x="${floorX}" y="${floorY + textOffset}" fill="#fff" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="bold" letter-spacing="1">${t.svgFloor} ${floorNumber}</text>\n`;

    // Квадратные координаты для 6 квартир (по часовой стрелке, начиная с левого нижнего)
    const squarePositions = [
      {col: 0, row: 2}, // 1
      {col: 0, row: 1}, // 2
      {col: 0, row: 0}, // 3
      {col: 1, row: 0}, // 4
      {col: 1, row: 1}, // 5
      {col: 1, row: 2}, // 6
    ];

    apartmentKeys.forEach((apartmentNumber, aptIndex) => {
      const apartment = apartments[apartmentNumber];
      const isOccupied = apartment.residents && apartment.residents.length > 0;
      const pos = squarePositions[aptIndex];

      // Координаты квартиры относительно этажа
      const x = floorX + pos.col * (apartmentWidth + 20);
      const y = floorY + textOffset + apartmentsOffsetY + pos.row * (apartmentHeight + rowGap);

      // Draw apartment rectangle with shadow and rounded corners
      svg += `  <rect x="${x}" y="${y}" width="${apartmentWidth - 10}" height="${apartmentHeight}" rx="14" ry="14" fill="${isOccupied ? occupiedColor : emptyColor}" stroke="${borderColor}" stroke-width="1.5" filter="url(#shadow)" />\n`;

      // В рендере номера квартиры используйте accentColor:
      svg += `  <text x="${x + 10}" y="${y + 24}" fill="${accentColor}" font-family="Segoe UI, Arial, sans-serif" font-size="13" font-weight="bold">${t.svgApt} ${apartmentNumber}</text>\n`;

      // Для остального текста используйте occupiedTextColor или emptyTextColor в зависимости от isOccupied.

      // Draw resident count and names
      if (isOccupied) {
        const residentLabel = getResidentLabel(apartment.residents.length, language);
        const residentsText = `${apartment.residents.length} ${residentLabel}`;
        svg += `  <text x="${x + 10}" y="${y + 44}" fill="${occupiedTextColor}" font-family="Segoe UI, Arial, sans-serif" font-size="13" font-weight="bold">${residentsText}</text>\n`;
        // Draw resident names, each on a new line
        apartment.residents.forEach((name: string, idx: number) => {
          svg += `  <text x="${x + 10}" y="${y + 64 + idx * 16}" fill="${occupiedTextColor}" font-family="Segoe UI, Arial, sans-serif" font-size="12">${name}</text>\n`;
        });
      } else {
        // ...используйте emptyTextColor для текста в пустых квартирах...
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