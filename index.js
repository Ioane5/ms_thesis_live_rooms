'use strict';

var os = require('os');
var http = require('http');
var socketIO = require('socket.io');
var app = http.createServer().listen(process.env.PORT || 8080);

var io = socketIO.listen(app);
io.sockets.on('connection', function (socket) {
    // convenience function to log server messages on the client
    function log(msg) {
        console.log(msg);
    }

    /**
     * Client Requests to Join/Create it's own room
     */
    socket.on('enter_my_room', function (publicKey) {
        log(publicKey + ' requests to enter room');
        // TODO maybe this room object will be useful in the future.
        var room = io.sockets.adapter.rooms[publicKey];
        // TODO add authentication logic
        if (false) {
            socket.emit('error', 'authentication error', socket.id);
        }

        socket.join(publicKey);
        socket.emit('enter_my_room', true, socket.id);
    });

    /**
     * In this case server will pass out message from this socket to recipients room.
     */
    socket.on('signalling_message', function (recipientPublicKey, message) {
        log('signalling_message: ' + recipientPublicKey + ' message: ' + message);
        var room = io.sockets.adapter.rooms[recipientPublicKey];
        io.to(room).emit('signalling_message', message);
    });

    socket.on('ipaddr', function () {
        var ifaces = os.networkInterfaces();
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
