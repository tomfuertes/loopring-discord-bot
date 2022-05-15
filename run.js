require('dotenv').config();
// console.log(process.env.DISCORD_WEBHOOK_URL);

const axios = require('axios');

const { Webhook } = require('discord-webhook-node');
const ASSET_TRACKER = new Webhook(process.env.DISCORD_ASSET_WEBHOOK_URL);
ASSET_TRACKER.setUsername('Loopring Heroku Bot');
const NFT_TRACKER = new Webhook(process.env.DISCORD_NFT_WEBHOOK_URL);
NFT_TRACKER.setUsername('Loopring Heroku Bot');

const IS_DEV = (process.env.npm_lifecycle_script || '').includes('nodemon');

if (IS_DEV) {
  ASSET_TRACKER.send = console.log.bind(console, 'SENDING:');
  ASSET_TRACKER.sendFile = console.log.bind(console, 'SENDING FILE:');
  NFT_TRACKER.send = console.log.bind(console, 'SENDING:');
  NFT_TRACKER.sendFile = console.log.bind(console, 'SENDING FILE:');
}

const loopring = require('./loopring');

// console.log('nftUtils');
const nftsUtils = require('./nft');
// console.log('nftUtils', nftsUtils);

const redis = require('./redis');

const ipfs = require('./ipfs');

const mapping = {};
const accounts = [];

(async () => {
  const YAML = require('yaml');
  const { MONITOR_YAML } = process.env;
  const CACHBUSTED = `${MONITOR_YAML}?cb=${new Date().getTime()}`;
  console.log('CACHBUSTED', CACHBUSTED);
  const yaml = await (async () => {
    const fs = require('fs');
    const local = './.monitor.yaml';
    if (fs.existsSync(local)) return fs.readFileSync(local, 'utf8');
    if (MONITOR_YAML) return (await axios.get(CACHBUSTED)).data;
    return `86552: 'Minted GStop NFTs'`;
  })();
  const config = YAML.parse(yaml);
  Object.assign(mapping, config);
  accounts.push(...Object.keys(mapping));
  console.log('monitoring', accounts, accounts.length);
  // console.log({ yaml, config, mapping });
})();

const checks = ['account', 'fromAccount', 'toAccount', 'user', 'minter'];

const processBlock = async (id) => {
  const processed = await redis.get(`block:${id}`);
  if (!IS_DEV && processed) return console.log('block', { id, processed });

  const block = await loopring.getBlock(id);
  // console.log(block);
  const { transactions } = block.data.data;
  // console.log(transactions);

  console.log('LRC Transactions', { id, count: transactions.length });

  // console.log(accounts);

  const actions = {};

  const nfts = [];

  for (const transaction of transactions) {
    // find all ids
    checks
      .map((key) => transaction[key] && transaction[key].id)
      .filter(Boolean)
      .filter(accounts.includes.bind(accounts))
      .forEach((id) => {
        actions[id] = actions[id] || [];
        actions[id].push(transaction.__typename);
      });

    if (transaction.__typename === 'MintNFT') {
      nfts.push(transaction);
      // console.log(transaction);
    }
  }

  console.log(`NFTs minted in block ${id}: ${nfts.length}`);

  const images = [];
  for (const nft of nfts) {
    const url = await nftsUtils.idToUrl(nft.nft.id);
    const path = await ipfs.download(url);
    images.push(path);
  }

  const messages = [];

  for (const [account, types] of Object.entries(actions)) {
    const name = mapping[account];
    messages.push(
      `\`${name}\` did ${
        types.length
      } transactions: https://explorer.loopring.io/account/${account} ${JSON.stringify(
        types.reduce((total, value) => {
          total[value] = (total[value] || 0) + 1;
          return total;
        }, {})
      ).replace(/"/g, '')}`
    );
  }
  if (id % 50 === 0) {
    await NFT_TRACKER.send(
      `Pulse Check every 50th block. I'm still alive and monitoring: \`\`\`${JSON.stringify(
        mapping,
        null,
        2
      )}\`\`\``
    );
  }

  if (messages.length) {
    await ASSET_TRACKER.send(
      `Activity in https://explorer.loopring.io/block/${id}\n${messages.join(
        '\n'
      )}`
    );
    // } else {
    //   ASSET_TRACKER.send(`No activity from ${accounts.join(', ')} in this block`);
  }

  await NFT_TRACKER.send(
    `View of ${images.length} NFTs in https://explorer.loopring.io/block/${id}?type=MintNFT`
  );

  if (images.length) {
    const combined = await ipfs.join(images);
    // console.log(combined);
    if (combined) {
      await NFT_TRACKER.sendFile(combined);
    }
  }

  await redis.set(`block:${id}`, new Date().toISOString());

  // transactions.forEach((tx) => {
  //   if (
  //     tx.__typename.includes('Transfer') &&
  //     tx.token &&
  //     ['0', '1'].includes(tx.token.id)
  //   ) {
  //     const amount = parseFloat(tx.amount / 10 ** 18);

  //     console.log(tx);

  //     if (tx.token.id === '0' && amount > 0.5) {
  //       log.push(
  //         `${amount.toFixed(2)} ETH: https://explorer.loopring.io/tx/${
  //           tx.id
  //         } from: ${tx.fromAccount.id} to: ${tx.toAccount.id} `
  //       );
  //     }

  //     if (tx.token.id === '1' && amount > 1000) {
  //       log.push(
  //         `${amount.toFixed(2)} LRC https://explorer.loopring.io/tx/${
  //           tx.id
  //         } from: ${tx.fromAccount.id} to: ${tx.toAccount.id} `
  //       );
  //     }
  //   }
  // });
};

(async () => {
  console.log('run', new Date());
  for (const block of (await loopring.getBlocks()).data.data.blocks.reverse()) {
    await processBlock(block.id);
  }
  process.exit(0);
})();
