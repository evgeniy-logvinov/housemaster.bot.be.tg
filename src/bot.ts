import dotenv from 'dotenv';
// Load environment variables
dotenv.config();

import TelegramBot from 'node-telegram-bot-api';
import { mainKeyboard } from './handlers/keyboard';
import translationsData from './data/translations.json'; // Import translations
import { handleAddMeAsResident, handleRemoveMeAsResident, handleAddResident, handleGetResidentsByApartment, handleRemoveResidentByName, handleAddPhoneNumber } from './handlers/residents';

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

// Send a welcome message with the main keyboard when the bot starts
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, translations.welcomeMessage, mainKeyboard);
});

// Command handlers
bot.on('message', (msg) => {
  if (msg.text === translations.addMeAsResident) {
    handleAddMeAsResident(bot, msg);
  } else if (msg.text === translations.removeMeAsResident) {
    handleRemoveMeAsResident(bot, msg);
  } else if (msg.text === translations.getResidentsByApartment) {
    handleGetResidentsByApartment(bot, msg);
  } else if (msg.text === translations.addResident) {
    handleAddResident(bot, msg);
  } else if (msg.text === translations.removeResidentByName) {
    handleRemoveResidentByName(bot, msg);
  } else if (msg.text === translations.addPhoneNumber) {
    handleAddPhoneNumber(bot, msg);
  }
});

console.log('Bot is running!');