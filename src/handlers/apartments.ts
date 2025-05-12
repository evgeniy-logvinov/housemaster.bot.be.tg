import TelegramBot from 'node-telegram-bot-api';
import { mainKeyboard } from './keyboard';
import translationsData from '../data/translations.json';

const language = (process.env.LANGUAGE as unknown as 'en' | 'ru') || 'en';
const translations = translationsData[language];

// Centralized storage for apartments and their residents
const apartments: { [key: number]: string[] } = {}; // Key: apartment number, Value: array of residents

export const handleAddApartment = (
  bot: TelegramBot,
  chatId: number,
  building: { [floor: number]: { [apartment: number]: string[] } },
  saveBuilding: (building: { [floor: number]: { [apartment: number]: string[] } }) => void
) => {
  bot.sendMessage(chatId, translations.enterApartmentNumber);
  bot.once('message', (response) => {
    const text = response.text || '';
    const apartmentNumber = parseInt(text, 10);

    if (isNaN(apartmentNumber)) {
      bot.sendMessage(chatId, translations.invalidApartmentNumber);
      return;
    }

    bot.sendMessage(chatId, 'Enter the floor number:');
    bot.once('message', (floorResponse) => {
      const floorNumber = parseInt(floorResponse.text || '', 10);

      if (isNaN(floorNumber)) {
        bot.sendMessage(chatId, translations.invalidApartmentNumber);
        return;
      }

      if (!building[floorNumber]) {
        building[floorNumber] = {};
      }

      if (building[floorNumber][apartmentNumber]) {
        bot.sendMessage(
          chatId,
          translations.apartmentAlreadyExists
            .replace('{apartmentNumber}', apartmentNumber.toString())
            .replace('{floor}', floorNumber.toString())
        );
      } else {
        building[floorNumber][apartmentNumber] = [];
        saveBuilding(building);
        bot.sendMessage(
          chatId,
          translations.apartmentAdded
            .replace('{apartmentNumber}', apartmentNumber.toString())
            .replace('{floor}', floorNumber.toString())
        );
      }
    });
  });
};

export const handleListApartments = (
  bot: TelegramBot,
  chatId: number,
  building: { [floor: number]: { [apartment: number]: string[] } }
) => {
  const floors = Object.entries(building);

  if (floors.length === 0) {
    bot.sendMessage(chatId, translations.emptyApartmentList);
    return;
  }

  floors.forEach(([floor, apartments]) => {
    const apartmentNumbers = Object.keys(apartments).join(', ');
    bot.sendMessage(
      chatId,
      translations.listOfApartments
        .replace('{floor}', floor)
        .replace('{apartmentNumbers}', apartmentNumbers)
    );
  });
};

export const getApartments = () => apartments; // Export apartments for use in other handlers