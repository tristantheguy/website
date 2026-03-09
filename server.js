const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors({ origin: 'http://www.marksnpcgenerator.ga' }));

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve all website files from the repo root. Some pages and assets are not in /public.
app.use(express.static(__dirname));

app.listen(3000, function() {
  console.log('Web server listening on port 3000');
});
