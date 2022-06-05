const axios = require('axios');

const api = axios.create({
  timeout: 5000,
});

api.interceptors.request.use((request) => {
  console.log('Starting Request', request.method, request.url);
  return request;
});

api.interceptors.response.use((response) => {
  console.log(
    'Response:',
    response.status,
    response.statusText,
    response.config.method,
    response.config.url
  );
  return response;
});

const requestTimeoutInterceptor = (config) => {
  // console.log('intercepted', config);
  if (config.timeout === undefined || config.timeout === 0) {
    return config;
  }

  const source = axios.CancelToken.source();

  setTimeout(() => {
    source.cancel(
      `Cancelled request. Took longer than ${config.timeout}ms to get complete response.`
    );
  }, config.timeout);

  // If caller configures cancelToken, preserve cancelToken behaviour.
  if (config.cancelToken) {
    config.cancelToken.promise.then((cancel) => {
      source.cancel(cancel.message);
    });
  }

  // console.log('config', config);

  return { ...config, cancelToken: source.token };
};

api.interceptors.request.use(requestTimeoutInterceptor);

module.exports = api;
