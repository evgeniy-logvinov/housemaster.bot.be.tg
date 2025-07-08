import TelegramBot from 'node-telegram-bot-api';
import translationsData from '../data/translations.json';
import { mainKeyboard, cancelKeyboard } from '../handlers/keyboard';
import { loadBuilding, saveBuilding } from '../data/buildingHelper';

const language = (process.env.LANGUAGE as unknown as 'en' | 'ru') || 'en';
const translations = translationsData[language];

// --- Common utilities ---

function askApartmentNumber(
  bot: TelegramBot,
  msg: TelegramBot.Message,
  onValid: (apartmentNumber: number) => void,
  onCancel?: () => void
) {
  bot.sendMessage(msg.chat.id, translations.enterApartmentNumber, cancelKeyboard);

  const listener = (response: TelegramBot.Message) => {
    if (response.text === translations.cancel) {
      bot.sendMessage(msg.chat.id, translations.welcomeMessage, mainKeyboard);
      onCancel?.();
      return;
    }

    const apartmentNumber = parseInt(response.text || '', 10);

    if (isNaN(apartmentNumber)) {
      bot.sendMessage(msg.chat.id, translations.invalidApartmentNumber, cancelKeyboard);
      return;
    }

    onValid(apartmentNumber);
  };

  bot.once('message', listener);
}

function askResidentName(
  bot: TelegramBot,
  msg: TelegramBot.Message,
  onValid: (residentName: string) => void,
  onCancel?: () => void
) {
  bot.sendMessage(msg.chat.id, translations.enterResidentName, cancelKeyboard);

  const listener = (response: TelegramBot.Message) => {
    if (response.text === translations.cancel) {
      bot.sendMessage(msg.chat.id, translations.welcomeMessage, mainKeyboard);
      onCancel?.();
      return;
    }

    const residentName = response.text?.trim();
    if (!residentName) {
      bot.sendMessage(msg.chat.id, translations.invalidName, cancelKeyboard);
      return;
    }

    onValid(residentName);
  };

  bot.once('message', listener);
}

// --- Main handlers ---

export const handleAddMeAsResident = (bot: TelegramBot, msg: TelegramBot.Message) => {
  const building = loadBuilding();
  askApartmentNumber(bot, msg, (apartmentNumber) => {
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
  });
};

export const handleRemoveMeAsResident = (bot: TelegramBot, msg: TelegramBot.Message) => {
  const building = loadBuilding();
  askApartmentNumber(bot, msg, (selectedApartment) => {
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
  });
};

export const handleAddResident = (bot: TelegramBot, msg: TelegramBot.Message) => {
  askApartmentNumber(bot, msg, (apartmentNumber) => {
    askResidentName(bot, msg, (residentName) => {
      try {
        const building = loadBuilding();
        for (const [floorKey, apartments] of Object.entries(building)) {
          if (apartments[apartmentNumber]) {
            apartments[apartmentNumber].push(residentName);
            saveBuilding(building);
            bot.sendMessage(
              msg.chat.id,
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
          msg.chat.id,
          translations.apartmentNotFound
            .replace('{apartmentNumber}', apartmentNumber.toString())
            .replace('{floor}', 'unknown'),
          mainKeyboard
        );
      } catch (error) {
        bot.sendMessage(msg.chat.id, translations.apartmentNotFound.replace('{apartmentNumber}', apartmentNumber.toString()), mainKeyboard);
      }
    });
  });
};

export const handleGetResidentsByApartment = (bot: TelegramBot, msg: TelegramBot.Message) => {
  const building = loadBuilding();
  askApartmentNumber(bot, msg, (apartmentNumber) => {
    try {
      let residents: string[] = [];
      let floor: string | undefined;

      for (const [floorKey, apartments] of Object.entries(building)) {
        if (apartments[apartmentNumber]) {
          residents = apartments[apartmentNumber];
          floor = floorKey;
          break;
        }
      }

      if (residents.length > 0 && floor) {
        bot.sendMessage(
          msg.chat.id,
          translations.residentsList
            .replace('{apartmentNumber}', apartmentNumber.toString())
            .replace('{floor}', floor)
            .replace('{residents}', residents.join(', ')),
          mainKeyboard
        );
      } else if (floor) {
        bot.sendMessage(
          msg.chat.id,
          translations.noResidents
            .replace('{apartmentNumber}', apartmentNumber.toString())
            .replace('{floor}', floor),
          mainKeyboard
        );
      } else {
        bot.sendMessage(
          msg.chat.id,
          translations.apartmentNotFound
            .replace('{apartmentNumber}', apartmentNumber.toString())
            .replace('{floor}', 'unknown'),
          mainKeyboard
        );
      }
    } catch (error) {
      bot.sendMessage(msg.chat.id, translations.apartmentNotFound.replace('{apartmentNumber}', apartmentNumber.toString()), mainKeyboard);
    }
  });
};

// New handler: remove resident by name
export const handleRemoveResidentByName = (bot: TelegramBot, msg: TelegramBot.Message) => {
  const building = loadBuilding();
  askApartmentNumber(bot, msg, (apartmentNumber) => {
    askResidentName(bot, msg, (residentName) => {
      let found = false;
      for (const [floorKey, apartments] of Object.entries(building)) {
        if (apartments[apartmentNumber]) {
          const before = apartments[apartmentNumber].length;
          apartments[apartmentNumber] = apartments[apartmentNumber].filter(
            (resident) => resident !== residentName
          );
          if (apartments[apartmentNumber].length < before) {
            found = true;
            saveBuilding(building);
            bot.sendMessage(
              msg.chat.id,
              translations.residentRemoved
                .replace('{residentName}', residentName)
                .replace('{apartmentNumber}', apartmentNumber.toString())
                .replace('{floor}', floorKey),
              mainKeyboard
            );
            break;
          }
        }
      }
      if (!found) {
        bot.sendMessage(
          msg.chat.id,
          translations.notResident
            .replace('{residentName}', residentName)
            .replace('{apartmentNumber}', apartmentNumber.toString())
            .replace('{floor}', 'unknown'),
          mainKeyboard
        );
      }
    });
  });
};