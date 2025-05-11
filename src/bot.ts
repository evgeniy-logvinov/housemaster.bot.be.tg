import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import { mainKeyboard } from './handlers/keyboard';
import { handleAddMeAsResident, handleRemoveMeAsResident } from './handlers/residents';
import { loadBuilding, saveBuilding, getResidentsByApartment } from './data/buildingHelper';

// Load environment variables
dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN is not defined in the environment variables.');
}

const bot = new TelegramBot(token, { polling: true });

// Load building data
let building = loadBuilding();

// Send a welcome message with the main keyboard when the bot starts
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Welcome! Use the buttons below to manage apartments and residents.', mainKeyboard);
});

// Handle bot commands
bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  if (msg.text === 'Add Me as Resident') {
    handleAddMeAsResident(bot, msg, building, saveBuilding);
  } else if (msg.text === 'Remove Me as Resident') {
    handleRemoveMeAsResident(bot, msg, building, saveBuilding);
  } else if (msg.text === 'Get Residents by Apartment') {
    bot.sendMessage(chatId, 'Enter the apartment number to get the list of residents:');
    bot.once('message', (response) => {
      const apartmentNumber = parseInt(response.text || '', 10);

      if (isNaN(apartmentNumber)) {
        bot.sendMessage(chatId, 'Invalid apartment number. Please enter a valid number.');
        return;
      }

      try {
        const residents = getResidentsByApartment(apartmentNumber);
        if (residents.length > 0) {
          bot.sendMessage(chatId, `Residents of apartment ${apartmentNumber}: ${residents.join(', ')}`);
        } else {
          bot.sendMessage(chatId, `Apartment ${apartmentNumber} has no residents.`);
        }
      } catch (error) {
        bot.sendMessage(chatId, (error as unknown as Error).message);
      }
    });
  } else if (msg.text === 'Add Resident') {
    bot.sendMessage(chatId, 'Enter the apartment number to add a resident:');
    bot.once('message', (response) => {
      const apartmentNumber = parseInt(response.text || '', 10);

      if (isNaN(apartmentNumber)) {
        bot.sendMessage(chatId, 'Invalid apartment number. Please enter a valid number.');
        return;
      }

      bot.sendMessage(chatId, 'Enter the name of the resident to add:');
      bot.once('message', (residentResponse) => {
        const residentName = residentResponse.text?.trim();

        if (!residentName) {
          bot.sendMessage(chatId, 'Invalid name. Please try again.');
          return;
        }

        try {
          const building = loadBuilding();
          for (const floor of Object.values(building)) {
            if (floor[apartmentNumber]) {
              floor[apartmentNumber].push(residentName);
              saveBuilding(building);
              bot.sendMessage(chatId, `Resident "${residentName}" has been added to apartment ${apartmentNumber}.`);
              return;
            }
          }

          bot.sendMessage(chatId, `Apartment number ${apartmentNumber} not found.`);
        } catch (error) {
          bot.sendMessage(chatId, (error as unknown as Error).message);
        }
      });
    });
  }
});

console.log('Bot is running!');