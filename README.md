# personic

Copyright 2020-21 Anna Xambó Sedó

## Introduction

This code implements a basic web app that has been designed to integrate the audience to participate in an online or hybrid performance using their mobile devices or desktop computers. Each audience member is assigned a bubble that has a drone sound, which is based on the location of the audience member.

You can find more information in the paper:

* Xambó, A., Goudarzi, V. (2022) [“The Mobile Audience as a Digital Musical Persona in Telematic Performance”](https://nime.pubpub.org/pub/yju481nh/release/1). In Proceedings of the New Interfaces for Musical Expression (NIME ’22). Waipapa Taumata Rau, Aotearoa / The University of Auckland, New Zealand.

A performance with an early prototype can be found at:

* Goudarzi, V., Xambó, A. (2022) [Ear to Waipapa Taumata Rau](https://nime.pubpub.org/pub/h3znmkok). In Proceedings of the New Interfaces for Musical Expression (NIME ’22). Waipapa Taumata Rau, Aotearoa / The University of Auckland, New Zealand.

## What to install

To run the code you will need the following:

### Node.js

First, make sure that you have `Node.js` installed: https://nodejs.org/en/download/

Ensure Node.js has been installed, `run node -v` in your Terminal to check.

### node_modules

Before launching the code, make sure to install the `node_modules` folder if it's not installed by typing `npm install` in the Terminal on the same directory where the `package.json` file exists. In particular, you will need:

* [Express](http://expressjs.com/): `npm install express`
* [Socket.IO](https://socket.io/): `npm install socket.io`
* [Tone.js](https://tonejs.github.io/): `npm install tone`

In localhost you can also install `nodemon` to enhance the development stage:

`npm install --save-dev nodemon`

### Bootstrap.css

The external file `bootstrap.min.css` is used to improve the responsive design of the web app so that it suits better different form factor devices. You can find it at: https://getbootstrap.com/

## To launch the web app

Open Terminal, go to the directory and execute:

`node app.js`

In the development phase (especially in localhost) use instead:

`npx nodemon app`

To close the web server:

`Control + C`

### Testing in localhost

This web app only works with HTTPS because it is using geolocation information.
You will need HTTPS support both in local and in production.
Make sure to generate the required certificates and point them from the `app.js` file.
You can use the Boolean variable `local` to define whether the environment is local or production.

From the browser, go to:

`https://localhost:3000`

If you would like to get access from an additional device, e.g. a smartphone, change localhost with the IP address of the desktop computer with the local server. You can find the IP address from System Preferences, e.g.:

`https://198.168.8.101:3000`

You will need to permit to send geolocation data. Make sure that the permissions are granted on your OS device and browser.

### Testing in production

In `app.js`: Make sure to change the value of the Boolean variable `local` to False.

Again, make sure to create the HTTPS credentials for your website and call them in the `app.js` file before uploading the files to a production site.

You can then get access to the website with the defined port e.g.:

`https://[yourwebsite].[domain]:3000`

## Audiovisual mappings

The main information that is sent from the user is the geolocation data, in particular, the latitude and longitude of the device used to connect to the web app. The range of values are:

* Latitude: [-90, 90], a range of values that is normalised to [0, 1].
* Longitude: [-180, 180], a range of values that is normalised to [0, 1].

Each user is assigned a bubble using Canvas and a sound oscillator using Tone.js. The frequency of the oscillator is mapped to the normalised longitude value. This results in the closer to the east of the planet Earth, the higher the pitch.
The phase of the oscillator is mapped to the latitude. This results in the closer to the north pole, the closer to a phase value of zero. The envelope of each oscillator is also defined according to the latitude and longitude values of each user: `attack` equals the normalised latitude value, `decay` equals the normalised longitude value, and `release` equals the sum of the normalised values of longitude and latitude.

The position of the bubble relates to the normalised longitude value, which determines the horizontal position on the screen, and the normalised latitude value, which determines the vertical position on the screen.
The RGB colours of each bubble are assigned randomly and keep the same values throughout the connection.

The values from the accelerometer sensor will be incorporated soon.

## Acknowledgements

Thank you to Gerard Roma for his constant technical support and guidance. Many thanks to Visda Gourdarzi and Abbey Young for working together on assessing the web app throughout three pilot studies in June 2022 based on a rapid prototyping approach. The series of pilot studies have been ethically approved by De Montfort University (DMU)’s Research Ethics Committee (CEM ID C451429) following DMU's Research Ethics Code of Practice and have been funded by DMU’s ‘Living in a Digital Society’ 2022 ‘Spotlight’ Funding Application. Last but not least, thank you very much to all the participants of the pilot studies for their valuable feedback which has been instrumental to keep an informed development of the web app.

## License

Copyright 2020-21 Anna Xambó Sedó

Released under the MIT License: [https://opensource.org/licenses/MIT](https://opensource.org/licenses/MIT)

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the "Software"),
to deal in the Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Software, and to permit persons to whom the Software
is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR
ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
