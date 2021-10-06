module.exports = function getCurrentDate() {
  return new Date()
    .toLocaleString()
    .replace(/\//gi, '-')
    .replace(/\:/gi, '-')
    .replace(', ', '_');
};
