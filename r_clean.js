const fs = require('fs');

const chunks = [
  '744355e03808d4c7.js',
  'ff1a16fafef87110.js',
  'b5dc6c688de67194.js',
  '66b231c2403f619d.js',
  '6c30b25e2bb0f61b.js',
  '00b14ecd4259e536.js',
  '9c1a610b51ddbac7.js'
];

async function check() {
  for (const chunk of chunks) {
    try {
      const url = `https://vidnest.fun/_next/static/chunks/${chunk}`;
      const js = await fetch(url).then(r => r.text());
      console.log(`\nChunk: ${chunk}`);
      console.log(`  Contains "/api/":`, js.includes('/api/'));
      console.log(`  Contains "fetch":`, js.includes('fetch'));
      console.log(`  Contains "axios":`, js.includes('axios'));
      const matches = js.match(/\/api\/[a-zA-Z0-9_\-\/]+/g) || [];
      if (matches.length > 0) {
        console.log(`  API matches:`, [...new Set(matches)].slice(0, 10));
      }
      const fetchUrls = js.match(/https?:\/\/[a-zA-Z0-9_\-\.\/]+/g) || [];
      if (fetchUrls.length > 0) {
        console.log(`  HTTP URLs:`, [...new Set(fetchUrls)].slice(0, 10));
      }
    } catch (e) {
      console.error(`Failed to check ${chunk}:`, e.message);
    }
  }
}
check();
