const crypto = require('crypto');

/**
 * Calculate appid from app name using MD5 hash (first 8 characters)
 * @param {string} appName - The application name
 * @returns {string} - 8 character hex appid
 */
function calculateAppId(appName) {
  const hash = crypto.createHash('md5').update(appName).digest('hex');
  return hash.substring(0, 8);
}

module.exports = { calculateAppId };
