const axios = require('axios');

const getBlocks = async () =>
  axios.post(
    'https://api.thegraph.com/subgraphs/name/juanmardefago/loopring36',
    {
      query: `
    query blocks(
      $skip: Int
      $first: Int
      $orderBy: Block_orderBy
      $orderDirection: OrderDirection
    ) {
      proxy(id: 0) {
        blockCount
        userCount
      }
      blocks(
        skip: $skip
        first: $first
        orderBy: $orderBy
        orderDirection: $orderDirection
      ) {
        ...BlockFragment
        transactionCount
      }
    }

    fragment BlockFragment on Block {
      id
      timestamp
      txHash
      gasLimit
      gasPrice
      height
      blockHash
      blockSize
      gasPrice
      operatorAccount {
        ...AccountFragment
      }
    }

    fragment AccountFragment on Account {
      id
      address
    }`,
      variables: {
        skip: 0,
        first: 10,
        orderBy: 'internalID',
        orderDirection: 'desc',
      },
    }
  );

const getBlock = async (block, first = 1000) =>
  axios.post(
    'https://api.thegraph.com/subgraphs/name/juanmardefago/loopring36',
    {
      query: `
      query transactions(
        $skip: Int
        $first: Int
        $orderBy: Transaction_orderBy
        $orderDirection: OrderDirection
        $block: Block_height
        $where: Transaction_filter
      ) {
        proxy(id: 0) {
          transactionCount
          depositCount
          withdrawalCount
          transferCount
          addCount
          removeCount
          orderbookTradeCount
          swapCount
          accountUpdateCount
          ammUpdateCount
          signatureVerificationCount
          tradeNFTCount
          swapNFTCount
          withdrawalNFTCount
          transferNFTCount
          nftMintCount
          nftDataCount
        }
        transactions(
          skip: $skip
          first: $first
          orderBy: $orderBy
          orderDirection: $orderDirection
          block: $block
          where: $where
        ) {
          id
          internalID
          data
          ...AddFragment
          ...RemoveFragment
          ...SwapFragment
          ...OrderbookTradeFragment
          ...DepositFragment
          ...WithdrawalFragment
          ...TransferFragment
          ...AccountUpdateFragment
          ...AmmUpdateFragment
          ...SignatureVerificationFragment
          ...TradeNFTFragment
          ...SwapNFTFragment
          ...WithdrawalNFTFragment
          ...TransferNFTFragment
          ...MintNFTFragment
          ...DataNFTFragment
        }
      }


      fragment AccountFragment on Account {
        id
        address
      }


      fragment TokenFragment on Token {
        id
        name
        symbol
        decimals
        address
      }

      fragment NFTFragment on NonFungibleToken {
        id
        minter {
          ...AccountFragment
        }
        nftID
        nftType
        token
      }



      fragment AddFragment on Add {
        id
        account {
          ...AccountFragment
        }
        token {
          ...TokenFragment
        }
        feeToken {
          ...TokenFragment
        }
        amount
        fee
        __typename
      }


      fragment RemoveFragment on Remove {
        id
        account {
          ...AccountFragment
        }
        token {
          ...TokenFragment
        }
        feeToken {
          ...TokenFragment
        }
        amount
        fee
        __typename
      }


      fragment SwapFragment on Swap {
        id
        account {
          ...AccountFragment
        }
        tokenA {
          ...TokenFragment
        }
        tokenB {
          ...TokenFragment
        }
        pair {
          id
          token0 {
            symbol
          }
          token1 {
            symbol
          }
        }
        tokenAPrice
        tokenBPrice
        fillSA
        fillSB
        fillBA
        protocolFeeA
        protocolFeeB
        feeA
        feeB
        __typename
      }


      fragment OrderbookTradeFragment on OrderbookTrade {
        id
        accountA {
          ...AccountFragment
        }
        accountB {
          ...AccountFragment
        }
        tokenA {
          ...TokenFragment
        }
        tokenB {
          ...TokenFragment
        }
        pair {
          id
          token0 {
            symbol
          }
          token1 {
            symbol
          }
        }
        tokenAPrice
        tokenBPrice
        fillSA
        fillSB
        fillBA
        fillBB
        fillAmountBorSA
        fillAmountBorSB
        feeA
        feeB
        __typename
      }


      fragment DepositFragment on Deposit {
        id
        toAccount {
          ...AccountFragment
        }
        token {
          ...TokenFragment
        }
        amount
        __typename
      }


      fragment WithdrawalFragment on Withdrawal {
        fromAccount {
          ...AccountFragment
        }
        token {
          ...TokenFragment
        }
        feeToken {
          ...TokenFragment
        }
        amount
        fee
        __typename
      }


      fragment TransferFragment on Transfer {
        fromAccount {
          ...AccountFragment
        }
        toAccount {
          ...AccountFragment
        }
        token {
          ...TokenFragment
        }
        feeToken {
          ...TokenFragment
        }
        amount
        fee
        __typename
      }


      fragment AccountUpdateFragment on AccountUpdate {
        user {
          id
          address
          publicKey
        }
        feeToken {
          ...TokenFragment
        }
        fee
        nonce
        __typename
      }


      fragment AmmUpdateFragment on AmmUpdate {
        tokenID
        feeBips
        tokenWeight
        nonce
        balance
        tokenBalances {
          id
          balance
          token {
            ...TokenFragment
          }
        }
        __typename
      }


      fragment SignatureVerificationFragment on SignatureVerification {
        account {
          ...AccountFragment
        }
        verificationData
        __typename
      }


      fragment TradeNFTFragment on TradeNFT {
        accountSeller {
          ...AccountFragment
        }
        accountBuyer {
          ...AccountFragment
        }
        token {
          ...TokenFragment
        }
        nfts {
          ...NFTFragment
        }
        realizedNFTPrice
        feeBuyer
        protocolFeeBuyer
        __typename
      }


      fragment SwapNFTFragment on SwapNFT {
        accountA {
          ...AccountFragment
        }
        accountB {
          ...AccountFragment
        }
        nfts {
          ...NFTFragment
        }
        __typename
      }


      fragment WithdrawalNFTFragment on WithdrawalNFT {
        fromAccount {
          ...AccountFragment
        }
        fee
        feeToken {
          ...TokenFragment
        }
        nfts {
          ...NFTFragment
        }
        __typename
      }


      fragment TransferNFTFragment on TransferNFT {
        fromAccount {
          ...AccountFragment
        }
        toAccount {
          ...AccountFragment
        }
        feeToken {
          ...TokenFragment
        }
        nfts {
          ...NFTFragment
        }
        fee
        __typename
      }


      fragment MintNFTFragment on MintNFT {
        minter {
          ...AccountFragment
        }
        receiver {
          ...AccountFragment
        }
        receiverSlot {
          id
        }
        nft {
          id
        }
        fee
        feeToken {
          ...TokenFragment
        }
        amount
        __typename
      }


      fragment DataNFTFragment on DataNFT {
        __typename
      }`,

      variables: {
        skip: 0,
        first,
        orderBy: 'internalID',
        orderDirection: 'desc',
        where: { block },
      },
    }
  );

module.exports = { getBlocks, getBlock };
