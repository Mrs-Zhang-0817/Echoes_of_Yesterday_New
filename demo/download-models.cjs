const fs = require('fs');
const path = require('path');
const https = require('https');

const BASE = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/';

const files = [
  'tiny_face_detector_model-shard1',
  'tiny_face_detector_model-shard2',
  'tiny_face_detector_model-weights_manifest.json',
  'face_expression_model-shard1',
  'face_expression_model-weights_manifest.json',
];

const outDir = path.join(__dirname, 'demo', 'models');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

function download(url, dest) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        https.get(res.headers.location, (r2) => {
          const buf = [];
          r2.on('data', d => buf.push(d));
          r2.on('end', () => {
            fs.writeFileSync(dest, Buffer.concat(buf));
            console.log('OK:', path.basename(dest));
            resolve();
          });
        }).on('error', (e) => {
          console.log('FAIL:', path.basename(dest), e.message);
          resolve();
        });
        return;
      }
      const buf = [];
      res.on('data', d => buf.push(d));
      res.on('end', () => {
        fs.writeFileSync(dest, Buffer.concat(buf));
        console.log('OK:', path.basename(dest));
        resolve();
      });
    }).on('error', (e) => {
      console.log('FAIL:', path.basename(dest), e.message);
      resolve();
    });
  });
}

(async () => {
  for (const f of files) {
    console.log('Downloading', f, '...');
    await download(BASE + f, path.join(outDir, f));
    await new Promise(r => setTimeout(r, 200));
  }
  console.log('Done');
})();
