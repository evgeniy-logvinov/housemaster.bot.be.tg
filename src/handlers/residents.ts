import TelegramBot from 'node-telegram-bot-api';
import { mainKeyboard } from './keyboard';
import { getApartments } from './apartments';

export const handleAddMeAsResident = (bot: TelegramBot, msg: TelegramBot.Message) => {
  const chatId = msg.chat.id;
  const apartments = getApartments();

  if (Object.keys(apartments).length === 0) {
    bot.sendMessage(chatId, 'No apartments available. Please add an apartment first.', mainKeyboard);
    return;
  }

  bot.sendMessage(chatId, 'Enter the apartment number to add yourself as a resident:');
  bot.once('message', (response) => {
    const selectedApartment = parseInt(response.text || '', 10);

    if (isNaN(selectedApartment) || !apartments[selectedApartment]) {
      bot.sendMessage(chatId, 'Invalid apartment number. Please try again.', mainKeyboard);
      return;
    }

    // Determine the user's identifier
    const userName =
      msg.from?.username || // Use username if available
      msg.from?.first_name || // Fallback to first_name
      msg.contact?.phone_number || // Fallback to phone number (if contact is shared)
      'Нет имени'; // Default value if nothing is available

    if (!apartments[selectedApartment]) {
      apartments[selectedApartment] = [];
    }

    if (apartments[selectedApartment].includes(userName)) {
      bot.sendMessage(chatId, `You are already added as a resident of apartment ${selectedApartment}.`, mainKeyboard);
      return;
    }

    apartments[selectedApartment].push(userName);
    bot.sendMessage(chatId, `You (${userName}) have been added as a resident of apartment ${selectedApartment}.`, mainKeyboard);
  });
};

export const handleListResidents = (bot: TelegramBot, chatId: number) => {
  const apartments = getApartments();

  if (Object.keys(apartments).length === 0) {
    bot.sendMessage(chatId, 'No residents have been added yet.', mainKeyboard);
    return;
  }

  let residentsList = 'Residents by apartment:\n';
  for (const [apartment, residents] of Object.entries(apartments)) {
    residentsList += `Apartment ${apartment}: ${residents.join(', ')}\n`;
  }

  bot.sendMessage(chatId, residentsList, mainKeyboard);
};

export const handleAddResidents = (bot: TelegramBot, chatId: number) => {
  const apartments = getApartments();

  if (Object.keys(apartments).length === 0) {
    bot.sendMessage(chatId, 'No apartments available. Please add an apartment first.', mainKeyboard);
    return;
  }

  bot.sendMessage(chatId, 'Enter the apartment number to add residents:');
  bot.once('message', (response) => {
    const selectedApartment = parseInt(response.text || '', 10);

    if (isNaN(selectedApartment) || !apartments[selectedApartment]) {
      bot.sendMessage(chatId, 'Invalid apartment number. Please try again.', mainKeyboard);
      return;
    }

    bot.sendMessage(chatId, `Enter the name of the resident for apartment ${selectedApartment}:`);
    bot.once('message', (residentResponse) => {
      const residentName = residentResponse.text || '';

      if (!apartments[selectedApartment]) {
        apartments[selectedApartment] = [];
      }

      apartments[selectedApartment].push(residentName);
      bot.sendMessage(chatId, `Resident "${residentName}" has been added to apartment ${selectedApartment}.`, mainKeyboard);
    });
  });
};

export const handleRemoveMeAsResident = (bot: TelegramBot, msg: TelegramBot.Message) => {
  const chatId = msg.chat.id;
  const apartments = getApartments();

  if (Object.keys(apartments).length === 0) {
    bot.sendMessage(chatId, 'No apartments available. Please add an apartment first.', mainKeyboard);
    return;
  }

  bot.sendMessage(chatId, 'Enter the apartment number to remove yourself as a resident:');
  bot.once('message', (response) => {
    const selectedApartment = parseInt(response.text || '', 10);

    if (isNaN(selectedApartment) || !apartments[selectedApartment]) {
      bot.sendMessage(chatId, 'Invalid apartment number. Please try again.', mainKeyboard);
      return;
    }

    // Determine the user's identifier
    const userName =
      msg.from?.username || // Use username if available
      msg.from?.first_name || // Fallback to first_name
      msg.contact?.phone_number || // Fallback to phone number (if contact is shared)
      'Нет имени'; // Default value if nothing is available

    if (!apartments[selectedApartment].includes(userName)) {
      bot.sendMessage(chatId, `You are not listed as a resident of apartment ${selectedApartment}.`, mainKeyboard);
      return;
    }

    // Remove the user from the list of residents
    apartments[selectedApartment] = apartments[selectedApartment].filter((resident) => resident !== userName);

    bot.sendMessage(chatId, `You (${userName}) have been removed as a resident of apartment ${selectedApartment}.`, mainKeyboard);
  });
};