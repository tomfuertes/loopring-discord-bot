require('dotenv').config();
// console.log(process.env.DISCORD_WEBHOOK_URL);

const axios = require('./axios');

const { Webhook } = require('discord-webhook-node');
const ASSET_TRACKER = new Webhook(process.env.DISCORD_ASSET_WEBHOOK_URL);
ASSET_TRACKER.setUsername('Loopring Heroku Bot');

const NFT_TRACKERS = [
  new Webhook(process.env.DISCORD_NFT_WEBHOOK_URL),
  // new Webhook(process.env.DISCORD_LRC_WEBHOOK_URL),
];

const NFT_TRACKER = {};
['send', 'sendFile', 'setUsername', 'setAvatar'].forEach((fn) => {
  NFT_TRACKER[fn] = async (...args) =>
    Promise.all(NFT_TRACKERS.map((tracker) => tracker[fn](...args)));
});

NFT_TRACKER.setUsername('Loopring Heroku Bot');

const AVATAR = 'https://i.imgur.com/hayWcnY.jpg';
ASSET_TRACKER.setAvatar(AVATAR);
NFT_TRACKER.setAvatar(AVATAR);

const IS_DEV = (process.env.npm_lifecycle_script || '').includes('nodemon');

if (IS_DEV) {
  ['send', 'sendFile', 'setUsername', 'setAvatar'].forEach((el) => {
    ASSET_TRACKER[el] = console.log.bind(console, 'SENDING:', el);
    NFT_TRACKER[el] = console.log.bind(console, 'SENDING:', el);
  });
}

const loopring = require('./loopring');

// console.log('nftUtils');
const nftsUtils = require('./nft');
// console.log('nftUtils', nftsUtils);

const redis = require('./redis');

const ipfs = require('./ipfs');

const mapping = {};
const accounts = [];

const YAML = require('yaml');

const { MONITOR_YAML: MONITOR_YAML_URL } = process.env;
(async () => {
  const CACHBUSTED = `${MONITOR_YAML_URL}?cb=${new Date().getTime()}`;
  console.log('CACHBUSTED', CACHBUSTED);
  const yaml = await (async () => {
    const fs = require('fs');
    const local = './.monitor.yaml';
    if (fs.existsSync(local)) return fs.readFileSync(local, 'utf8');
    if (MONITOR_YAML_URL) return (await axios.get(CACHBUSTED)).data;
    return `86552: 'Minted GStop NFTs'`;
  })();
  const config = YAML.parse(yaml);
  Object.assign(mapping, config);
  accounts.push(...Object.keys(mapping));
  console.log('monitoring', accounts, accounts.length);
  // console.log({ yaml, config, mapping });
})();

const checks = [
  'account', // generic
  'fromAccount', // transfer
  'accountA', // trade
  'accountB', // trade
  'user', // ???
  'minter', // nft
  /*'toAccount',*/
];

const processBlock = async (id) => {
  const processed = await redis.get(`block:${id}`);
  if (!IS_DEV && processed) return console.log('block', { id, processed });

  // if (IS_DEV && id !== '21496') return; //  console.log('skipping');

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
        // console.log(transaction);
      });

    if (
      transaction.__typename === 'MintNFT' ||
      transaction.__typename === 'MintNft'
    ) {
      nfts.push(transaction);
      // console.log(transaction);
    }
  }

  console.log(`NFTs minted in block ${id}: ${nfts.length}`);

  const images = [];
  for (const nft of nfts) {
    if (nft.id === '21866-217') continue; // abort a rando large request
    if (nft.id === '22211-27') continue; // abort a rando large request
    if (
      nft.minter &&
      nft.minter.address === '0x9fb516b06de9d12915785fb555b3d69dc83d0383'
    )
      continue; // abort a rando large request

    console.log('nft', {
      l2: nft.id,
      minter: nft.minter && nft.minter.address,
      id: nft.nft.id,
      // nft: Object.keys(nft),
    });
    const url = await nftsUtils.idToUrl(nft.nft.id);

    // eslint-disable-next-line no-unused-vars
    const [minter, contract, nftId] = (() => {
      const [minter, contract, nftId] = nft.nft.id
        .replace(/-0x/g, '|0x')
        .split('|');
      return [minter.split('-')[0], contract, nftId.split('-')[0]];
    })();

    const metadata = await ipfs.downloadMetaData(url);
    // console.log(metadata);

    if (metadata) {
      const path = await ipfs.downloadImage(metadata.image);
      if (path) {
        images.push(path);
        const count = await redis.incr(`nft:${contract}`);
        console.log({ contract, count });
        await redis.expire(`nft:${contract}`, 60 * 60 * 24); // 24 hours
        if (
          count === 1 &&
          JSON.stringify(metadata).includes('api.nft.gamestop.com')
        ) {
          await NFT_TRACKER.send(
            `New Gamestop Collection: https://explorer.loopring.io/collections/${contract}: \`\`\`${YAML.stringify(
              metadata,
              null,
              2
            ).trim()}\`\`\``
          );
        } else if (count === 100) {
          await NFT_TRACKER.send(
            `Large collection: https://explorer.loopring.io/collections/${contract}: \`\`\`${YAML.stringify(
              metadata,
              null,
              2
            ).trim()}\`\`\``
          );
        }
      }
    }
    // sdafsad();
  }

  const messages = [];

  for (const [account, types] of Object.entries(actions)) {
    const name = mapping[account];
    messages.push(
      `\`${name}\` had ${
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
    await ASSET_TRACKER.send(
      "Pulse Check every 50th block. I'm still alive and monitoring: " +
        MONITOR_YAML_URL
    );
    // const repl = `\`\`\`${}\`\`\``;

    // const monitoring = JSON.stringify(mapping, null, 2)
    //   .split('\n')
    //   .map((s) => s.trim())
    //   .filter((s) => s.length > 1)
    //   .map((s) => s.split(': ').reverse().join('|'))
    //   .sort()
    //   .map((s) => s.split('|').reverse().join(': '));
    // // monitoring.shift();
    // // monitoring.pop();

    // let chunkSizeSplit = 1;
    // let sent = false;

    // while (!sent) {
    //   const grid = [];
    //   const chunkSize = Math.ceil(monitoring.length / chunkSizeSplit);
    //   for (let i = 0; i < monitoring.length; i += chunkSize) {
    //     const chunk = monitoring.slice(i, i + chunkSize);
    //     grid.push(chunk);
    //   }

    //   const sends = grid.map((g) => g.join('\n'));

    //   if (sends.find((s) => s.length + repl.length > 1900)) {
    //     chunkSizeSplit++;
    //     continue;
    //   } else {
    //     for (const toSend of sends) {
    //       await ASSET_TRACKER.send(repl.replace('TODO', toSend));
    //     }
    //     sent = true;
    //     break;
    //   }
    // }
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
    `View of ${nfts.length} NFTs in https://explorer.loopring.io/block/${id}?type=MintNft`
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

  try {
    const { message, status, result } = (
      await axios.get(
        `https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${process.env.ETHERSCAN_API_KEY}`
      )
    ).data;
    if (status === '1' && message === 'OK') {
      console.log('result', result);
      const { FastGasPrice } = result;
      if (parseInt(FastGasPrice, 10) <= 20) {
        await ASSET_TRACKER.send(
          `FastGasPrice: ${FastGasPrice} @ https://etherscan.io/gastracker`
        );
      }
    }
  } catch (e) {
    console.error('try get gas error', e);
  }

  try {
    for (const block of (
      await loopring.getBlocks(50)
    ).data.data.blocks.reverse()) {
      await processBlock(block.id);
    }
  } catch (error) {
    console.error('process blocks error', error);
  }
  process.exit(0);
})();
