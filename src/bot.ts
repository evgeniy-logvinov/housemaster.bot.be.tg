import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Get the bot token from environment variables
const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN is not defined in the environment variables.');
}

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

// Define the keyboard with buttons
// const keyboard = {
//   reply_markup: {
//     keyboard: [
//       [{ text: 'ИИС' }], // Button for fetching portfolio for account 3
//       [{ text: 'Для тестирования стратегий' }], // Button for fetching portfolio for account 0
//       [{ text: 'Get Portfolio Account 1' }], // Button for fetching portfolio for account 1
//       [{ text: 'Get Portfolio Account 2' }], // Button for fetching portfolio for account 2
//       [{ text: 'Get Sberbank Price' }], // Button for fetching Sberbank price
//     ],
//     resize_keyboard: true,
//     one_time_keyboard: false,
//   },
// };

// Send a welcome message with the keyboard when the bot starts
// bot.onText(/\/start/, (msg) => {
//   const chatId = msg.chat.id;
//   bot.sendMessage(chatId, 'Welcome! Use the buttons below to get information.', keyboard);
// });

// Handle button presses
// bot.on('message', async (msg: TelegramBot.Message) => {
//   const chatId = msg.chat.id;

//   if (msg.text === 'Для тестирования стратегий') {
//     // await handlePortfolioRequest(chatId, 0);
//   } else if (msg.text === 'Get Portfolio Account 1') {
//     // await handlePortfolioRequest(chatId, 1);
//   } else if (msg.text === 'Get Portfolio Account 2') {
//     // await handlePortfolioRequest(chatId, 2);
//   } else if (msg.text === 'ИИС') {
//     console.log('ИИС');
//     // await handlePortfolioRequest(chatId, 3);
//   } else if (msg.text === 'Get Sberbank Price') {
//     // try {
//     //   const price = await getSberbankPrice();
//     //   if (price !== null) {
//     //     bot.sendMessage(chatId, `The current price of Sberbank (SBER) is ${price} RUB.`);
//     //   } else {
//     //     bot.sendMessage(chatId, 'Unable to fetch the price for Sberbank at the moment.');
//     //   }
//     // } catch (error) {
//     //   bot.sendMessage(chatId, 'An error occurred while fetching Sberbank price.');
//     //   console.error(error);
//     // }
//   } else {
//     bot.sendMessage(chatId, 'Hello! Use the buttons to get information.');
//   }
// });

const apartmentNumbers: number[] = []; // Array to store apartment numbers

// Define the main keyboard
const mainKeyboard = {
  reply_markup: {
    keyboard: [
      [{ text: 'Add Apartment' }], // Button to add an apartment
      [{ text: 'List Apartments' }], // Button to list apartments
    ],
    resize_keyboard: true,
    one_time_keyboard: false,
  },
};

// Send a welcome message with the main keyboard when the bot starts
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Welcome! Use the buttons below to manage apartments.', mainKeyboard);
});

// Handle "Add Apartment" button
bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  if (msg.text === 'Add Apartment') {
      bot.sendMessage(chatId, 'Enter the apartment number:');


    bot.once('message', (response) => {
      const text = response.text || '';

      if (text === 'Cancel') {
        bot.sendMessage(chatId, 'Operation canceled.', mainKeyboard);
        return;
      }

      const apartmentNumber = parseInt(text, 10);

      if (!isNaN(apartmentNumber)) {
        apartmentNumbers.push(apartmentNumber);
        bot.sendMessage(chatId, `Apartment number ${apartmentNumber} has been successfully added!`, mainKeyboard);
      } else {
        bot.sendMessage(chatId, 'Please select a valid apartment number.', mainKeyboard);
      }
    });
  }

  // Handle "List Apartments" button
  if (msg.text === 'List Apartments') {
    if (apartmentNumbers.length > 0) {
      bot.sendMessage(chatId, `List of apartment numbers: ${apartmentNumbers.join(', ')}`, mainKeyboard);
    } else {
      bot.sendMessage(chatId, 'The apartment list is empty.', mainKeyboard);
    }
  }
});

console.log('Bot is running!');