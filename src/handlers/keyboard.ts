import translations from '../dictionary/translations.json';
import { loadBuilding } from '../data/buildingHelper';

const language = (process.env.LANGUAGE as unknown as 'en' | 'ru') || 'en'; // Default to English if LANGUAGE is not set
const t = translations[language]; // Select translations based on the language

export const mainKeyboard = {
  reply_markup: {
    keyboard: [
      [{ text: t.generateBuildingImage }], // Button to generate and show building image
      [{ text: t.generateFloorImage }], // Новая кнопка
      [{ text: t.getResidentsByApartment }], // Button to get residents by apartment number
      [{ text: t.addMeAsResident }], // Button to add the current user as a resident
      [{ text: t.removeMeAsResident }], // Button to remove the current user as a resident
      [{ text: t.addPhoneNumber }], // Button to add a phone number
      [{ text: t.removePhoneNumber }], // Button to remove a phone number
      [{ text: t.addResident }], // Button to add another user as a resident
      [{ text: t.removeResidentByName }], // Button to remove another user by name
      [{ text: t.closeKeyboard }], // Новая кнопка
    ],
    resize_keyboard: true,
    one_time_keyboard: false
  }
};

export const cancelKeyboard = {
  reply_markup: {
    keyboard: [[{ text: t.cancel }]],
    resize_keyboard: true,
    one_time_keyboard: true,
  },
};

const FLOOR_RANGE = {
  min: parseInt(process.env.FLOOR_MIN || '2', 10),
  max: parseInt(process.env.FLOOR_MAX || '23', 10),
};

export function getFloorInlineKeyboard() {
  const buttons: { text: string; callback_data: string }[] = [];
  for (let i = FLOOR_RANGE.min; i <= FLOOR_RANGE.max; i++) {
    buttons.push({ text: i.toString(), callback_data: `floor_${i}` });
  }

  const inline_keyboard: { text: string; callback_data: string }[][] = [];
  for (let i = 0; i < buttons.length; i += 5) {
    inline_keyboard.push(buttons.slice(i, i + 5));
  }

  return {
    reply_markup: {
      inline_keyboard
    }
  };
}

export function getApartmentInlineKeyboard() {
  const building = loadBuilding();
  const schema: Record<string, Record<string, any>> = building.schema;
  const buttons: { text: string; callback_data: string }[] = [];

  for (const floor of Object.keys(schema).sort((a, b) => Number(a) - Number(b))) {
    for (const apt of Object.keys(schema[floor]).sort((a, b) => Number(a) - Number(b))) {
      buttons.push({
        text: `${floor}-${apt}`,
        callback_data: `apt_${floor}_${apt}`
      });
    }
  }

  const inline_keyboard: { text: string; callback_data: string }[][] = [];
  for (let i = 0; i < buttons.length; i += 6) {
    inline_keyboard.push(buttons.slice(i, i + 6));
  }

  return {
    reply_markup: {
      inline_keyboard
    }
  };
}

export function getApartmentRangeKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Квартиры 1–61', callback_data: 'aptrange_1_61' }],
        [{ text: 'Квартиры 62–132', callback_data: 'aptrange_62_132' }]
      ]
    }
  };
}

export function getApartmentsByRangeKeyboard(start: number, end: number) {
  const building = loadBuilding();
  const schema: Record<string, Record<string, any>> = building.schema;
  const buttons: { text: string; callback_data: string }[] = [];

  for (let num = start; num <= end; num++) {
    // Найти этаж и квартиру по номеру
    for (const floor of Object.keys(schema)) {
      if (schema[floor][num]) {
        buttons.push({
          text: `${num}`,
          callback_data: `aptselect_${num}`
        });
        break;
      }
    }
  }

  const inline_keyboard: { text: string; callback_data: string }[][] = [];
  for (let i = 0; i < buttons.length; i += 6) {
    inline_keyboard.push(buttons.slice(i, i + 6));
  }

  return {
    reply_markup: {
      inline_keyboard
    }
  };
}
