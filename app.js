
// Server config
const https = require('https');
const fs = require('fs');
const express = require('express');
const socket = require('socket.io');
var numconnections = 0;
var dict = {};
var local = 1; // Change to 0 before uploading to production server
let options;

// App setup
const app = express();

//---------------------------------
// DELETE PUBLIC RELEASE
if (local == 1) {
  // LOCAL HTTPS
    options = {
    key: fs.readFileSync('/path/to/key.pem'),
    cert: fs.readFileSync('/path/to/cert.pem'),
  };
} else {
  // CROWDJ.NET HTTPS
    options = {
    key: fs.readFileSync('/path/to/key.pem'),
    cert: fs.readFileSync('/path/to/cert.pem'),
  };
};
//---------------------------------

// Quick browser test that HTTPS is working
// app.use((req, res, next) => {
//   res.send('<h1>HTTPS is working!</h1>');
// });

// Previous HTTP test
// app.get('/', (req, res) => {
//   res.send('Hello World!')
// })

// Send HTML File test
// app.get('/', (req, res) => {
//   res.sendFile('./public/index.html', { root: __dirname })
// })
//

const port = 3000;

const server = https.createServer(options, app).listen(port, () => {
  console.log('Server listening on port ' + port);
});

// Previous HTTP server
// app.listen(port, () => {
//   console.log(`Example app listening at http://localhost:${port}`)
// })

// Go to https://localhost:3000/ and it should go to public
app.use(express.static('public'))

// Socket setup
const io = socket(server);

io.on('connection', (socket) => {

  console.log('a user connected, made socket connection', socket.id);
  numconnections++;
  console.log('numconnections: ' + numconnections);


  // Handle position message event
  // New connection: store connection ID
  socket.on('position message', (data) => {

    console.log('latitude: ' + data.latitude);
    console.log('longitude: ' + data.longitude);
    // Real distributed mode
    let normlat = normLatitude(parseFloat(data.latitude)); // Float
    let normlon = normLongitude(parseFloat(data.longitude)); // Float
    console.log('normalised latitude: ' + normlat);
    console.log('normalised longitude: ' + normlon);

    let freq = map2Frequency(normlon); // Integer
    console.log('frequency: ' + freq);

    let phas = map2Phase(normlat); // Float
    console.log('phase: ' + phas);

    dict[socket.id] = [data.latitude, data.longitude, normlat, normlon, data.rvalue, data.gvalue, data.bvalue, freq, phas];
    io.emit('position message', { user: socket.id, dict: dict } );
  });
  // Handle new connections and number of connections
  socket.on('connections counter', () => {
    console.log('numconnections (server): ' + numconnections);
    io.emit('connections counter', { numconnections: numconnections, dictconnections: dict } );
  });

  // Handle disconnections
  socket.on('disconnect', () => {
    var idconnection = socket.id;
    console.log('user disconnected',socket.id);
    console.log(dict);
    dict.delete(idconnection);
    numconnections--;
    console.log('numconnections: ' + numconnections);
    console.log(dict);
    io.emit('disconnect message', { user: socket.id, dict: dict });
    io.emit('connections counter', { numconnections: numconnections } );
  });

});

// Function used by socket message 'disconnect' to delete connections from the dictionary
dict.delete = (key) => {
    console.log(key);
     if(key in dict) {
       console.log("This key exists");
        delete dict[key];
        return true;
     }
     console.log("This key does not exist");
     return false;
}

// Function used by socket message 'position message' to normalize latitute value
// before adding it to the dictionary
// Original values: [-90, 90]
// Normalized values: [0, 1]
function normLatitude (latitude) {
  let normalized;
  normalized = (latitude + 90.0) / 180.0;
  return normalized;
}

// Function used by socket message 'position message' to normalize longitude value
// before adding it to the dictionary
// Original values: [-180, 180]
// Normalized values: [0, 1]
function normLongitude (longitude) {
  let normalized = (longitude + 180.0) / 360.0;
  return normalized;
}

// The frequency of the oscillator
function map2Frequency (value) {
  let freqscale = 250;
  let freq = Math.floor(value * freqscale) + 100; // At least 100 Hz
  return freq;
}

// The phase will be the starting position within the oscillator's cycle.
// For example a phase of 180 would start halfway through the oscillator's cycle.
function map2Phase (value) {
  let phasescale = 360.0;
  let phas = value * phasescale;
  return phas;
}
