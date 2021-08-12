module.export = function convertUrlToFilename(url) {
  return url?.replace(/[^a-z0-9]/gi, '_').toLowerCase();
};
