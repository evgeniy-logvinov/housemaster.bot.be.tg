export const mainKeyboard = {
  reply_markup: {
    keyboard: [
      [{ text: 'Add Me as Resident' }], // Button to add the current user as a resident
      [{ text: 'Remove Me as Resident' }], // Button to remove the current user as a resident
      [{ text: 'Get Residents by Apartment' }] // Button to get residents by apartment number
    ],
    resize_keyboard: true,
    one_time_keyboard: false
  }
};