const fs = require('fs');
const path = require('path');
const logFile = 'C:/Users/User/.gemini/antigravity-ide/brain/bc2a0d1c-d5fc-4db2-9370-b324ef3c7bd1/debug.log';

const logDebug = (msg) => {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${msg}\n`;
  try {
    fs.appendFileSync(logFile, line);
  } catch (err) {
    console.error('Failed to write to debug.log:', err.message);
  }
  console.log(msg);
};

module.exports = logDebug;
