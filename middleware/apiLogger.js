const logger = require('../utils/logger');

const apiLogger = (req, res, next) => {
  const start = Date.now();
  const { method, originalUrl, headers, query, body } = req;

  const oldSend = res.send;
  res.send = function (data) {
    const duration = `${Date.now() - start}ms`;

    logger.info({
      method,
      statusCode: res.statusCode,
      // duration,
      response: data?.toString()?.slice(0, 1000), // prevent logging large payloads
      // timestamp: new Date().toISOString(),
    });

    res.send = oldSend;
    return res.send(data);
  };

  next();
};

module.exports = apiLogger;
