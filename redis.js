require('dotenv').config();

const redisOpts = {
  url: process.env.REDIS_TLS_URL || process.env.REDIS_URL,
};

if (process.env.REDIS_TLS_URL) {
  redisOpts.socket = {
    tls: true,
    rejectUnauthorized: false,
  };
}

const client = require('redis').createClient(redisOpts);

// DO NOT DELETE THESE LINES THEY ARE CRITICAL: https://github.com/redis/node-redis/issues/2032
client.on('error', (err) => console.log('client error', err));
client.on('connect', () => console.log('client is connect'));
client.on('reconnecting', () => console.log('client is reconnecting'));
client.on('ready', () => console.log('client is ready'));
// END DO NOT DELETE

client.connect(); // technically you have to await() here, but not easy to do in an import

module.exports = client;
