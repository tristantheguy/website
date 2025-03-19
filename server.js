const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({ origin: 'http://www.marksnpcgenerator.ga' }));

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.use(express.static(__dirname + '/public'));

app.listen(3000, function() {
  console.log('Web server listening on port 3000');
});
