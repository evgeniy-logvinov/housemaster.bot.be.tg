import TelegramBot from 'node-telegram-bot-api';
import { mainKeyboard } from './keyboard';
import { getApartments } from './apartments';

const building: { [key: number]: { [key: number]: string[] } } = {};

export const handleAddMeAsResident = (
  bot: TelegramBot,
  msg: TelegramBot.Message,
  building: { [floor: number]: { [apartment: number]: string[] } },
  saveBuilding: (building: { [floor: number]: { [apartment: number]: string[] } }) => void
) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, 'Enter the apartment number to add yourself as a resident:');
  bot.once('message', (response) => {
    const selectedApartment = parseInt(response.text || '', 10);

    // Find the floor and apartment
    const floor = Object.keys(building).find((floor) =>
      Object.keys(building[parseInt(floor)]).includes(selectedApartment.toString())
    );

    if (!floor) {
      bot.sendMessage(chatId, 'Invalid apartment number. Please try again.', mainKeyboard);
      return;
    }

    // Determine the user's identifier
    const userName =
      msg.from?.username || msg.from?.first_name || msg.contact?.phone_number || 'Нет имени';

    if (building[parseInt(floor)][selectedApartment].includes(userName)) {
      bot.sendMessage(chatId, `You are already added as a resident of apartment ${selectedApartment}.`, mainKeyboard);
      return;
    }

    building[parseInt(floor)][selectedApartment].push(userName);
    saveBuilding(building); // Save changes to file

    bot.sendMessage(chatId, `You (${userName}) have been added as a resident of apartment ${selectedApartment}.`, mainKeyboard);
  });
};

export const handleListResidents = (
  bot: TelegramBot,
  chatId: number,
  building: { [floor: number]: { [apartment: number]: string[] } }
) => {
  let residentsList = 'Residents by floor and apartment:\n';

  for (const [floor, apartments] of Object.entries(building)) {
    residentsList += `Floor ${floor}:\n`;
    for (const [apartment, residents] of Object.entries(apartments)) {
      residentsList += `  Apartment ${apartment}: ${residents.join(', ') || 'No residents'}\n`;
    }
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

export const handleRemoveMeAsResident = (
  bot: TelegramBot,
  msg: TelegramBot.Message,
  building: { [floor: number]: { [apartment: number]: string[] } },
  saveBuilding: (building: { [floor: number]: { [apartment: number]: string[] } }) => void
) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, 'Enter the apartment number to remove yourself as a resident:');
  bot.once('message', (response) => {
    const selectedApartment = parseInt(response.text || '', 10);

    // Find the floor and apartment
    const floor = Object.keys(building).find((floor) =>
      Object.keys(building[parseInt(floor)]).includes(selectedApartment.toString())
    );

    if (!floor) {
      bot.sendMessage(chatId, 'Invalid apartment number. Please try again.', mainKeyboard);
      return;
    }

    // Determine the user's identifier
    const userName =
      msg.from?.username || msg.from?.first_name || msg.contact?.phone_number || 'Нет имени';

    if (!building[parseInt(floor)][selectedApartment].includes(userName)) {
      bot.sendMessage(chatId, `You are not listed as a resident of apartment ${selectedApartment}.`, mainKeyboard);
      return;
    }

    // Remove the user from the list of residents
    building[parseInt(floor)][selectedApartment] = building[parseInt(floor)][selectedApartment].filter(
      (resident) => resident !== userName
    );
    saveBuilding(building); // Save changes to file

    bot.sendMessage(chatId, `You (${userName}) have been removed as a resident of apartment ${selectedApartment}.`, mainKeyboard);
  });
};