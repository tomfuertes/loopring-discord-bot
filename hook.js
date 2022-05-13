// local testing only

require('dotenv').config();

const { Webhook } = require('discord-webhook-node');

const { DISCORD_WEBHOOK_URL } = process.env;
// console.log(process.env);

const hook = new Webhook(DISCORD_WEBHOOK_URL);

// const IMAGE_URL = 'https://static.loopring.io/assets/svg/logo.svg';

// hook.setAvatar(IMAGE_URL);
hook.send('Hello there!');

hook.sendFile('./tmp/1652553561810.png');
