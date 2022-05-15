require('dotenv').config();

// const { TwitterApi } = require('twitter-api-v2');

// console.log(process.env.TWITTER_USERNAME, process.env.TWITTER_PASSWORD);

// // OAuth 1.0a (User context)
// const userClient = new TwitterApi({
//   appKey: process.env.TWITTER_API_KEY,
//   appSecret: process.env.TWITTER_API_SECRET,
//   accessToken: process.env.TWITTER_BOT_TOKEN,
//   accessSecret: process.env.TWITTER_BOT_SECRET,
// });

// const appOnlyClient = new TwitterApi(process.env.TWITTER_API_TOKEN);

(async () => {
  const { TWITTER_API_TOKEN, TWITTER_API_SECRET } = process.env;
  console.log(TWITTER_API_TOKEN, TWITTER_API_SECRET);
  // Create a partial client for auth links

  // const client = new TwitterApi(TWITTER_API_TOKEN);

  // const client = new TwitterApi({
  //   clientId: TWITTER_API_TOKEN,
  //   clientSecret: TWITTER_API_SECRET,
  // });

  // const { url, codeVerifier, state } = client.generateOAuth2AuthLink(
  //   'http://localhost:5000/',
  //   { scope: ['offline.access'] }
  // );
  // // Redirect your client to {url}
  // console.log('Please go to', url);

  // // ... user redirected to https://your-website.com?code=XXX&state=XXX after user app validation
  // // Validate code to get access token
  // const {
  //   client: loggedClient,
  //   accessToken,
  //   refreshToken,
  // } = await client.loginWithOAuth2({
  //   code,
  //   codeVerifier,
  //   redirectUri: '<CALLBACK_URL>',
  // });

  // console.log('Access token for logged client:', accessToken);
  // console.log('Refresh token to store for client:', refreshToken);

  // // OR - you can also create a app-only client from your consumer keys -
  // const appOnlyClientFromConsumer = await userClient.appLogin();

  // // First, post all your images to Twitter
  // const mediaIds = await Promise.all([
  //   // file path
  //   appOnlyClientFromConsumer.v1.uploadMedia('./tmp/1652571415766.png'),
  // ]);

  // // mediaIds is a string[], can be given to .tweet
  // await appOnlyClientFromConsumer.v1.tweet('My tweet text with two images!', {
  //   media_ids: mediaIds,
  // });
})();
