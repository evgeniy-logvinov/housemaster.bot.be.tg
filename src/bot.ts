import dotenv from 'dotenv';
// Load environment variables
dotenv.config();

import TelegramBot from 'node-telegram-bot-api';
import { mainKeyboard } from './handlers/keyboard';
import translationsData from './dictionary/translations.json'; // Import translations
import { handleAddMeAsResident, handleRemoveMeAsResident, handleAddResident, handleGetResidentsByApartment, handleRemoveResidentByName, handleAddPhoneNumber, handleRemovePhoneNumber, pendingReplies, handleGenerateBuildingImage, handleGenerateFloorImage } from './handlers/residents';
import { generateSvg } from './data/generateBuildingSvg';
import sharp from 'sharp';
import logger from './logger';
import { loadBuilding } from './data/buildingHelper';

// Load environment variables
const token = process.env.TELEGRAM_BOT_TOKEN;
const language = (process.env.LANGUAGE as unknown as 'en' | 'ru') || 'en'; // Default to English if LANGUAGE is not set
const debug = Boolean(process.env.DEBUG) || false; // Default to false if DEBUG is not set

if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN is not defined in the environment variables.');
}

// Ensure translations are loaded
if (!translationsData[language]) {
  throw new Error(`Translations for language "${language}" not found.`);
}

const translations = translationsData[language]; // Select translations based on the language
logger.info(`Selected language: ${language}`);
logger.info(`Debug mode: ${debug}`);

if (debug) {
  logger.debug(`Translations: ${JSON.stringify(translations)}`);
}

// Initialize bot
const bot = new TelegramBot(token, { polling: true });

// Send a welcome message with the main keyboard when the bot starts
bot.onText(/\/start|ребекка|бот|привет ?домовой/i, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, translations.welcomeMessage, mainKeyboard);
});

function isPrivate(msg: TelegramBot.Message) {
  return msg.chat.type === 'private';
}

function redirectToPrivate(bot: TelegramBot, msg: TelegramBot.Message) {
  bot.sendMessage(
    msg.from!.id,
    translations.privateCommandInstruction
  );
  if (msg.chat.type !== 'private') {
    bot.sendMessage(
      msg.chat.id,
      translations.privateCommandGroupHint
    );
  }
}

// Command handlers
bot.on('message', (msg) => {
  logger.info(`Received message: ${msg.text} from: ${msg.from?.username} chat: ${msg.chat.id}`);

  if (msg.from && pendingReplies) {
    const key = `${msg.chat.id}:${msg.from.id}`;
    if (pendingReplies[key]) {
      pendingReplies[key].handler(msg);
      return;
    }
  }

  // Команды, которые должны работать только в личке
  const privateOnly = [
    translations.addMeAsResident,
    translations.removeMeAsResident,
    translations.getResidentsByApartment,
    translations.addResident,
    translations.removeResidentByName,
    translations.addPhoneNumber,
    translations.removePhoneNumber,
  ];

  if (privateOnly.includes(msg.text || '')) {
    if (!isPrivate(msg)) {
      redirectToPrivate(bot, msg);
      return;
    }
    // Обычная логика для лички
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
    } else if (msg.text === translations.removePhoneNumber) {
      handleRemovePhoneNumber(bot, msg);
    }
    return;
  }

  // Остальные команды — как раньше
  if (msg.text === translations.generateBuildingImage) {
    handleGenerateBuildingImage(bot, msg);
  } else if (msg.text === translations.generateFloorImage) {
    handleGenerateFloorImage(bot, msg);
  } else if (msg.text === translations.closeKeyboard) {
    bot.sendMessage(msg.chat.id, translations.keyboardClosed, {
      reply_markup: { remove_keyboard: true }
    });
  }
});

bot.on('callback_query', async (query) => {
  const data = query.data || '';
  if (data.startsWith('floor_')) {
    const floorNumber = Number(data.replace('floor_', ''));
    let building;
    
    try {
      building = loadBuilding();
    } catch (error) {
      logger.error(`Failed to load building data: ${error}`);
      await bot.answerCallbackQuery(query.id, { text: translations.errorLoadingBuilding });
      return;
    }
    
    const svgContent = generateSvg(building.schema, true, floorNumber);
    const pngBuffer = await sharp(Buffer.from(svgContent, 'utf-8')).png().toBuffer();
    await bot.sendPhoto(
      query.message!.chat.id,
      pngBuffer,
      { caption: `${translations.svgFloor} ${floorNumber}` }
    );
    try {
      await bot.deleteMessage(query.message!.chat.id, query.message!.message_id);
    } catch (e) {
      logger.error(`Failed to delete message: ${e}`);
    }
    await bot.answerCallbackQuery(query.id);
  }
});

logger.info('Bot is running!');