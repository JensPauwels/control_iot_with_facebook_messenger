'use strict';
const express = require('express')
const bodyParser = require('body-parser');
const app = express()
const server = require('http').createServer(app);
const io = require('socket.io').listen(server);
const helperFunctions = require('./helperFunctions.js');

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
  if (checkIfIncludes(text, ['hi', 'hallo', 'goededag', 'hey'])) {
    sendText(sender, 'Welcome at my chatbot');
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
});
