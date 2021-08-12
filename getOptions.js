const options = {
  output: 'html',
  onlyCategories: ['performance'],
  disableDeviceEmulation: true,
  chromeFlags: ['--disable-mobile-emulation'],
};

module.exports = function getOptions() {
  return options;
};
