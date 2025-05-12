import dotenv from 'dotenv';
// Load environment variables
dotenv.config();

import TelegramBot from 'node-telegram-bot-api';
import { mainKeyboard, cancelKeyboard } from './handlers/keyboard';
import { handleAddMeAsResident, handleRemoveMeAsResident } from './handlers/residents';
import { loadBuilding, saveBuilding } from './data/buildingHelper';
import translationsData from './data/translations.json'; // Import translations

// Load environment variables
const token = process.env.TELEGRAM_BOT_TOKEN;
const language = (process.env.LANGUAGE as unknown as 'en' | 'ru') || 'en'; // Default to English if LANGUAGE is not set

if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN is not defined in the environment variables.');
}

// Ensure translations are loaded
if (!translationsData[language]) {
  throw new Error(`Translations for language "${language}" not found.`);
}

const translations = translationsData[language]; // Select translations based on the language
console.log('Selected language:', language);
console.log('Translations:', translations);

// Initialize bot
const bot = new TelegramBot(token, { polling: true });

// Load building data
let building = loadBuilding();

// Send a welcome message with the main keyboard when the bot starts
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, translations.welcomeMessage, mainKeyboard);
});

// Обновление обработчиков команд
bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  if (msg.text === translations.addMeAsResident) {
    bot.sendMessage(chatId, translations.enterApartmentNumber, cancelKeyboard);

    const listener = (response: TelegramBot.Message) => {
      if (response.text === translations.cancel) {
        bot.sendMessage(chatId, translations.welcomeMessage, mainKeyboard);
        return;
      }

      handleAddMeAsResident(bot, response, building, saveBuilding);
    };

    bot.once('message', listener);
  } else if (msg.text === translations.removeMeAsResident) {
    bot.sendMessage(chatId, translations.enterApartmentNumber, cancelKeyboard);

    const listener = (response: TelegramBot.Message) => {
      if (response.text === translations.cancel) {
        bot.sendMessage(chatId, translations.welcomeMessage, mainKeyboard);
        return;
      }

      handleRemoveMeAsResident(bot, response, building, saveBuilding);
    };

    bot.once('message', listener);
  } else if (msg.text === translations.getResidentsByApartment) {
    bot.sendMessage(chatId, translations.enterApartmentNumber, cancelKeyboard);

    const listener = (response: TelegramBot.Message) => {
      if (response.text === translations.cancel) {
        bot.sendMessage(chatId, translations.welcomeMessage, mainKeyboard);
        return;
      }

      const apartmentNumber = parseInt(response.text || '', 10);

      if (isNaN(apartmentNumber)) {
        bot.sendMessage(chatId, translations.invalidApartmentNumber, cancelKeyboard);
        return;
      }

      try {
        let residents: string[] = [];
        let floor: string | undefined;

        // Find the apartment and its floor
        for (const [floorKey, apartments] of Object.entries(building)) {
          if (apartments[apartmentNumber]) {
            residents = apartments[apartmentNumber];
            floor = floorKey;
            break;
          }
        }

        if (residents.length > 0 && floor) {
          bot.sendMessage(
            chatId,
            translations.residentsList
              .replace('{apartmentNumber}', apartmentNumber.toString())
              .replace('{floor}', floor)
              .replace('{residents}', residents.join(', ')),
            mainKeyboard
          );
        } else if (floor) {
          bot.sendMessage(
            chatId,
            translations.noResidents
              .replace('{apartmentNumber}', apartmentNumber.toString())
              .replace('{floor}', floor),
            mainKeyboard
          );
        } else {
          bot.sendMessage(
            chatId,
            translations.apartmentNotFound
              .replace('{apartmentNumber}', apartmentNumber.toString())
              .replace('{floor}', 'unknown'),
            mainKeyboard
          );
        }
      } catch (error) {
        bot.sendMessage(chatId, translations.apartmentNotFound.replace('{apartmentNumber}', apartmentNumber.toString()), mainKeyboard);
      }
    };

    bot.once('message', listener);
  } else if (msg.text === translations.addResident) {
    bot.sendMessage(chatId, translations.enterApartmentNumber, cancelKeyboard);

    const listener = (response: TelegramBot.Message) => {
      if (response.text === translations.cancel) {
        bot.sendMessage(chatId, translations.welcomeMessage, mainKeyboard);
        return;
      }

      const apartmentNumber = parseInt(response.text || '', 10);

      if (isNaN(apartmentNumber)) {
        bot.sendMessage(chatId, translations.invalidApartmentNumber, cancelKeyboard);
        return;
      }

      bot.sendMessage(chatId, translations.enterResidentName, cancelKeyboard);

      const residentListener = (residentResponse: TelegramBot.Message) => {
        if (residentResponse.text === translations.cancel) {
          bot.sendMessage(chatId, translations.welcomeMessage, mainKeyboard);
          return;
        }

        const residentName = residentResponse.text?.trim();

        if (!residentName) {
          bot.sendMessage(chatId, translations.invalidName, cancelKeyboard);
          return;
        }

        try {
          const building = loadBuilding();
          for (const [floorKey, apartments] of Object.entries(building)) {
            if (apartments[apartmentNumber]) {
              apartments[apartmentNumber].push(residentName);
              saveBuilding(building);
              bot.sendMessage(
                chatId,
                translations.residentAdded
                  .replace('{residentName}', residentName)
                  .replace('{apartmentNumber}', apartmentNumber.toString())
                  .replace('{floor}', floorKey),
                mainKeyboard
              );
              return;
            }
          }

          bot.sendMessage(
            chatId,
            translations.apartmentNotFound
              .replace('{apartmentNumber}', apartmentNumber.toString())
              .replace('{floor}', 'unknown'),
            mainKeyboard
          );
        } catch (error) {
          bot.sendMessage(chatId, translations.apartmentNotFound.replace('{apartmentNumber}', apartmentNumber.toString()), mainKeyboard);
        }
      };

      bot.once('message', residentListener);
    };

    bot.once('message', listener);
  }
});

console.log('Bot is running!');