import TelegramBot from 'node-telegram-bot-api';
import translationsData from '../dictionary/translations.json'; // Import translations
import { mainKeyboard, cancelKeyboard, getFloorInlineKeyboard } from './keyboard';
import { loadBuilding, saveBuilding } from '../data/buildingHelper';
import { generateSvg } from '../data/generateBuildingSvg';
import sharp from 'sharp';

const language = (process.env.LANGUAGE as unknown as 'en' | 'ru') || 'en';
const translations = translationsData[language];

type PendingReply = {
  step: string;
  chatId: number;
  userId: number;
  data?: any;
  handler: (msg: TelegramBot.Message) => void;
};

export const pendingReplies: { [key: string]: PendingReply } = {};
function getPendingKey(chatId: number, userId: number) {
  return `${chatId}:${userId}`;
}

// --- Common utilities ---

function askApartmentNumber(
  bot: TelegramBot,
  msg: TelegramBot.Message,
  onValid: (apartmentNumber: number) => void,
  onCancel?: () => void
) {
  const key = getPendingKey(msg.chat.id, msg.from!.id);
  bot.sendMessage(msg.chat.id, translations.enterApartmentNumber, cancelKeyboard);

  pendingReplies[key] = {
    step: 'apartmentNumber',
    chatId: msg.chat.id,
    userId: msg.from!.id,
    handler: (response: TelegramBot.Message) => {
      if (response.from?.id !== msg.from?.id) return; // Only allow the user who started the flow
      if (response.text === translations.cancel) {
        bot.sendMessage(msg.chat.id, translations.welcomeMessage, mainKeyboard);
        delete pendingReplies[key];
        onCancel?.();
        return;
      }
      const apartmentNumber = parseInt(response.text || '', 10);
      if (isNaN(apartmentNumber)) {
        bot.sendMessage(msg.chat.id, translations.invalidApartmentNumber, cancelKeyboard);
        return;
      }
      delete pendingReplies[key];
      onValid(apartmentNumber);
    }
  };
}

function askResidentName(
  bot: TelegramBot,
  msg: TelegramBot.Message,
  onValid: (residentName: string) => void,
  onCancel?: () => void
) {
  const key = getPendingKey(msg.chat.id, msg.from!.id);
  bot.sendMessage(msg.chat.id, translations.enterResidentName, cancelKeyboard);

  pendingReplies[key] = {
    step: 'residentName',
    chatId: msg.chat.id,
    userId: msg.from!.id,
    handler: (response: TelegramBot.Message) => {
      if (response.from?.id !== msg.from?.id) return;
      if (response.text === translations.cancel) {
        bot.sendMessage(msg.chat.id, translations.welcomeMessage, mainKeyboard);
        delete pendingReplies[key];
        onCancel?.();
        return;
      }
      const residentName = response.text?.trim();
      if (!residentName) {
        bot.sendMessage(msg.chat.id, translations.invalidName, cancelKeyboard);
        return;
      }
      delete pendingReplies[key];
      onValid(residentName);
    }
  };
}

function askPhoneNumber(
  bot: TelegramBot,
  msg: TelegramBot.Message,
  onValid: (phone: string) => void,
  onCancel?: () => void
) {
  const key = getPendingKey(msg.chat.id, msg.from!.id);
  bot.sendMessage(msg.chat.id, translations.enterPhoneNumber, cancelKeyboard);

  pendingReplies[key] = {
    step: 'phoneNumber',
    chatId: msg.chat.id,
    userId: msg.from!.id,
    handler: (response: TelegramBot.Message) => {
      if (response.from?.id !== msg.from?.id) return;
      if (response.text === translations.cancel) {
        bot.sendMessage(msg.chat.id, translations.welcomeMessage, mainKeyboard);
        delete pendingReplies[key];
        onCancel?.();
        return;
      }
      const phone = response.text?.trim();
      if (!phone) {
        bot.sendMessage(msg.chat.id, translations.invalidPhoneNumber, cancelKeyboard);
        return;
      }
      delete pendingReplies[key];
      onValid(phone);
    }
  };
}

// --- Main handlers ---
export const handleAddMeAsResident = (bot: TelegramBot, msg: TelegramBot.Message) => {
  const building = loadBuilding();

  askApartmentNumber(bot, msg, async (apartmentNumber) => {
    const userName = msg.from?.username || msg.from?.first_name || 'Unknown User';

    for (const [floor, apartments] of Object.entries(building.schema)) {
      const flat = apartments[apartmentNumber];
      if (flat) {
        if (flat.residents.includes(userName)) {
          bot.sendMessage(
            msg.chat.id,
            translations.alreadyResident
              .replace('{apartmentNumber}', apartmentNumber.toString())
              .replace('{floor}', floor),
            mainKeyboard
          );
          return;
        }

        flat.residents.push(userName);
        await saveBuilding(building);
        // await regenerateBuildingImage(building);
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
  askApartmentNumber(bot, msg, async (selectedApartment) => {
    const userName = msg.from?.username || msg.from?.first_name || 'Unknown User';

    for (const [floor, apartments] of Object.entries(building.schema)) {
      const flat = apartments[selectedApartment];
      if (flat) {
        if (!flat.residents.includes(userName)) {
          bot.sendMessage(
            msg.chat.id,
            translations.notResident
              .replace('{apartmentNumber}', selectedApartment.toString())
              .replace('{floor}', floor),
            mainKeyboard
          );
          return;
        }

        flat.residents = flat.residents.filter((resident: string) => resident !== userName);
        await saveBuilding(building);
        // await regenerateBuildingImage(building);
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
    askResidentName(bot, msg, async (residentName) => {
      try {
        const building = loadBuilding();
        for (const [floorKey, apartments] of Object.entries(building.schema)) {
          const flat = apartments[apartmentNumber];
          if (flat) {
            flat.residents.push(residentName);
            await saveBuilding(building);
            // await regenerateBuildingImage(building);
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

export const handleAddPhoneNumber = (bot: TelegramBot, msg: TelegramBot.Message) => {
  const building = loadBuilding();
  askApartmentNumber(bot, msg, (apartmentNumber) => {
    bot.sendMessage(msg.chat.id, translations.enterPhoneNumber, cancelKeyboard);

    const listener = async (response: TelegramBot.Message) => {
      if (response.text === translations.cancel) {
        bot.sendMessage(msg.chat.id, translations.welcomeMessage, mainKeyboard);
        return;
      }

      const phone = response.text?.trim();
      if (!phone) {
        bot.sendMessage(msg.chat.id, translations.invalidPhoneNumber, cancelKeyboard);
        return;
      }

      for (const [floor, apartments] of Object.entries(building.schema)) {
        const flat = apartments[apartmentNumber];
        if (flat) {
          flat.numbers.push(phone);
          await saveBuilding(building);
          // await regenerateBuildingImage(building);
          bot.sendMessage(
            msg.chat.id,
            translations.phoneNumberAdded
              .replace('{phone}', phone)
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
  });
};

export const handleGetResidentsByApartment = (bot: TelegramBot, msg: TelegramBot.Message) => {
  const building = loadBuilding();
  askApartmentNumber(bot, msg, (apartmentNumber) => {
    try {
      let residents: string[] = [];
      let numbers: string[] = [];
      let floor: string | undefined;

      for (const [floorKey, apartments] of Object.entries(building.schema)) {
        const flat = apartments[apartmentNumber];
        if (flat) {
          residents = flat.residents;
          numbers = flat.numbers;
          floor = floorKey;
          break;
        }
      }

      if (floor) {
        bot.sendMessage(
          msg.chat.id,
          `${translations.residentsList
            .replace('{apartmentNumber}', apartmentNumber.toString())
            .replace('{floor}', floor)
            .replace('{residents}', residents.length ? residents.join(', ') : '—')}
\nPhone numbers: ${numbers.length ? numbers.join(', ') : '—'}`,
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

export const handleRemoveResidentByName = (bot: TelegramBot, msg: TelegramBot.Message) => {
  const building = loadBuilding();
  askApartmentNumber(bot, msg, (apartmentNumber) => {
    askResidentName(bot, msg, async (residentName) => {
      let found = false;
      for (const [floorKey, apartments] of Object.entries(building.schema)) {
        const flat = apartments[apartmentNumber];
        if (flat) {
          const before = flat.residents.length;
          flat.residents = flat.residents.filter((resident: string) => resident !== residentName);
          if (flat.residents.length < before) {
            found = true;
            await saveBuilding(building);
            // await regenerateBuildingImage(building);
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

export const handleRemovePhoneNumber = (bot: TelegramBot, msg: TelegramBot.Message) => {
  const building = loadBuilding();
  askApartmentNumber(bot, msg, (apartmentNumber) => {
    bot.sendMessage(msg.chat.id, translations.enterPhoneNumberToRemove, cancelKeyboard);

    const listener = async (response: TelegramBot.Message) => {
      if (response.text === translations.cancel) {
        bot.sendMessage(msg.chat.id, translations.welcomeMessage, mainKeyboard);
        return;
      }

      const phone = response.text?.trim();
      if (!phone) {
        bot.sendMessage(msg.chat.id, translations.invalidPhoneNumber, cancelKeyboard);
        return;
      }

      for (const [floor, apartments] of Object.entries(building.schema)) {
        const flat = apartments[apartmentNumber];
        if (flat) {
          const index = flat.numbers.indexOf(phone);
          if (index !== -1) {
            flat.numbers.splice(index, 1);
            await saveBuilding(building);
            // await regenerateBuildingImage(building);
            bot.sendMessage(
              msg.chat.id,
              translations.phoneNumberRemoved
                .replace('{phone}', phone)
                .replace('{apartmentNumber}', apartmentNumber.toString())
                .replace('{floor}', floor),
              mainKeyboard
            );
            return;
          } else {
            bot.sendMessage(
              msg.chat.id,
              translations.phoneNumberNotFound
                .replace('{phone}', phone)
                .replace('{apartmentNumber}', apartmentNumber.toString())
                .replace('{floor}', floor),
              mainKeyboard
            );
            return;
          }
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
  });
};

export const handleGenerateBuildingImage = async (bot: TelegramBot, msg: TelegramBot.Message) => {
  try {
    const building = loadBuilding();
    const svgContent = generateSvg(building.schema);
    const pngBuffer = await sharp(Buffer.from(svgContent, 'utf-8')).png().toBuffer();
    await bot.sendPhoto(msg.chat.id, pngBuffer, { caption: 'Карта здания' });
  } catch (error) {
    bot.sendMessage(msg.chat.id, translations.errorGeneratingImage, mainKeyboard);
  }
};

export const handleGenerateFloorImage = (bot: TelegramBot, msg: TelegramBot.Message) => {
  bot.sendMessage(
    msg.chat.id,
    translations.enterFloorNumber || "Выберите этаж:",
    getFloorInlineKeyboard()
  );
};