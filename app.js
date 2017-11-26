'use strict';
const express = require('express')
const bodyParser = require('body-parser');
const app = express()
const server = require('http').createServer(app);
const io = require('socket.io').listen(server);
const helperFunctions = require('./helperFunctions.js');

const Connection = function (displayName,name) {
  this.displayName = displayName;
  this.name = name;
  this.status = false;
};


let connections = [
  new Connection('Kamer', 'the main lights'),
  new Connection('Bureaulamp', 'the desk')
];

const update = function (obj) {
  connections.forEach(connection => {
    if (connection.name === obj.displayName) this.status = obj.newValue;
  });
};

const getStatus = function () {
  let message = '';
  connections.forEach(connection => {
    message += `${connection.displayName} is ${(connection.value) ? 'aan' : 'uit'}.\n`;
  });
  return message;
};

app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(bodyParser.json());
app.use(express.static('public'));

server.listen(process.env.PORT || 5000, () => console.log('listening 5000'));

const sendText = function(sender, text) {
  const messageData = { text };
  helperFunctions.request('messages', sender, messageData);
};

const checkIfIncludes = function(text, arr) {
  let bool = false;
  arr.forEach(term => {
    if (text.includes(term)) bool = true
  });
  return bool;
};

const decideMessage = function(sender, input) {
  const text = input.toLowerCase();
  io.sockets.emit('chatbot', text);
  if (checkIfIncludes(text, ['hi', 'hallo', 'goededag', 'hey'])) {
    sendText(sender, 'Welcome at my chatbot');
  } else if (checkIfIncludes(text, ['status'])) {
    sendText(sender, getStatus());
  } else if (checkIfIncludes(text, ['doe mijn lichten aan'])) {
    update({displayName: 'the main lights', newValue: 'true'});
    sendText(sender, 'Zoals je wenst, je lichten zijn aan.');
  } else if (checkIfIncludes(text, ['doe mijn lichten uit'])) {
    update({displayName: 'the main lights', newValue: 'false'});
    sendText(sender, 'Voila, je lichten zijn uit.');
  } else if (checkIfIncludes(text, ['doe mijn bureaulamp aan'])) {
    update({displayName: 'the desk', newValue: 'true'});
    sendText(sender, 'Je bureaulamp is aan');
  } else if (checkIfIncludes(text, ['doe mijn bureaulamp uit'])) {
    update({displayName: 'the desk', newValue: 'false'});
    sendText(sender, 'Je bureaulamp is uit');
  } else {
    sendText(sender, 'Error');
  }
};

app.get('/webhook/', (req, res) => {
  if (req.query['hub.verify_token'] === "joske") res.send(req.query['hub.challenge']);
  res.send('Wrong token');
});

app.post('/webhook/', function(req, res) {
  const messaging_events = req.body.entry[0].messaging;
  messaging_events.forEach(event => {
    const sender = event.sender.id;
    if (event.message && event.message.text) decideMessage(sender, event.message.text);
    //if (event.postback) decidePayBackMessage(sender, JSON.stringify(event.postback));
  });
  res.sendStatus(200);
});

const echo = function (data, socket) {
  socket.emit('echo', data);
};

io.sockets.on('connection', socket => {
  socket.on('echo', data => echo(data, socket));
  socket.on('update', data => update(data));
  socket.on('update', data => socket.broadcast.emit('update', data));
});
