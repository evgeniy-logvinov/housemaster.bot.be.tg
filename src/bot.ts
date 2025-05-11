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
const apartmentResidents: { [key: number]: string[] } = {}; // Object to store residents by apartment number

// Define the main keyboard
const mainKeyboard = {
  reply_markup: {
    keyboard: [
      [{ text: 'Add Apartment' }], // Button to add an apartment
      [{ text: 'List Apartments' }], // Button to list apartments
      [{ text: 'Add Me as Resident' }], // Button to add the current user as a resident
      [{ text: 'Add Residents' }], // Button to add residents
      [{ text: 'List Residents' }], // Button to list residents
    ],
    resize_keyboard: true,
    one_time_keyboard: false,
  },
};

// Send a welcome message with the main keyboard when the bot starts
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Welcome! Use the buttons below to manage apartments and residents.', mainKeyboard);
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

  // Handle "Add Residents" button
  if (msg.text === 'Add Residents') {
    if (apartmentNumbers.length === 0) {
      bot.sendMessage(chatId, 'No apartments available. Please add an apartment first.', mainKeyboard);
      return;
    }

    bot.sendMessage(chatId, 'Select an apartment to add residents:', {
      reply_markup: {
        keyboard: apartmentNumbers.map((num) => [{ text: num.toString() }]).concat([[{ text: 'Cancel' }]]),
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    });

    bot.once('message', (response) => {
      const selectedApartment = parseInt(response.text || '', 10);

      if (response.text === 'Cancel') {
        bot.sendMessage(chatId, 'Operation canceled.', mainKeyboard);
        return;
      }

      if (!apartmentNumbers.includes(selectedApartment)) {
        bot.sendMessage(chatId, 'Invalid apartment number. Please try again.', mainKeyboard);
        return;
      }

      bot.sendMessage(chatId, `Enter the name of the resident for apartment ${selectedApartment}:`, {
        reply_markup: {
          keyboard: [[{ text: 'Cancel' }]],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      });

      bot.once('message', (residentResponse) => {
        const residentName = residentResponse.text || '';

        // Check if the input is a valid resident name
        const invalidCommands = ['Add Apartment', 'List Apartments', 'Add Residents', 'List Residents', 'Cancel'];
        if (invalidCommands.includes(residentName)) {
          bot.sendMessage(chatId, 'Invalid name. Please try again.', mainKeyboard);
          return;
        }

        if (residentName === 'Cancel') {
          bot.sendMessage(chatId, 'Operation canceled.', mainKeyboard);
          return;
        }

        if (!apartmentResidents[selectedApartment]) {
          apartmentResidents[selectedApartment] = [];
        }

        apartmentResidents[selectedApartment].push(residentName);
        bot.sendMessage(chatId, `Resident "${residentName}" has been added to apartment ${selectedApartment}.`, mainKeyboard);
      });
    });
  }

  // Handle "List Residents" button
  if (msg.text === 'List Residents') {
    if (Object.keys(apartmentResidents).length === 0) {
      bot.sendMessage(chatId, 'No residents have been added yet.', mainKeyboard);
      return;
    }

    let residentsList = 'Residents by apartment:\n';
    for (const [apartment, residents] of Object.entries(apartmentResidents)) {
      residentsList += `Apartment ${apartment}: ${residents.join(', ')}\n`;
    }

    bot.sendMessage(chatId, residentsList, mainKeyboard);
  }

  // Handle "Add Me as Resident" button
  if (msg.text === 'Add Me as Resident') {
    if (apartmentNumbers.length === 0) {
      bot.sendMessage(chatId, 'No apartments available. Please add an apartment first.', mainKeyboard);
      return;
    }

    bot.sendMessage(chatId, 'Enter the apartment number to add yourself as a resident:');

    bot.once('message', (response) => {
      const selectedApartment = parseInt(response.text || '', 10);

      if (isNaN(selectedApartment)) {
        bot.sendMessage(chatId, 'Invalid input. Please enter a valid apartment number.', mainKeyboard);
        return;
      }

      if (!apartmentNumbers.includes(selectedApartment)) {
        bot.sendMessage(chatId, 'Apartment number not found. Please try again.', mainKeyboard);
        return;
      }

      // Use username if available, otherwise fallback to first_name
      const userName = msg.from?.username || msg.from?.first_name || 'Unknown User';

      if (!apartmentResidents[selectedApartment]) {
        apartmentResidents[selectedApartment] = [];
      }

      // Check if the user is already added
      if (apartmentResidents[selectedApartment].includes(userName)) {
        bot.sendMessage(chatId, `You are already added as a resident of apartment ${selectedApartment}.`, mainKeyboard);
        return;
      }

      apartmentResidents[selectedApartment].push(userName);
      bot.sendMessage(chatId, `You (@${userName}) have been added as a resident of apartment ${selectedApartment}.`, mainKeyboard);
    });
  }
});

console.log('Bot is running!');