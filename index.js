'use strict';

var os = require('os');
var nodeStatic = require('node-static');
var http = require('http');
var socketIO = require('socket.io');

var fileServer = new(nodeStatic.Server)();
var app = http.createServer(function(req, res) {
  fileServer.serve(req, res);
}).listen(process.env.PORT || 8080);

var io = socketIO.listen(app);
io.sockets.on('connection', function(socket) {

  // convenience function to log server messages on the client
  function log(msg) {
    console.log(msg);
  }

  socket.on('message', function(message) {
    log('Client (' + socket.id + ') said: ' + message);
    // for a real app, would be room-only (not broadcast)
    socket.broadcast.emit('message', message);
  });

  socket.on('create or join', function(room_name) {
    log('Received request to create or join room ' + room_name);

    var room = io.sockets.adapter.rooms[room_name];

    var numClients = 0
    if(room) {  
      numClients = room.length;
    }
    log('numClients ' + numClients);

    if (numClients === 0) { // Creating Room
      room = socket.join(room_name);
      log('Client ID ' + socket.id + ' created room ' + room_name);
      socket.emit('created', room_name, socket.id);
    } else if (numClients === 1) { // joining Room
      log('Client ID ' + socket.id + ' joined room ' + room_name);

      room = socket.join(room_name);
      socket.emit('joined', room_name, socket.id);
      io.sockets.in(room_name).emit('ready', room_name);
    } else { // max two clients
      socket.emit('full', room_name);
    }

    log('Room ' + room_name + ' now has ' + room.length + ' client(s)');
  });

  socket.on('ipaddr', function() {
    var ifaces = os.networkInterfaces();
    for (var dev in ifaces) {
      ifaces[dev].forEach(function(details) {
        if (details.family === 'IPv4' && details.address !== '127.0.0.1') {
          socket.emit('ipaddr', details.address);
        }
      });
    }
  });

  socket.on('bye', function(){
    console.log('received bye');
  });

});
