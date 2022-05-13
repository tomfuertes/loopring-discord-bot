require('dotenv');
const { ethers } = require('ethers');
const redis = require('./redis');

// Connect to mainnet with a Project ID and Project Secret
const provider = new ethers.providers.InfuraProvider('homestead', {
  projectId: process.env.INFURA_PROJECT_ID,
  projectSecret: process.env.INFURA_PROJECT_SECRET,
});

const getMetaDataLink = async (
  tokenId,
  tokenAddress,
  contractABI,
  functionName
) => {
  console.log('getMetaDataLink', tokenAddress, functionName);
  try {
    let contract = new ethers.Contract(tokenAddress, [contractABI], provider);
    // console.log('contract', Object.keys(contract));
    let currentValue = await contract[functionName](tokenId);
    // console.log('currentValue', currentValue);
    return currentValue;
  } catch (err) {
    // console.error(err);
    return null;
  }
};

const idToUrl = async (id) => {
  // eslint-disable-next-line no-unused-vars
  const [minter, contract, nftId] = (() => {
    const [minter, contract, nftId] = id.replace(/-0x/g, '|0x').split('|');
    return [minter.split('-')[0], contract, nftId.split('-')[0]];
  })();

  const r = await redis.get(`nft:${id}`);
  if (r) return r;

  const waterfall = [
    // 'l2',
    [
      nftId,
      `0xB25f6D711aEbf954fb0265A3b29F7b9Beba7E55d`,
      `function uri(uint256 id) external view returns (string memory)`,
      `uri`,
    ],
    // '1155
    [
      nftId,
      contract,
      `function uri(uint256 id) external view returns (string memory)`,
      `uri`,
    ],
    // '721'
    [
      nftId,
      contract,
      `function tokenURI(uint256 tokenId) public view virtual override returns (string memory)`,
      `tokenURI`,
    ],
  ];
  for (const args of waterfall) {
    const res = await getMetaDataLink(...args);
    if (res) {
      console.log('res', res);
      await redis.set(`nft:${id}`, res);
      return res;
    }
  }
};

// async getEthAddressFromEns(ens: string | null) : Promise<string> {
//   let web3 = new Web3(`https://mainnet.infura.io/v3/53173af3389645d18c3bcac2ee9a751c`);
//   let ensService = new ENSService(web3);
//   try {
//       return await ensService.ResolveAddressAsync(ens);
//   } catch(e) {
//       Trace.WriteLine(e.StackTrace + `\n` + e.Message);
//       return null;
//   }
// }

module.exports = {
  idToUrl,
  getMetaDataLink,
  // , getEthAddressFromEns
};
