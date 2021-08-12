module.exports = function convertUrlToFilename(url) {
  return url
    ?.replace(/http[s]?\:\/\//gi, '')
    .replace(/[^a-z0-9]/gi, '_')
    .toLowerCase();
};
