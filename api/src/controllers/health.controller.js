const messages = [
  'HELLO WORLD, THIS IS ELI GPT REPORTING FOR DUTY',
  'Greetings! Eli GPT here, ready to assist.',
  'Hello there! Eli GPT at your service.',
  'Good day! Eli GPT here to help you.',
  "Hey, it's Eli GPT! How can I assist you today?",
  'Welcome! Eli GPT here, ready to provide support.',
  'Hi! Eli GPT checking in for duty.',
  'Greetings, world! This is Eli GPT reporting in.',
  'Hey there! Eli GPT here to lend a hand.',
  'Hello everyone! Eli GPT ready to assist you.',
];

export const check = (req, res) => {
  const randomIndex = Math.floor(Math.random() * messages.length);
  res.send({ message: messages[randomIndex] });
};
