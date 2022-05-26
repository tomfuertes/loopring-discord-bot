const axios = require('./axios');
const fs = require('fs');
const mkdirp = require('mkdirp');

const md5 = require('md5');

const { joinImages } = require('join-images');

const endpoint = `https://loopring.mypinata.cloud/ipfs/`;

const Path = require('path');
const sharp = require('sharp');

const downloadImage = async (urlArg) => {
  const url = cleanUrl(urlArg);
  const path = Path.resolve('./tmp/', md5(urlArg));

  if (fs.existsSync(path)) {
    console.log('Found image in cache:', path);
    return path;
  }

  await mkdirp(Path.dirname(path));

  // console.log('Fetching to path:', path);
  const writer = fs.createWriteStream(path);

  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream',
    // timeout: 10000,
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  }).then(() => path);
};

const cleanUrl = (url) => {
  if (url.startsWith('ipfs://')) {
    return url.replace('ipfs://', endpoint);
  } else {
    return url;
  }
};

module.exports = {
  downloadMetaData: async (ipfsMetaDir) => {
    // console.log('download', ipfsMetaDir);

    try {
      return (
        await axios.get(cleanUrl(ipfsMetaDir), {
          // timeout: 10000,
        })
      ).data;
    } catch (e) {
      console.error('ERROR', ipfsMetaDir, e.code, e.message);
      return null;
    }
  },

  downloadImage: async (imageUrl) => {
    // console.log('download', ipfsMetaDir);
    try {
      return await downloadImage(imageUrl);
    } catch (e) {
      console.error('ERROR', imageUrl, e.code, e.message);
      return null;
    }
  },

  join: async (paths) => {
    // console.log('JOIN1');
    const images = paths.filter(Boolean);
    const grid = [];

    const chunkSize = Math.floor(Math.sqrt(images.length));
    for (let i = 0; i < images.length; i += chunkSize) {
      const chunk = images.slice(i, i + chunkSize);
      grid.push(chunk);
    }

    // console.log({ grid });

    const now = new Date().getTime();

    const path = Path.resolve('./tmp/');
    await mkdirp(Path.dirname(path));

    const rows = [];

    for (const paths of grid) {
      // const images = await Promise.all(column.map(downloadImage));
      const buffers = [];
      // console.log('JOIN2');
      for (const path of paths) {
        // console.log('JOIN', path);
        try {
          const buffer = await sharp(path)
            .resize({ fit: 'fill', width: 96, height: 96 })
            .extend({
              top: 2,
              bottom: 2,
              left: 2,
              right: 2,
              background: { r: 0, g: 0, b: 0, alpha: 0 },
            })
            .toBuffer();
          buffers.push(buffer);
        } catch (e) {
          console.log('Error in image. Falling back to oops', e.message);
          const buffer = await sharp(Path.resolve('./tmp/oops.png'))
            .resize({ fit: 'fill', width: 96, height: 96 })
            .extend({
              top: 2,
              bottom: 2,
              left: 2,
              right: 2,
              background: { r: 0, g: 0, b: 0, alpha: 0 },
            })
            .toBuffer();
          buffers.push(buffer);
        }
      }

      const img = await joinImages(buffers, { direction: 'horizontal' });

      // console.log('SUCCESS', img);

      const fn = Path.resolve(path, `${now}-${rows.length}.png`);

      await img.toFile(fn);

      rows.push(fn);
    }

    if (rows.length) {
      const img = await joinImages(rows, { direction: 'vertical' });

      const finalImage = Path.resolve(path, `${now}.png`);

      await img.toFile(finalImage);

      return finalImage;
    }
    return null;
  },
};
