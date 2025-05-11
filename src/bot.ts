import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import { mainKeyboard } from './handlers/keyboard';
import { handleAddApartment, handleListApartments } from './handlers/apartments';
import { handleAddMeAsResident, handleRemoveMeAsResident, handleAddResidents, handleListResidents } from './handlers/residents';

// Load environment variables
dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN is not defined in the environment variables.');
}

const bot = new TelegramBot(token, { polling: true });

// Send a welcome message with the main keyboard when the bot starts
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Welcome! Use the buttons below to manage apartments and residents.', mainKeyboard);
});

// Handle bot commands
bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  if (msg.text === 'Add Apartment') {
    handleAddApartment(bot, chatId);
  } else if (msg.text === 'List Apartments') {
    handleListApartments(bot, chatId);
  } else if (msg.text === 'Add Me as Resident') {
    handleAddMeAsResident(bot, msg);
  } else if (msg.text === 'Remove Me as Resident') {
    handleRemoveMeAsResident(bot, msg); // New handler
  } else if (msg.text === 'Add Residents') {
    handleAddResidents(bot, chatId);
  } else if (msg.text === 'List Residents') {
    handleListResidents(bot, chatId);
  }
});

console.log('Bot is running!');