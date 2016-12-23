'use strict';

var os = require('os');
var http = require('http');
var socketIO = require('socket.io');

var app = http.createServer().listen(8080);

var droneSocket = null;
var clientSocket = null;

var io = socketIO.listen(app);
io.sockets.on('connection', function(socket) {
  // Connections.
  socket.on('client-connect', function() {
    clientSocket = socket;
    console.log('client-connected');
    socket.broadcast.emit('client-connected');
    if(droneSocket != null) {
      // a drone is already connected, notify to new client!
      socket.emit('drone-connected');
    }
  });
  socket.on('drone-connect', function() {
    droneSocket = socket;
    console.log('drone-connected');
    socket.broadcast.emit('drone-connected');
  });

  // Messages.
  socket.on('message-to-client', function(message) {
    if(clientSocket != null) {
      clientSocket.emit('message-to-client', message);
    }
  });
  socket.on('message-to-drone', function(message) {
    if(droneSocket != null) {
      droneSocket.emit('message-to-drone', message);
    }
  });
});
console.log('started on port 8080');