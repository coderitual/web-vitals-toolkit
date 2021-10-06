const argv = require('yargs').argv;
const convertUrlToFilename = require('./lib/convertUrlToFilename');
const lighthouseFromPuppeteer = require('./lib/lighthouseFromPuppeteer');
const saveToCsv = require('./lib/saveToCsv');
const gatherScriptsFromUrl = require('./lib/gatherScriptsFromUrl');
const getBlockedUrlPatterns = require('./getBlockedUrlPatterns');
const getConfig = require('./getConfig');
const getOptions = require('./getOptions');

// CLI arguments
const numberOfRuns = argv.numberOfRuns ?? 5;
const dynamicPatterns = argv.dynamicPatterns ?? false;
const url =
  argv.url ?? 'https://brainly.com/question/1713545?adsAmazonTam=true';
const filename =
  argv.filename ??
  `results/progressive_n${numberOfRuns}_${convertUrlToFilename(
    url,
  )}-${Date.now()}.csv`;

const blockedUrlPatterns = getBlockedUrlPatterns();
const config = getConfig();
const options = getOptions();

async function gatherResults(url, blockedUrlPatterns, options, config) {
  const results = [];
  const patterns = ['', ...blockedUrlPatterns];
  const blockedPatterns = [];
  const runs = patterns.length * numberOfRuns;
  let run = 0;
  for (const pattern of patterns) {
    blockedPatterns.push(pattern);
    console.log('blocked patterns:', blockedPatterns);
    for (let i = 0; i < numberOfRuns; i++) {
      run++;
      console.log(`\n🏃‍♂️ Run progressive: ${run} / ${runs}`);
      const opts = {
        ...options,
        blockedUrlPatterns: blockedPatterns.filter(Boolean),
      };
      const result = await lighthouseFromPuppeteer(url, opts, config);
      results.push({
        url,
        pattern,
        ...result,
      });
    }
  }
  return results;
}

async function main() {
  const urlObject = new URL(url);
  const urlHostname = urlObject.hostname;
  console.log({ dynamicPatterns, url, urlHostname });
  const patterns = dynamicPatterns
    ? [
        ...new Set(
          (await gatherScriptsFromUrl(url, options, config))
            .reverse()
            .map((url) => {
              const urlObject = new URL(url);
              const hostname = urlObject.hostname;
              return hostname;
            })
            .filter((hostname) => urlHostname !== hostname)
            .map((hostname) => `*${hostname}*`),
        ),
        `*${urlHostname}*`,
        '*',
      ]
    : blockedUrlPatterns;

  console.log(`🏃‍♂️ Gather results for ${url}`);
  console.log(`🏃‍♂️ Gather blocked patterns(${patterns.length}):`, patterns);
  console.log(`🏃‍♂️ Gather ${numberOfRuns} runs`);
  console.log(`🏃‍♂️ Save results to ${filename}`);

  const results = await gatherResults(url, patterns, options, config);
  saveToCsv(filename, results);
  process.exit(0);
}

main();
