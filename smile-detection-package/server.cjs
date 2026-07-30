const https = require('https');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const CERT_DIR = path.join(ROOT, 'certs');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '': 'application/octet-stream',
};

const options = {
  key: fs.readFileSync(path.join(CERT_DIR, 'key.pem')),
  cert: fs.readFileSync(path.join(CERT_DIR, 'cert.pem')),
};

const server = https.createServer(options, (req, res) => {
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/index.html';

  const filePath = path.join(ROOT, urlPath);

  // Security: prevent directory traversal
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  try {
    const data = fs.readFileSync(filePath);
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || MIME[''] });
    res.end(data);
  } catch (e) {
    if (e.code === 'ENOENT') {
      res.writeHead(404);
      res.end('Not Found');
    } else {
      res.writeHead(500);
      res.end('Internal Error');
    }
  }
});

server.listen(3443, '0.0.0.0', () => {
  console.log('HTTPS server running on https://0.0.0.0:3443');
});
