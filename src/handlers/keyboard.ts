import translations from '../dictionary/translations.json';

const language = (process.env.LANGUAGE as unknown as 'en' | 'ru') || 'en'; // Default to English if LANGUAGE is not set
const t = translations[language]; // Select translations based on the language

export const mainKeyboard = {
  reply_markup: {
    keyboard: [
      [{ text: t.addMeAsResident }], // Button to add the current user as a resident
      [{ text: t.removeMeAsResident }], // Button to remove the current user as a resident
      [{ text: t.getResidentsByApartment }], // Button to get residents by apartment number
      [{ text: t.addResident }], // Button to add another user as a resident
      [{ text: t.removeResidentByName }], // Button to remove another user by name
      [{ text: t.addPhoneNumber }], // Button to add a phone number
      [{ text: t.removePhoneNumber }], // Button to remove a phone number
      [{ text: t.generateBuildingImage }], // Button to generate and show building image
      [{ text: t.generateFloorImage }], // Новая кнопка
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
  const buttons = [];
  for (let i = FLOOR_RANGE.min; i <= FLOOR_RANGE.max; i++) {
    buttons.push([{ text: i.toString(), callback_data: `floor_${i}` }]);
  }
  return {
    reply_markup: {
      inline_keyboard: buttons
    }
  };
}