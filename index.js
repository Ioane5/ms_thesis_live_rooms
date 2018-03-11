'use strict';

var os = require('os');
var http = require('http');
var socketIO = require('socket.io');
var app = http.createServer().listen(process.env.PORT || 8080);
console.log('listening to ' + (process.env.PORT || 8080));
var io = socketIO.listen(app);
io.sockets.on('connection', function (socket) {
    // convenience function to log server messages on the client
    function log(msg) {
        console.log(msg);
    }

    /**
     * Client Requests to Join/Create it's own room
     */
    socket.on('enter_my_room', function (message) {
        log(message);
        log(message.fromPublicKey + ' requests to enter room');
        // TODO maybe this room object will be useful in the future.
        let room = io.sockets.adapter.rooms[message.fromPublicKey];
        // TODO add authentication logic
        if (false) {
            socket.emit('error', message);
        } else {
            socket.join(message.fromPublicKey);
            socket.emit('enter_my_room', true);
        }
    });

    socket.on('connection_request', function (message) {
        log('connection_request: from : ' + message.fromPublicKey + ' to: ' + message.toPublicKey);
        let room = io.sockets.adapter.rooms[message.toPublicKey];
        if (room && room.length > 0) {
            log('sending message to room: ' + room + ' length: ' + room.length);
            io.to(message.toPublicKey).emit('connection_request', message);
        } else {
            log('connection_request was not sent to: ' + message.fromPublicKey);
            io.to(message.fromPublicKey).emit('error', message);
        }
    });

    /**
     * In this case server will pass out message from this socket to recipients room.
     */
    socket.on('signalling_message', function (message) {
        log('signalling_message: to: ' + message.toPublicKey);
        let room = io.sockets.adapter.rooms[message.toPublicKey];
        if (room && room.length > 0) {
            log('sending message to room: ' + room + ' length: ' + room.length);
            io.to(message.toPublicKey).emit('signalling_message', message);
        } else {
            log('signalling_message was not sent to: ' + message.fromPublicKey);
            io.to(message.fromPublicKey).emit('error', message);
        }
    });

    socket.on('ipaddr', function () {
        let ifaces = os.networkInterfaces();
        for (var dev in ifaces) {
            ifaces[dev].forEach(function (details) {
                if (details.family === 'IPv4' && details.address !== '127.0.0.1') {
                    socket.emit('ipaddr', details.address);
                }
            });
        }
    });

    socket.on('bye', function () {
        console.log('received bye');
    });
});