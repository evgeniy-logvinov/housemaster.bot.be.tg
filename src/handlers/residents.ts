import TelegramBot from 'node-telegram-bot-api';
import translationsData from '../data/translations.json';
import { mainKeyboard, cancelKeyboard } from '../handlers/keyboard';

const language = (process.env.LANGUAGE as unknown as 'en' | 'ru') || 'en';
const translations = translationsData[language];

export const handleAddMeAsResident = (
  bot: TelegramBot,
  msg: TelegramBot.Message,
  building: { [floor: number]: { [apartment: number]: string[] } },
  saveBuilding: (building: { [floor: number]: { [apartment: number]: string[] } }) => void
) => {
  bot.sendMessage(msg.chat.id, translations.enterApartmentNumber, cancelKeyboard);

  const listener = (response: TelegramBot.Message) => {
    if (response.text === translations.cancel) {
      bot.sendMessage(msg.chat.id, translations.welcomeMessage, mainKeyboard);
      return;
    }

    const apartmentNumber = parseInt(response.text || '', 10);

    if (isNaN(apartmentNumber)) {
      bot.sendMessage(msg.chat.id, translations.invalidApartmentNumber, cancelKeyboard);
      return;
    }

    const userName = msg.from?.username || msg.from?.first_name || 'Unknown User';

    for (const [floor, apartments] of Object.entries(building)) {
      if (apartments[apartmentNumber]) {
        if (apartments[apartmentNumber].includes(userName)) {
          bot.sendMessage(
            msg.chat.id,
            translations.alreadyResident
              .replace('{apartmentNumber}', apartmentNumber.toString())
              .replace('{floor}', floor),
            mainKeyboard
          );
          return;
        }

        apartments[apartmentNumber].push(userName);
        saveBuilding(building);
        bot.sendMessage(
          msg.chat.id,
          translations.residentAdded
            .replace('{residentName}', userName)
            .replace('{apartmentNumber}', apartmentNumber.toString())
            .replace('{floor}', floor),
          mainKeyboard
        );
        return;
      }
    }

    bot.sendMessage(
      msg.chat.id,
      translations.apartmentNotFound
        .replace('{apartmentNumber}', apartmentNumber.toString())
        .replace('{floor}', 'unknown'),
      mainKeyboard
    );
  };

  bot.once('message', listener);
};

export const handleRemoveMeAsResident = (
  bot: TelegramBot,
  msg: TelegramBot.Message,
  building: { [floor: number]: { [apartment: number]: string[] } },
  saveBuilding: (building: { [floor: number]: { [apartment: number]: string[] } }) => void
) => {
  bot.sendMessage(msg.chat.id, translations.enterApartmentNumber, cancelKeyboard);

  const listener = (response: TelegramBot.Message) => {
    if (response.text === translations.cancel) {
      bot.sendMessage(msg.chat.id, translations.welcomeMessage, mainKeyboard);
      return;
    }

    const selectedApartment = parseInt(response.text || '', 10);

    if (isNaN(selectedApartment)) {
      bot.sendMessage(msg.chat.id, translations.invalidApartmentNumber, cancelKeyboard);
      return;
    }

    const userName = msg.from?.username || msg.from?.first_name || 'Unknown User';

    for (const [floor, apartments] of Object.entries(building)) {
      if (apartments[selectedApartment]) {
        if (!apartments[selectedApartment].includes(userName)) {
          bot.sendMessage(
            msg.chat.id,
            translations.notResident
              .replace('{apartmentNumber}', selectedApartment.toString())
              .replace('{floor}', floor),
            mainKeyboard
          );
          return;
        }

        apartments[selectedApartment] = apartments[selectedApartment].filter((resident) => resident !== userName);
        saveBuilding(building);
        bot.sendMessage(
          msg.chat.id,
          translations.residentRemoved
            .replace('{residentName}', userName)
            .replace('{apartmentNumber}', selectedApartment.toString())
            .replace('{floor}', floor),
          mainKeyboard
        );
        return;
      }
    }

    bot.sendMessage(
      msg.chat.id,
      translations.apartmentNotFound.replace('{apartmentNumber}', selectedApartment.toString()),
      mainKeyboard
    );
  };

  bot.once('message', listener);
};