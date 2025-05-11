import dotenv from 'dotenv';
// Load environment variables
dotenv.config();

import TelegramBot from 'node-telegram-bot-api';
import { mainKeyboard } from './handlers/keyboard';
import { handleAddMeAsResident, handleRemoveMeAsResident } from './handlers/residents';
import { loadBuilding, saveBuilding, getResidentsByApartment } from './data/buildingHelper';

import translationsData from './data/translations.json';

const token = process.env.TELEGRAM_BOT_TOKEN;
const language = (process.env.LANGUAGE as unknown as 'en' | 'ru') || 'en'; // Default to English if LANGUAGE is not set
// Select translations based on the language
const translations = translationsData[language];

if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN is not defined in the environment variables.');
}

const bot = new TelegramBot(token, { polling: true });

// Load building data
let building = loadBuilding();

// Send a welcome message with the main keyboard when the bot starts
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, translations.welcomeMessage, mainKeyboard);
});

// Handle bot commands
bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  if (msg.text === translations.addMeAsResident) {
    handleAddMeAsResident(bot, msg, building, saveBuilding);
  } else if (msg.text === translations.removeMeAsResident) {
    handleRemoveMeAsResident(bot, msg, building, saveBuilding);
  } else if (msg.text === translations.getResidentsByApartment) {
    bot.sendMessage(chatId, translations.enterApartmentNumber);
    bot.once('message', (response) => {
      const apartmentNumber = parseInt(response.text || '', 10);

      if (isNaN(apartmentNumber)) {
        bot.sendMessage(chatId, translations.invalidApartmentNumber);
        return;
      }

      try {
        const residents = getResidentsByApartment(apartmentNumber);
        if (residents.length > 0) {
          bot.sendMessage(chatId, translations.residentsList.replace('{apartmentNumber}', apartmentNumber.toString()).replace('{residents}', residents.join(', ')));
        } else {
          bot.sendMessage(chatId, translations.noResidents.replace('{apartmentNumber}', apartmentNumber.toString()));
        }
      } catch (error) {
        bot.sendMessage(chatId, (error as unknown as Error).message);
      }
    });
  } else if (msg.text === translations.addResident) {
    bot.sendMessage(chatId, translations.enterApartmentNumber);
    bot.once('message', (response) => {
      const apartmentNumber = parseInt(response.text || '', 10);

      if (isNaN(apartmentNumber)) {
        bot.sendMessage(chatId, translations.invalidApartmentNumber);
        return;
      }

      bot.sendMessage(chatId, translations.enterResidentName);
      bot.once('message', (residentResponse) => {
        const residentName = residentResponse.text?.trim();

        if (!residentName) {
          bot.sendMessage(chatId, translations.invalidName);
          return;
        }

        try {
          const building = loadBuilding();
          for (const floor of Object.values(building)) {
            if (floor[apartmentNumber]) {
              floor[apartmentNumber].push(residentName);
              saveBuilding(building);
              bot.sendMessage(chatId, translations.residentAdded.replace('{residentName}', residentName).replace('{apartmentNumber}', apartmentNumber.toString()));
              return;
            }
          }

          bot.sendMessage(chatId, translations.apartmentNotFound.replace('{apartmentNumber}', apartmentNumber.toString()));
        } catch (error) {
          bot.sendMessage(chatId, (error as unknown as Error).message);
        }
      });
    });
  }
});

console.log('Bot is running!');