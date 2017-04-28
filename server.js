"use strict";
exports.__esModule = true;
/// <reference path="./typings/globals/node/index.d.ts" />
/// <reference path="./typings/globals/socket.io/index.d.ts" />
/// <reference path="./typings/modules/express/index.d.ts" />
/// <reference path="./src/public/shared/Player.ts"/>
/// <reference path="./src/public/shared/Terrain.ts"/>
//import "./src/public/shared/Player";
var Player = (function () {
    function Player(playerId, username) {
        this.playerId = playerId;
        this.username = username;
        this.position = new THREE.Vector3(0, 0, 0);
        this.rotation = new THREE.Vector3(0, 0, 0);
    }
    Player.prototype.setRotation = function (x, y, z) {
        this
            .rotation
            .set(x, y, z);
    };
    Player.prototype.setPosition = function (x, y, z) {
        this
            .position
            .set(x, y, z);
    };
    return Player;
}());
var TerrainGrid = (function () {
    function TerrainGrid(rows, columns) {
        this.rows = rows;
        this.columns = columns;
        this.grid = [];
        for (var i = 0; i < rows; i++) {
            this.grid[i] = [];
            for (var j = 0; j < columns; j++) {
                this.grid[i][j] = [];
            }
        }
        this.heights = [];
        for (var i = 0; i < rows; i++) {
            this.heights[i] = [];
            for (var j = 0; j < columns; j++) {
                this.heights[i][j] = 0;
            }
        }
    }
    TerrainGrid.prototype.generateHeights = function () { };
    TerrainGrid.prototype.setGridFromData = function (data, heights) {
        this.rows = data.length;
        this.columns = data[0].length;
        this.grid = [];
        for (var i = 0; i < this.rows; i++) {
            this.grid[i] = [];
            for (var j = 0; j < this.columns; j++) {
                this.grid[i][j] = data[i][j];
            }
        }
        this.heights = [];
        for (var i = 0; i < this.rows; i++) {
            this.heights[i] = [];
            for (var j = 0; j < this.columns; j++) {
                this.heights[i][j] = heights[i][j];
            }
        }
    };
    return TerrainGrid;
}());
var GridSquare = (function () {
    function GridSquare(height, dx, dz, rotation, modelLabel, gx, gz) {
        this.height = height;
        this.dx = dx;
        this.dz = dz;
        this.rotation = rotation;
        this.modelLabel = modelLabel;
        this.gx = gx;
        this.gz = gz;
    }
    return GridSquare;
}());
console.log(Player);
require('ts-node/register');
//require('node');
console.log("Starting Server");
//import * as express from '@types/express';
var SocketIO = require("socket.io");
var express = require("express");
var path = require("path");
var PORT = process.env.PORT || 9000;
console.log(__dirname);
var INDEX = path.join(__dirname, 'src\\public\\index.html');
var playerColors = [0xf9ff60, 0xff6060, 0x82ff60, 0x607eff, 0x60eaff, 0xff60ee, 0xe360ff, 0xffaf60, 0xa3ff60, 0xff609c, 0x60ff82, 0xcc60ff, 0xc65959, 0xf2d957, 0xc55252, 0x498e56, 0xc45151, 0xc35454, 0xc85757, 0xc85959, 0x5b74b6, 0x5c81bd, 0x5bb146, 0xd8c963, 0x404b7f];
var server = express()
    .use("/", express.static(path.join(__dirname, 'src\\public\\'))).use('/node_scripts/', express.static(path.join(__dirname, 'node_modules\\')))
    .listen(PORT, function () { return console.log("Listening on " + PORT); });
var io = SocketIO(server);
var clients = [];
var players = [];
var terrainDetail = 6;
var worldTerrain = new TerrainGrid(Math.pow(2, terrainDetail), Math.pow(2, terrainDetail));
var Client = (function () {
    function Client(clientId, customId) {
        this.clientId = clientId;
        this.customId = customId;
    }
    return Client;
}());
io.sockets.on('connection', function (socket) {
    console.log("Connection " + socket.id);
    var clientInfo = new Client(socket.id, socket.id);
    //clientInfo.customId = socket.id; // data.customId;
    //clientInfo.clientId = socket.id;
    clients.push(clientInfo);
    console.log("Connection Stored " + socket.id);
    /*socket.on('storeClientInfo', function(data) {
        console.log(`Connection Stored ${ socket.id }`);
        var clientInfo = new Object();
        clientInfo.customId = data.customId;
        clientInfo.clientId = socket.id;
        clients.push(clientInfo);
    });*/
    socket.on('join', function (data) {
        if (playerForId(socket.id)) {
            for (var i = 0, len = players.length; i < len; i++) {
                var c = players[i];
                if (c.playerId == socket.id) {
                    players.splice(i, 1);
                    break;
                }
            }
        }
        console.log("Join " + socket.id);
        data = data || {};
        console.log(data);
        if (data.username) {
            var playerInfo = new Player(socket.id, data.username);
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
        }
    });
    socket.on('leaveGame', function (data) {
        for (var i = 0, len = players.length; i < Math.min(len, players.length); i++) {
            var c = players[i];
            if (c) {
                if (c.playerId == socket.id) {
                    players.splice(i, 1);
                    i--;
                    //break;
                }
                else {
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
                }
                else {
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
setInterval(function () { return io.emit('terrain', worldTerrain); }, 100);
//setInterval(() => io.emit('hello', clients.length.toString()), 1000);
/*function updateGridChange(r, c) {
    io.emit('gridHex', {
        v: grid.get(r, c),
        r: r,
        c: c
    });
}*/
setInterval(function () { return io.emit('players', players); }, 10);
setInterval(function () { return io.emit('cube', {
    rotation: {
        x: 0,
        y: new Date().getTime() / 1000,
        z: 0
    },
    time: new Date().getTime()
}); }, 10);
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
