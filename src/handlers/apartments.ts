import TelegramBot from 'node-telegram-bot-api';
import { mainKeyboard } from './keyboard';

// Centralized storage for apartments and their residents
const apartments: { [key: number]: string[] } = {}; // Key: apartment number, Value: array of residents

// Building structure
const building: { [floor: number]: { [apartment: number]: string[] } } = {};

// Initialize the building structure
for (let floor = 2; floor <= 23; floor++) {
  building[floor] = {};
  for (let apartment = 1; apartment <= 6; apartment++) {
    const apartmentNumber = floor * 100 + apartment; // Generate apartment number (e.g., 201, 202, ..., 2306)
    building[floor][apartmentNumber] = []; // Initialize with an empty array of residents
  }
}

export const handleAddApartment = (bot: TelegramBot, chatId: number) => {
  bot.sendMessage(chatId, 'Enter the apartment number:');
  bot.once('message', (response) => {
    const text = response.text || '';
    const apartmentNumber = parseInt(text, 10);

    if (!isNaN(apartmentNumber)) {
      if (apartments[apartmentNumber]) {
        bot.sendMessage(chatId, `Apartment number ${apartmentNumber} already exists.`, mainKeyboard);
      } else {
        apartments[apartmentNumber] = []; // Initialize with an empty array of residents
        bot.sendMessage(chatId, `Apartment number ${apartmentNumber} has been successfully added!`, mainKeyboard);
      }
    } else {
      bot.sendMessage(chatId, 'Please enter a valid apartment number.', mainKeyboard);
    }
  });
};

export const handleListApartments = (bot: TelegramBot, chatId: number) => {
  const apartmentNumbers = Object.keys(apartments).map(Number);

  if (apartmentNumbers.length > 0) {
    bot.sendMessage(chatId, `List of apartment numbers: ${apartmentNumbers.join(', ')}`, mainKeyboard);
  } else {
    bot.sendMessage(chatId, 'The apartment list is empty.', mainKeyboard);
  }
};

export const getApartments = () => apartments; // Export apartments for use in other handlers