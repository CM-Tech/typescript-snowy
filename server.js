"use strict";
exports.__esModule = true;
/// <reference path="./typings/globals/node/index.d.ts" />
/// <reference path="./typings/globals/socket.io/index.d.ts" />
/// <reference path="./typings/globals/three/index.d.ts" />
/// <reference path="./typings/modules/express/index.d.ts" />
/// <reference path="./src/public/shared/Player.ts"/>
/// <reference path="./src/public/shared/Terrain.ts"/>
var THREE = require("three");
//import "./src/public/shared/Player";
var Player = (function () {
    function Player(playerId, username) {
        this.playerId = playerId;
        this.username = username;
        this.position = new THREE.Vector3(0, 0, 0);
        this.rotation = new THREE.Vector3(0, 0, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
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
    function TerrainGrid(rows, columns, tilt, gridSize) {
        this.gridSize = gridSize;
        this.tilt = tilt;
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
    TerrainGrid.prototype.getMapValue = function (x, y, map) {
        var minX = Math.floor(x % map[0].length + map[0].length) % map[0].length;
        var maxX = (Math.floor(x % map[0].length + map[0].length) + 1) % map[0].length;
        var modX = x - Math.floor(x);
        var minY = Math.floor(y % map.length + map.length) % map.length;
        var maxY = (Math.floor(y % map.length + map.length) + 1) % map.length;
        var modY = y - Math.floor(y);
        //console.log(minX,maxX,this.columns,minY,maxY,this.rows);
        return map[minY][minX] * (1 - modX) * (1 - modY) + map[maxY][minX] * (modX) * (1 - modY) + map[maxY][maxX] * (modX) * (modY) + map[minY][maxX] * (1 - modX) * (modY);
    };
    TerrainGrid.prototype.getHeightAtWorldCoord = function (x, z) {
        return this.getMapValue((x / this.gridSize + 0.5) * this.columns, (z / this.gridSize + 0.5) * this.rows, this.heights);
    };
    TerrainGrid.prototype.getNoTiltHeightAtWorldCoord = function (x, z) {
        return this.getMapValue((x / this.gridSize + 0.5) * this.columns, (z / this.gridSize + 0.5) * this.rows, this.heights) - this.getTiltTermAtWorldCoord(x, z);
    };
    TerrainGrid.prototype.getTiltTermAtWorldCoord = function (x, z) {
        return -this.tilt * ((z / this.gridSize + 0.5) * this.rows - this.rows / 2);
    };
    TerrainGrid.prototype.getSurfaceNormalArWorldCoord = function (x, z) {
        var dummy = new THREE.Vector3(0, 0, 0);
        var A = new THREE.Vector3(x, 0.0, z + 0.05);
        A.setY(this.getNoTiltHeightAtWorldCoord(A.x, A.z) + this.getTiltTermAtWorldCoord(A.x, A.z));
        var B = new THREE.Vector3(x + 0.05, 0.0, z - 0.05);
        B.setY(this.getNoTiltHeightAtWorldCoord(B.x, B.z) + this.getTiltTermAtWorldCoord(B.x, B.z));
        var C = new THREE.Vector3(x - 0.05, 0.0, z - 0.05);
        C.setY(this.getNoTiltHeightAtWorldCoord(C.x, C.z) + this.getTiltTermAtWorldCoord(C.x, C.z));
        var Dir = dummy.crossVectors(dummy
            .subVectors(B, A), dummy.subVectors(C, A));
        return Dir.normalize();
    };
    TerrainGrid.prototype.iterateGrid = function (grid, randScale) {
        var newGrid = [];
        for (var i = 0; i < grid.length * 2; i++) {
            newGrid[i] = [];
            for (var j = 0; j < grid[0].length * 2; j++) {
                newGrid[i][j] = this.getMapValue(j / 2, i / 2, grid) + Math.random() * randScale;
            }
        }
        return newGrid;
    };
    TerrainGrid.prototype.generateHeights = function () {
        var perlinMap = [];
        for (var i = 0; i < this.rows; i++) {
            perlinMap[i] = [];
            for (var j = 0; j < this.columns; j++) {
                perlinMap[i][j] = Math.random();
            }
        }
        this.heights = [];
        var maxFractal = Math.floor(Math.log(this.columns) / Math.log(2));
        for (var i = 0; i < this.rows; i++) {
            this.heights[i] = [];
            for (var j = 0; j < this.columns; j++) {
                this.heights[i][j] = 0.0;
            }
        }
        var newGrid = [[0]];
        while (newGrid.length < this.rows || newGrid[0].length < this.columns) {
            newGrid = this.iterateGrid(newGrid, 1 / newGrid.length / 3);
        }
        for (var i = 0; i < this.rows; i++) {
            for (var j = 0; j < this.columns; j++) {
                this.heights[i][j] = newGrid[i][j];
            }
        }
        var midVal = this.heights[Math.floor(this.rows / 2)][Math.floor(this.columns / 2)];
        for (var i = 0; i < this.rows; i++) {
            for (var j = 0; j < this.columns; j++) {
                this.heights[i][j] = (this.heights[i][j] - midVal) * 70 - this.tilt * (i - this.rows / 2);
            }
        }
    };
    TerrainGrid.prototype.generateTrees = function () {
        this.grid = [];
        for (var i = 0; i < this.rows; i++) {
            this.grid[i] = [];
            for (var j = 0; j < this.columns; j++) {
                this.grid[i][j] = [];
                if (Math.max(Math.abs(this.getMapValue(j - 1, i, this.heights) - this.getMapValue(j + 1, i, this.heights)), Math.abs(this.getMapValue(j, i - 1, this.heights) - this.getMapValue(j, i + 1, this.heights))) < 10) {
                    if (Math.random() < 0.01) {
                        var dx = Math.random();
                        var dy = Math.random();
                        this.grid[i][j] = [new GridSquare(this.getMapValue(j + dx, i + dy, this.heights), 0, 0, Math.random() * Math.PI * 2, "tree_1", j + dx, i + dy)];
                    }
                }
            }
        }
    };
    TerrainGrid.prototype.setGridFromData = function (data, heights, tilt) {
        this.tilt = tilt;
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
var terrainDetail = 8;
var maxVel = 0.5;
var worldTerrain = new TerrainGrid(Math.pow(2, terrainDetail), Math.pow(2, terrainDetail), 0.075, 512 / 4);
worldTerrain.generateHeights();
worldTerrain.generateTrees();
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
    socket.emit('terrain', worldTerrain);
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
            socket.emit('terrain', worldTerrain);
        }
    });
    socket.on('leave', function (data) {
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
setInterval(function () { return io.emit('terrain', worldTerrain); }, 10000);
//setInterval(() => io.emit('hello', clients.length.toString()), 1000);
/*function updateGridChange(r, c) {
    io.emit('gridHex', {
        v: grid.get(r, c),
        r: r,
        c: c
    });
}*/
//setInterval(() => io.emit('players', players), 10);
/*setInterval(() => io.emit('cube', {
    rotation: {
        x: 0,
        y: new Date().getTime() / 1000,
        z:0
    },
    time: new Date().getTime()
}), 10);*/
var lastTick = new Date().getTime();
setInterval(tick, 200);
function tick() {
    var delta = Math.min(300, new Date().getTime() - lastTick);
    lastTick = new Date().getTime();
    var dummy = new THREE.Vector3(0, 0, 0);
    for (var i = 0; i < players.length; i++) {
        var p = players[i];
        var newPosition = p
            .position
            .add(p.velocity.clone().multiplyScalar(delta / 1000));
        var newVelocity = p.velocity.clone();
        newPosition.setY(newPosition.y - worldTerrain.getHeightAtWorldCoord(newPosition.x, newPosition.z));
        newPosition.setX(((newPosition.x + worldTerrain.gridSize / 2) % worldTerrain.gridSize + worldTerrain.gridSize) % worldTerrain.gridSize - worldTerrain.gridSize / 2);
        newPosition.setZ(((newPosition.z + worldTerrain.gridSize / 2) % worldTerrain.gridSize + worldTerrain.gridSize) % worldTerrain.gridSize - worldTerrain.gridSize / 2);
        newPosition.setY(newPosition.y + worldTerrain.getHeightAtWorldCoord(newPosition.x, newPosition.z));
        var vel = newVelocity.length();
        if (vel > maxVel) {
            newVelocity = newVelocity.normalize().multiplyScalar(maxVel);
        }
        var wHeight = worldTerrain.getHeightAtWorldCoord(newPosition.x, newPosition.z);
        if (wHeight <= newPosition.y) {
            console.log("falling");
            newVelocity.setY(newVelocity.y - delta / 1000);
        }
        if (wHeight > newPosition.y) {
            var terrainNormal = worldTerrain.getSurfaceNormalArWorldCoord(newPosition.x, newPosition.z);
            var deltaPos = dummy.subVectors(newPosition, new THREE.Vector3(newPosition.x, wHeight, newPosition.z));
            var deltaReflectPos = dummy.subVectors(deltaPos, terrainNormal.clone().multiplyScalar(2 * deltaPos.dot(terrainNormal)));
            newPosition = dummy
                .addVectors(dummy.subVectors(newPosition, deltaPos), deltaReflectPos);
            console.log("before reflect", newVelocity);
            var reflectedVel = dummy.subVectors(newVelocity, terrainNormal.clone().multiplyScalar(2 * newVelocity.dot(terrainNormal)));
            newVelocity = reflectedVel; //.y += worldTerrain.deflectVelAtWorldCoord(newPosition.x, newPosition.z) - delta / 1000;
        }
        vel = newVelocity.length();
        if (vel > maxVel) {
            newVelocity = newVelocity
                .normalize()
                .clone()
                .multiplyScalar(maxVel);
        }
        players[i] = p;
        console.log(newVelocity, newPosition);
        players[i].velocity = newVelocity;
        players[i].setPosition(newPosition.x, newPosition.y, newPosition.z);
    }
    io.emit('players', players);
    console.log("running TICK", players);
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