const fs = require('fs');

const fsPromise = fs.promises;

async function log(logData) {
  try {
    logData = `\n ${new Date().toString()} - ${logData} \n`;
    await fsPromise.appendFile(
      'log.txt',
      logData
    );
  } catch (err) {
    //console.log(err);
  }
}

const loggerMiddleware = async (req, res, next) => {
  // Store the original send method
  const originalSend = res.send;

  // Override res.send to capture response body
  res.send = function (body) {
    // Log request details
    const logData = `\n Request URL - ${req.url} - Request Body - ${JSON.stringify(req.body)} - Response Status: ${res.statusCode} - Response Body: ${body}`;
    
    // Write the log to the log file
    log(logData);
    
    // Call the original send method to complete the response
    originalSend.call(this, body);
  };

  next();
};

module.exports = loggerMiddleware;
