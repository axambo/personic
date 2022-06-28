/*
* Copyright 2020-21 Anna Xambó Sedó

* Released under the MIT License: https://opensource.org/licenses/MIT

* Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the "Software"),
to deal in the Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Software, and to permit persons to whom the Software
is furnished to do so, subject to the following conditions:

* The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR
ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/*
******** VARIABLES **********
 */

// DOM View
// Query Document Object Model HTML objects
const uppermenu = document.getElementById('uppermenu');
const lowermenu = document.getElementById('lowermenu');
const lowermenuget = document.getElementById('lowermenu-getdata');
const lowermenusend = document.getElementById('lowermenu-senddata');
const lowermenusimget = document.getElementById('lowermenu-simulation-getdata');
const displaymenu = document.getElementById('displaymenu');

// DOM Control
const btnsimulmode = document.getElementById('simulation-mode');
const btnrealmode = document.getElementById('reality-mode');
const btngetpos = document.getElementById('getpos');
const btnsendsim = document.getElementById('sendsim');
const btnsendpos = document.getElementById('sendpos');
const playButton = document.getElementById('soundswitch');
const playMessage = document.getElementById('playMessage');
const soloButton = document.getElementById('soloswitch');
const soloMessage = document.getElementById('soloMessage');
const slidersim = document.getElementById("simslider");
let slidersimoutput = document.getElementById("resultsimslider");
slidersimoutput.innerHTML = slidersim.value;
const slidervol = document.getElementById("volslider");
let slidervoloutput = document.getElementById("resultvolslider");
slidervoloutput.innerHTML = slidervol.value;
const osctypeButton = document.getElementById('oscselector');
const osctypeMessage = document.getElementById('osctypeMessage');

// DOM Data
const currentposition = document.getElementById("currentposition");
const latitude = document.getElementById("latitude");
const longitude = document.getElementById("longitude");
const feedback = document.getElementById('feedback');
const display = document.getElementById('display');
const messages = document.getElementById('messages');

// CLIENT-SERVER
var socket = io(); // Notice that no URL is specified since it defaults to trying to connect to the host that serves the page.
let connectedUsers = {};
let connectedUsersSim = {};
let myuserid ="";
//let totalconnections; // Used in simulation mode

// AUDIO
// for legacy browsers
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext();
var dictosc = {};
let playing = 0;
let solomode = 1;
let maxvol = 1; // this initial value is based on the assumption that solomode = 0
let currentsolovolume = 0.5;
let currentallvolume = 0.5;
let osctype = 'sine';

// VISUALS
const canvas = document.querySelector('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const canvasContext = canvas.getContext('2d');
let alpha = 0; // range: [0, 1]
let increasing = 1;

// GUI SETUP
// btnsimulmode.style.display = "none"; // Comment this line to activate the simulation mode or uncomment to deactivate it
slidervol.value = maxvol/2;
slidervoloutput.innerHTML = maxvol/2;
osctypeMessage.innerHTML = osctype;

// LOGIC
// If simulation mode = 1, make sure to change global variable and uncomment the function setsimulation(n) at the bottom of the page
// If simulation mode = 0, make sure to change global variable and comment the function setsimulation(n) at the bottom of the page
let simulation = 0;
let started = 0;

/*
******** FUNCTIONS **********
 */

 // All functions are used in real mode (simulation == 0) unless explicitly mentioned.

// DOM

window.onunload = function () {
  console.log("started: " + started);
	started = 0;
}

// CONTROLLER + CLIENT-SERVER COMMUNICATION

// User selected simulation mode
btnsimulmode.addEventListener('click', () => {
  simulation = 1;
  console.log("Simulation mode activated");
  uppermenu.style.display = "none";
  lowermenu.style.display = "block";
  lowermenuget.style.display = "none";
  lowermenusend.style.display = "none";
});

// User selected reality mode
btnrealmode.addEventListener('click', () => {
  simulation = 0;
  console.log("Reality mode activated");
  uppermenu.style.display = "none";
  lowermenu.style.display = "block";
  lowermenusend.style.display = "none";
  lowermenusimget.style.display = "none";
});

// IN SIMULATION MODE:

// Update the current slider value in simulation mode
slidersim.oninput = function() {
  slidersimoutput.innerHTML = this.value;
}

// User selected simulation mode (simulation = 1)
btnsendsim.addEventListener('click', () => {

  if (started == 1) {
    muteall(dictosc);
    connectedUsersSim = {};
    dictosc = {};
    started = 0;
  }
  var numconnections = slidersim.value;
  console.log("Slider value is " + slidersim.value);
  if (playing == 1) {
      playing = 0;
      muteall(dictosc);
      playMessage.innerHTML = 'Sound is paused';
  }
  setsimulation(numconnections);
  displaymenu.style.display = "block";
  console.log('numconnections (client side): ' + numconnections);
  // console.log('dict (client side): ' + Object.keys(data.dictconnections).length);
  display.innerHTML = '<p>There are ' + numconnections + ' random connections.</p>';
  started = 1;
  //totalconnections = numconnections;
});

// IN REALITY MODE:

// First, get the geolocation values
btngetpos.addEventListener('click', () => {

    if (started == 0) {
      // If geolocation is available, try to get the visitor's position
      if(navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(successCallback, errorCallback);
          currentposition.innerHTML = "Getting the position information... Please wait.";
          feedback.innerHTML = "";
      } else {
          alert("Sorry, your browser does not support HTML5 geolocation.");
          feedback.innerHTML = "Sorry, your browser does not support HTML5 geolocation.";
          feedback.style.backgroundColor = "#E78587"; // red
      }
    } else {
      feedback.innerHTML = "You already got your geolocation.";
    }
});

// Define callback function for successful attempt
function successCallback(position) {
    feedback.innerHTML = "Getting the position information was successful.";
    currentposition.innerHTML = "Your current position is (" + "Latitude: " + position.coords.latitude + ", " + "Longitude: " + position.coords.longitude + ")";
    latitude.innerHTML = position.coords.latitude;
    longitude.innerHTML = position.coords.longitude;
    feedback.style.backgroundColor = "#98fb98"; // green
    lowermenusend.style.display = "block";
};

// Define callback function for failed attempt
function errorCallback(error) {
    if(error.code == 1) {
        currentposition.innerHTML = "You've decided not to share your position. Make sure to share your location from the settings of your device.";
        feedback.innerHTML = "Getting the position information was unsuccessful.";
    } else if(error.code == 2) {
        currentposition.innerHTML = "The network is down or the positioning service can't be reached.";
        feedback.innerHTML = "Getting the position information was unsuccessful.";
    } else if(error.code == 3) {
        currentposition.innerHTML = "The attempt timed out before it could get the location data.";
        feedback.innerHTML = "Getting the position information was unsuccessful.";
    } else {
        currentposition.innerHTML = "Geolocation failed due to unknown error.";
        feedback.innerHTML = "Getting the position information was unsuccessful.";
    }
    feedback.style.backgroundColor = "#E78587"; // red
};

// Second, listen and send the geolocation values to the server
// Activate audioContext to allow iOS to play sounds
// Emit events
btnsendpos.addEventListener('click', () => {


  if (started == 0)
  {
    // This is only for testing purposes.
    // audioContext.onstatechange = function() {
    //   console.log("before" + audioContext.state);
    // }
    // currentposition.innerHTML = "AudioContext "+ audioContext.state;
    // console.log(audioContext.state);

    // Activate audioContext to allow iOS to play sounds
    // First, check if context is in suspended state (autoplay policy)
    if (audioContext.state === 'suspended') {
        // This is only for testing purposes.
        // currentposition.innerHTML = "AudioContext is really suspended ";
        // console.log("Testing AudioContext suspended");
        // audioContext.resume().then(function() {
        //   currentposition.innerHTML += " and now!!! "+ audioContext.state;
        // });
        audioContext.resume();
    }

    // This is only for testing purposes.
    // Report the state of the audio context to the
    // console, when it changes
    // audioContext.onstatechange = function() {
    //   console.log("after" + audioContext.state);
    // }

    feedback.innerHTML = "";

    // console.log("Sending geolocation data (client side)");
    console.log("Latitude: " + latitude.innerHTML + " Longitude: " + longitude.innerHTML);

    // Emit events client-side

    socket.emit('position message', {
      latitude: (parseFloat(latitude.innerHTML) + getRandomArbitrary (-10, 10)), // To be explored
      longitude: (parseFloat(longitude.innerHTML) + getRandomArbitrary (-10, 10)), // To be explored
      // Activate when we want the real values:
      // latitude: latitude.innerHTML,
      // longitude: longitude.innerHTML,
      // Created ONLY for co-located situations
      // latitude: Math.random(),
      // longitude: Math.random(),
      rvalue: Math.random() * 255,
      gvalue: Math.random() * 255,
      bvalue: Math.random() * 255
    });

    socket.emit('connections counter');

    displaymenu.style.display = "block";

    started = 1;
    console.log("started: " + started);

  } else { // Already shared your geolocation
    feedback.innerHTML = "You already shared your geolocation.";
  }


}); // End of btnsendpos

// Third, collect all the existing connected users and their geolocation values
// Listen for events

socket.on('connections counter', (data) => {

  // console.log("Object.keys(connectedUsers).length: " + Object.keys(connectedUsers).length);
  // console.log("data.numconnections: " + data.numconnections);
  // console.log('numconnections (server side): ' + data.numconnections);
  // console.log('numconnections (client side): ' + Object.keys(connectedUsers).length);

  if (started == 1) {
    if ( Object.keys(connectedUsers).length == data.numconnections ) { // Prioritise server information
      display.innerHTML = '<p>There are ' + data.numconnections + ' connections.</p>';
      // For more detailed information:
      // display.innerHTML = '<p>There are ' + data.numconnections + ' connections. Their locations are:</p>';
    } else if ( Object.keys(connectedUsers).length < data.numconnections ) { // Prioritise local information
      display.innerHTML = '<p>There are ' + Object.keys(connectedUsers).length + ' connections.</p>';
    }
  }

});

socket.on("connect", () => {
  console.log("My user id is: " + socket.id); // e.g. x8WIv7-mJelg7on_ALbx
  myuserid = socket.id;
});

// Message activated everytime there's a new connection
socket.on('position message', (data) => {
  // Someone new has connected
  // update the local dictionary
  if (started == 1) additems(data.user, data.dict);

});

// Message activated everytime there's a new disconnection
socket.on('disconnect message', (data) => {
  console.log(data.dict);
  // deleteitem(data.user, data.dict);
  deleteitem(data.user);
}, false);

// LOCAL MANAGEMENT DATA

function userDict (array) {
  return {
    latvalue: array[0],
    lonvalue: array[1],
    nlatvalue: array[2],
    nlonvalue: array[3],
    rvalue: array[4],
    gvalue: array[5],
    bvalue: array[6],
    freqvalue: array[7],
    phasvalue: array[8]
  }
}

function userDictSim (array) {
  let nlat = Math.random();
  let nlon = Math.random();
  return {
    nlatvalue: nlat,
    nlonvalue: nlon,
    rvalue: Math.random() * 255,
    gvalue: Math.random() * 255,
    bvalue: Math.random() * 255,
    freqvalue: Math.floor(nlon * 250) + 100,
    phasvalue: nlat * 260.0
  }
}

let nx = Math.random(); // values from 0 to 1
let ny = Math.random(); // values from 0 to 1
let x = nx * canvas.width;
let y = ny * canvas.height;
let r = Math.random() * 255;
let g = Math.random() * 255;
let b = Math.random() * 255;

function additems(userkey, dict){

  // If this is the first connection, create a dictionary

  // console.log("Length connected users (local): " + Object.keys(connectedUsers).length);
  // console.log("New user: " + userkey);

  if (Object.keys(connectedUsers).length <= 0) { // First connection, we create the local dictionary
    // This function is activated everytime there's a new connection/disconnection
    // which means it starts over and over again about reading the content and creating visuals/audio
    for(var key in dict) {
      additem(key, dict);
    }
    drawbubbles();
    // console.log(connectedUsers);

  } else { // A new connection to be added in the local dictionary
    // Information needed: new key
    // Then add the data on the new key
    additem(userkey, dict);
  }

}

function additem (userkey, dict) {
  let user = userDict(dict[userkey]);
  connectedUsers[userkey] = user;
  // Add synth
  createaudiodict(user.nlonvalue, user.nlatvalue, user.freqvalue, user.phasvalue, userkey);
  // Automatically add sound if "All" sounds are playing
  if( (playing == 1) && (solomode == 0)){ // Volumes of existing synths need to be adjusted
    changeallvolumes(dictosc); // Function that changes the volume of all the items
    dictosc[userkey].osc.start();
    dictosc[userkey].env.triggerAttack();
  }
}

// Same function as additem but for simulation = 1
// Create items with random values and save them on a local dictionary
// Then create another dictionary for the oscillators
function additemsim (userkey) {
  myuserid = 0;
  let user = userDictSim();
  connectedUsersSim[userkey] = user;
  // Add synth
  createaudiodict(user.nlonvalue, user.nlatvalue, user.freqvalue, user.phasvalue, userkey);
  // Automatically add sound if "All" sounds are playing
  if( (playing == 1) && (solomode == 0)){ // Volumes of existing synths need to be adjusted
    changeallvolumes(dictosc); // Function that changes the volume of all the items
    dictosc[userkey].osc.start();
    dictosc[userkey].env.triggerAttack();
  }
}


// Delete the item from the relevant local dictionary and array:
// dictosc (stop/delete the synth) and connectedUsers
function deleteitem(userkey){
  // console.log(userkey, dict); // dict.data from server
  // console.log(userkey, dictosc); // dictosc from local

  if (userkey in dictosc) {
    dictosc[userkey].env.triggerRelease();
    setTimeout(()=>{
      if (userkey in dictosc){
          dictosc[userkey].osc.stop();
          delete dictosc[userkey];
      }
      changeallvolumes(dictosc);
    }, 1500);
  }

  if (userkey in connectedUsers){
    delete connectedUsers[userkey];
  }

}


// AUDIO

// Audio -- CONTROLLER

// Play or pause track depending on state
playButton.addEventListener('click', function() {

  if (playing == 0) {
      playing = 1;
      if (solomode == 1) {
        playsolo(dictosc);
        playMessage.innerHTML = "<span style='background-color: #98fb98;'>Sound is playing</span>"; // green
        soloMessage.innerHTML = 'Your solo sound';
      } else {
        playall(dictosc);
        playMessage.innerHTML = "<span style='background-color: #98fb98;'>Sound is playing</span>"; // green
        soloMessage.innerHTML = 'All sounds playing';
      }
  } else if (playing == 1) {
      playing = 0;
      muteall(dictosc);
      playMessage.innerHTML = "<span style='background-color: #E78587'>Sound is paused</span>"; // red
  }
  osctypeMessage.innerHTML = osctype; // This just to reset ChangeOSCtype if it was pressed when sound was not playing

}, false);

// Commutes between all or solo depending on state
soloButton.addEventListener('click', function() {
  allsolo();
}, false);

// Volume slider
slidervol.oninput = function() {
  slidervoloutput.innerHTML = this.value;
  console.log("Volume: " + this.value);
  changeVolume(this, dictosc);
}

// Commutes between all or solo depending on state
osctypeButton.addEventListener('click', function() {
  if (playing == 1) {
    changeOscType(dictosc);
    osctypeMessage.innerHTML = osctype;
  } else {
    osctypeMessage.innerHTML = "<span style='background-color: #E78587'>Sound is paused. Press 'Play/Pause' first.</span>"; // red
  }
}, false);

// Audio -- MODEL

// Add an element to the dictionary with the oscilloscopes
function createaudiodict(nlonvalue, nlatvalue, freqvalue, phasvalue, key) {
    let freq = freqvalue; // frequency is created in the server to keep it the same across the session
    let phas = phasvalue; // phase is created in the server to keep it the same across the session

    console.log("frequency: " + freq);
    console.log("phase: " + phas);

    const oscgain = new Tone.Gain({
      gain: maxvol/2, // This matches the default value of the slider when solomode == 1
    }).toDestination();

    const envelope = new Tone.AmplitudeEnvelope({
			attack: nlatvalue, // Before 0.11
			decay: nlonvalue, // Before 0.21
			sustain: 0.5,
			release: nlonvalue + nlatvalue // Before 1.2
		}).connect(oscgain);

		// create an oscillator and connect it to the envelope
		const oscillator = new Tone.Oscillator({
			frequency: freq,
      phase: phas,
      type: osctype // options: sine, sine2, square, sawtooth, triangle
	}).connect(envelope);
  // This is only for testing purposes.
  //currentposition.innerHTML += "Creeating dict, context is  "+audioContext.state;
    dictosc[key] = {env: envelope, osc: oscillator, gain: oscgain};
}

function allsolo () {
  muteall(dictosc);
  if (playing == 1) {
    if (solomode == 0) {
        solomode = 1;
        playsolo(dictosc);
        soloMessage.innerHTML = 'Your solo sound';
    } else if (solomode == 1) {
        solomode = 0;
        playall(dictosc);
        soloMessage.innerHTML = 'All sounds playing';
    }
  } else if (playing == 0) {
    soloMessage.innerHTML = "<span style='background-color: #E78587'>Sound is paused. Press 'Play/Pause' first.</span>"; // red
  }
  feedback.innerHTML = "";
}

function playsolo (dict) {
  maxvol = 1;
  // console.log("maxvol INSIDE PLAYSOLO: " + maxvol);

  if(dict[myuserid].osc.state!='started'){
        dict[myuserid].osc.start();
  }
  dict[myuserid].env.triggerRelease();
  changesolovolume(dict);

  // console.log("MAX VOLUME SOLO MODE: " + maxvol);

  dict[myuserid].osc.type = osctype;
  dict[myuserid].env.triggerAttack();

};

// Function that gets activated when pressing "All/Solo", only to play ALL sounds
function playall (dict) {

  for(var key in dict) {
    if(dict[key].osc.state!='started'){
          dict[key].osc.start();
    }
    dict[key].env.triggerRelease();
    changeallvolumes(dict);
    dict[key].osc.type = osctype;
    dict[key].env.triggerAttack();
  }

};

function muteall (dict) {
for(var key in dict) {
  // dict[key].toDestination().stop();
  dict[key].env.triggerRelease();
}
};

// In "All" mode is when we need to control the gain according to the number of nodes
// maxvol is defined in the trigger function playall / playsolo
function changeVolume (element, dict) {

  let volume = element.value;
  // let fraction = parseFloat(element.value) / parseFloat(element.max);

  // console.log("fraction: " + fraction);
  // console.log("fraction: " + fraction * fraction);
  // Let's use an x*x curve (x-squared) since simple linear (x) does not
  // sound as good. Original idea from: Boris Smus
  // (https://webaudioapi.com/samples/volume/volume-sample.js)

  if (solomode == 1) { // Only one sound
    // dict[myuserid].gain.gain.value = maxvol * volume;
    // dict[myuserid].gain.gain.value = fraction * fraction * maxvol * volume;
    dict[myuserid].gain.gain.exponentialRampToValueAtTime(maxvol * volume, audioContext.currentTime + 0.2);
    console.log("SOLO MODE CURRENT VOLUME - SLIDER VALUE:" + volume);
    console.log("SOLO MODE CURRENT VOLUME FOR EACH SYNTH - AUDIO:" + (maxvol * volume));
  }
  else if (solomode == 0) { // All the sounds

    for (var key in dict) {
      // dict[key].gain.gain.value = maxvol * volume;
    //   dict[key].gain.gain.value = fraction * fraction * maxvol * volume;
      dict[key].gain.gain.exponentialRampToValueAtTime(maxvol * volume, audioContext.currentTime + 0.2);
    }
    // console.log("ALL MODE CURRENT VOLUME - SLIDER VALUE:" + volume);
    // console.log("ALL MODE CURRENT VOLUME - AUDIO:" + (maxvol * volume));
  }

}; // End Function changeVolume(element, dict)

function changeallvolumes (dict){
  for(var key in dict) {
    let totalsynths = Object.keys(dict).length;
    maxvol = 1/totalsynths;
    // console.log("!!!!! maxvol INSIDE ADDITEM: " + "key: " + key + "maxvol: " + maxvol);
    // dictosc[key].gain.gain.value = maxvol;
    dictosc[key].gain.gain.exponentialRampToValueAtTime(slidervol.value * maxvol, audioContext.currentTime + 2);
  }
}

function changesolovolume (dict) {
  // dict[myuserid].gain.gain.value = maxvol;
  dict[myuserid].gain.gain.exponentialRampToValueAtTime(slidervol.value * maxvol, audioContext.currentTime + 2);
}

function changeOscType (dict) {
  const osctypes = ["sine", "sine2", "square", "sawtooth", "triangle"];
  // let osctypenew = osctype;
  let osctypenew = getRandomItem(osctypes);
  // console.log("BEFORE CHANGING OSC TYPE, DICT LENGTH: " + Object.keys(dict).length);

  muteall(dict);

  if (solomode == 1) {
    dict[myuserid].osc.type = osctypenew;
    dict[myuserid].env.triggerAttack();
    // console.log("  dict[myuserid].osc.type: " +   dict[myuserid].osc.type);
    // console.log("  dict[myuserid].gain.gain.value: " +   dict[myuserid].gain.gain.value);
  } else {
    for(var key in dict) {
      dict[key].osc.type = osctypenew;
      dict[key].env.triggerAttack();
      // console.log("  dict[myuserid].osc.type: " +   dict[myuserid].osc.type);
      // console.log("  dict[myuserid].gain.gain.value: " +   dict[myuserid].gain.gain.value);
    }
  }
  // console.log("AFTER CHANGING OSC TYPE, CHECK SMAE DICT LENGTH: " + Object.keys(dict).length);
  osctype = osctypenew; // This is for the global variable
}

// VISUALS

// Visualization with Canvas

// Testing draw function
function draw () {
  for (var i = 0; i < 100; i++) {
    var x = Math.random() * window.innerWidth; // Math.random yields values from 0 to 1
    var y = Math.random() * window.innerHeight; // Math.random yields values from 0 to 1
    var r = Math.random() * 255;
    var g = Math.random() * 255;
    var b = Math.random() * 255;
    canvasContext.beginPath();
    canvasContext.arc(x, y, 100, 0, Math.PI * 2, false);
    // 3rd argument is radius,
    // 4th and 5th arguments are start and end angle in radians,
    // last argument drawcounterclockwise
    canvasContext.fillStyle = 'rgba(' + r + ',' + g +',' + b + ', 0.5)';
    canvasContext.fill();
    canvasContext.lineWidth = 1;
    canvasContext.strokeStyle = 'rgba(' + r + ',' + g +',' + b + ', 0.5)';
    canvasContext.stroke();
  };
}

// If simulation = 1, simulation function
// This function is called at the beginning of the program so the sound is generated here as well
function setsimulation (connections=100) {

  // Create items
  for(var i = 0; i < connections; i++) {
    additemsim(i);
  }
  // Draw the simulated bubbles: it's not possible to use drawbubbles because no parameters are allowed
  drawbubblessim();

}

function drawbubble (x, y, size, r, g, b) {
  console.log("INSIDE DRAW BUBBLE ");
  canvasContext.beginPath();
  canvasContext.arc(x, y, size, 0, Math.PI * 2, false);
  // 3rd argument is radius, 4th and 5th arguments are
  // start and end angle in radians, last argument drawcounterclockwise
  canvasContext.fillStyle = 'rgba(' + r + ',' + g +',' + b + ',' + alpha +')';
  canvasContext.fill();
  canvasContext.lineWidth = 1;
  canvasContext.strokeStyle = 'rgba(' + r + ',' + g +',' + b + ',' + alpha +')';
  canvasContext.stroke();
}

function drawalpha () {
  if (alpha >= 0.8) {
     increasing = -1;
   } else if (alpha <= 0.2) {
     increasing = 1;
   }
   alpha += increasing * 0.001;
   // size += increasing * 0.1;
}

// Drawing function when simulation = 1
function drawbubblessim () {

  if (window.innerHeight > window.innerWidth) { // Vertical viewport
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  } else { // Horizontal viewport
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  canvasContext.clearRect(0, 0, canvas.width, canvas.height);
  drawbackground();
  canvasContext.fillRect(0, 0, canvas.width, canvas.height);

  // var size = 200;
  let size = setSize(Object.keys(connectedUsersSim).length);

  for(var key in connectedUsersSim) {
    let x = connectedUsersSim[key].nlonvalue * canvas.width;
    let y = connectedUsersSim[key].nlatvalue * canvas.height;

    let r = connectedUsersSim[key].rvalue;
    let g = connectedUsersSim[key].gvalue;
    let b = connectedUsersSim[key].bvalue;

    drawbubble(x, y, size, r, g, b);
  } // end loop

  drawalpha ();
  requestAnimationFrame(drawbubblessim);
}

function drawbubbles (){

  if (window.innerHeight > window.innerWidth) { // Vertical viewport
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  } else { // Horizontal viewport
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  canvasContext.clearRect(0, 0, canvas.width, canvas.height);
  drawbackground();
  canvasContext.fillRect(0, 0, canvas.width, canvas.height);

  // var size = 200;
  let size = setSize(Object.keys(connectedUsers).length);
  //console.log("Total connections: " + Object.keys(connectedUsers).length);
  //console.log("Size: " + size);

  for(var key in connectedUsers) {
    let x = connectedUsers[key].nlonvalue * canvas.width;
    let y = connectedUsers[key].nlatvalue * canvas.height;

    let r = connectedUsers[key].rvalue;
    let g = connectedUsers[key].gvalue;
    let b = connectedUsers[key].bvalue;
    drawbubble(x, y, size, r, g, b);
  } // end loop

  drawalpha ();
  requestAnimationFrame(drawbubbles);
}

// UTILS

function drawbackground() {
  if (solomode == 0) canvasContext.fillStyle = "white";
  else canvasContext.fillStyle = "#9892B1";
}

function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}

// Source: https://www.programiz.com/javascript/examples/get-random-item
function getRandomItem(arr) {
    // get random index value
    const randomIndex = Math.floor(Math.random() * arr.length);
    // get random item
    const item = arr[randomIndex];
    return item;
}

function setSize (numConnections) {
  if (numConnections <= 10) {return canvas.width/3}
  else if (numConnections > 10 && numConnections <= 30) {return canvas.width/4}
  else if (numConnections > 30 && numConnections <= 50) {return canvas.width/5}
  else {return canvas.height/6}
}

// Quick test of draw function
// draw ();
