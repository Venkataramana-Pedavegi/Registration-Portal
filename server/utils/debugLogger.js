const fs = require('fs');
const path = require('path');
const devLogFile = 'C:/Users/User/.gemini/antigravity-ide/brain/bc2a0d1c-d5fc-4db2-9370-b324ef3c7bd1/debug.log';

const logDebug = (msg) => {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${msg}\n`;
  if (process.env.NODE_ENV !== 'production') {
    try {
      if (fs.existsSync(path.dirname(devLogFile))) {
        fs.appendFileSync(devLogFile, line);
      }
    } catch (err) {
      // Ignore dev file logging errors safely
    }
  }
  console.log(msg);
};

module.exports = logDebug;

