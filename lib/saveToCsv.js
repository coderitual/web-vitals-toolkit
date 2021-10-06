const fs = require('fs');
const path = require('path');

// function creates directoy if it doesn't exist
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath);
  }
}

function saveToCsv(filename, results) {
  ensureDir(path.dirname(filename));
  fs.appendFileSync(
    filename,
    `url, blocked_pattern, first_contentful_paint, cumulative_layout_shift, largest_contentful_paint, max_potential_fid, total_blocking_time, time_to_interactive\n`,
    function (err) {
      if (err) throw err;
    },
  );

  for (const result of results) {
    const {
      url,
      pattern,
      first_contentful_paint,
      cumulative_layout_shift,
      largest_contentful_paint,
      max_potential_fid,
      total_blocking_time,
      time_to_interactive,
    } = result;

    fs.appendFileSync(
      filename,
      `${url}, ${
        pattern || '<no-pattern>'
      }, ${first_contentful_paint}, ${cumulative_layout_shift}, ${largest_contentful_paint}, ${max_potential_fid}, ${total_blocking_time}, ${time_to_interactive}\n`,
      function (err) {
        if (err) throw err;
      },
    );
  }
}

module.exports = saveToCsv;
