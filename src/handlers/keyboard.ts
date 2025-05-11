export const mainKeyboard = {
  reply_markup: {
    keyboard: [
      [{ text: 'Add Apartment' }],
      [{ text: 'List Apartments' }],
      [{ text: 'Add Me as Resident' }],
      [{ text: 'Remove Me as Resident' }], // New button
      [{ text: 'Add Residents' }],
      [{ text: 'List Residents' }],
    ],
    resize_keyboard: true,
    one_time_keyboard: false,
  },
};