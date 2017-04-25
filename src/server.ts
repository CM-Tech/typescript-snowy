/// <reference path="../typings/globals/node/index.d.ts" />
/// <reference path="../typings/globals/socket.io/index.d.ts" />
/// <reference path="../typings/modules/express/index.d.ts" />
declare function require(name: string);
require('ts-node/register');
//require('node');
console.log("Starting Server");
//import * as express from '@types/express';
import SocketIO = require('socket.io');
import express = require('express');
import path = require('path');
const PORT = process.env.PORT || 9000;
console.log(__dirname);
const INDEX = path.join(__dirname, 'public\\index.html');
var playerColors = [0xf9ff60, 0xff6060, 0x82ff60, 0x607eff, 0x60eaff, 0xff60ee, 0xe360ff, 0xffaf60, 0xa3ff60, 0xff609c, 0x60ff82, 0xcc60ff, 0xc65959, 0xf2d957, 0xc55252, 0x498e56, 0xc45151, 0xc35454, 0xc85757, 0xc85959, 0x5b74b6, 0x5c81bd, 0x5bb146, 0xd8c963, 0x404b7f];
const server = express()
    .use(express.static(path.join(__dirname, 'public\\')))
    .listen(PORT, () => console.log(`Listening on ${PORT}`));

const io = SocketIO(server);
var clients: Array<Client> = [];
var players: Array<Player> = [];
class Player {
    playerId: string;
    clientId: string;
    username: string;
    color: number;
    lastActive:number;
    points: number;
    tot: number;
    constructor(playerId: string, username: string) {
        this.playerId = playerId;
        this.username = username;
    }
}
class Client {
    clientId: string;
    customId: string;
    constructor(clientId: string, customId: string) {
        this.clientId = clientId;
        this.customId = customId;
    }
}
io.sockets.on('connection', function (socket) {
    console.log(`Connection ${socket.id}`);

    var clientInfo: Client = new Client(socket.id, socket.id);
    //clientInfo.customId = socket.id; // data.customId;
    //clientInfo.clientId = socket.id;
    clients.push(clientInfo);
    console.log(`Connection Stored ${socket.id}`);
    /*socket.on('storeClientInfo', function(data) {
        console.log(`Connection Stored ${ socket.id }`);
        var clientInfo = new Object();
        clientInfo.customId = data.customId;
        clientInfo.clientId = socket.id;
        clients.push(clientInfo);
    });*/

    socket.on('joinGame', function (data) {
        if (playerForId(socket.id)) {
            for (var i = 0, len = players.length; i < len; i++) {
                var c = players[i];

                if (c.playerId == socket.id) {
                    players.splice(i, 1);
                    break;
                }
            }
        }
        console.log(`Join ${socket.id}`);
        console.log(data);
        var playerInfo = new Player(socket.id,data.username);
        //playerInfo.username = data.username;
        //playerInfo.playerId = socket.id;
        playerInfo.color = playerColors[0];
        playerInfo.points = 0;
        playerInfo.tot = 0;
        playerInfo.lastActive = new Date().getTime();
        players.push(playerInfo);

        socket.emit('spawn', {
            id: socket.id,
            color: playerInfo.color
        });
        //socket.emit('grid', grid);
        socket.on('active', function (data) {
            playerInfo.lastActive = new Date().getTime();
        });
    });
    socket.on('leaveGame', function (data) {
        for (var i = 0, len = players.length; i < Math.min(len, players.length); i++) {
            var c = players[i];
            if (c) {
                if (c.playerId == socket.id) {
                    players.splice(i, 1);
                    i--;
                    //break;
                } else {

                }
            }
        }
        if (socket.id) {
            removePlayer(socket.id);
        }
    });
    socket.on('disconnect', function (data) {
        for (var i = 0, len = players.length; i < Math.min(len, players.length); i++) {
            var p = players[i];
            if (p) {
                if (p.playerId == socket.id) {
                    players.splice(i, 1);
                    i--;
                    //break;
                } else {

                }
            }
        }
        for (var i = 0, len = clients.length; i < Math.min(len, clients.length); i++) {
            var c = clients[i];
            if (c) {
                if (c.clientId == socket.id) {
                    clients.splice(i, 1);
                    i--;
                    //break;
                }
            }
        }
        if (socket.id) {
            removePlayer(socket.id);
        }


    });
});

//setInterval(() => io.emit('time', new Date().toTimeString()), 100);
//setInterval(() => io.emit('hello', clients.length.toString()), 1000);
/*function updateGridChange(r, c) {
    io.emit('gridHex', {
        v: grid.get(r, c),
        r: r,
        c: c
    });
}*/
setInterval(() => io.emit('players', players), 10);
setInterval(tick, 10);
function tick() {
    //console.log("running TICK");
}
function playerForId(id) {
    for (var i = 0, len = players.length; i < Math.min(len, players.length); i++) {
        var c = players[i];

        if (c.playerId == id) {
            return c;
        }
    }
    return false;
}
function removePlayer(id) {
    if (id) {
        if (id.length > 0) {
            for (var i = 0, len = players.length; i < Math.min(len, players.length); i++) {
                var c = players[i];
                if (c) {
                    if (c.playerId == id) {
                        players.splice(i, 1);
                        i--;
                    }
                }
            }

        }
    }
}