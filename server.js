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
        this.quat = new THREE.Quaternion(0, 0, 0, 0);
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
    TerrainGrid.prototype.getHeightMapValueCorrected = function (x, y) {
        var map = this.heights;
        var minX = Math.floor(x % map[0].length + map[0].length) % map[0].length;
        var maxX = (Math.floor(x % map[0].length + map[0].length) + 1) % map[0].length;
        var modX = x - Math.floor(x);
        var minY = Math.floor(y % map.length + map.length) % map.length;
        var maxY = (Math.floor(y % map.length + map.length) + 1) % map.length;
        var modY = y - Math.floor(y);
        //console.log(minX,maxX,this.columns,minY,maxY,this.rows);
        return (map[minY][minX] + (minY - this.columns / 2) * this.tilt) * (1 - modX) * (1 - modY) + (map[maxY][minX] + (maxY - this.columns / 2) * this.tilt) * (modX) * (1 - modY) + (map[maxY][maxX] + (maxY - this.columns / 2) * this.tilt) * (modX) * (modY) + (map[minY][maxX] + (minY - this.columns / 2) * this.tilt) * (1 - modX) * (modY) - (y - this.columns / 2) * this.tilt;
    };
    TerrainGrid.prototype.getHeightAtWorldCoord = function (x, z) {
        return this.getHeightMapValueCorrected((x / this.gridSize + 0.5) * this.columns, (z / this.gridSize + 0.5) * this.rows);
    };
    TerrainGrid.prototype.getNoTiltHeightAtWorldCoord = function (x, z) {
        return this.getHeightMapValueCorrected((x / this.gridSize + 0.5) * this.columns, (z / this.gridSize + 0.5) * this.rows) - this.getTiltTermAtWorldCoord(x, z);
    };
    TerrainGrid.prototype.getTiltTermAtWorldCoord = function (x, z) {
        return -this.tilt * ((z / this.gridSize + 0.5) * this.rows - this.rows / 2);
    };
    TerrainGrid.prototype.getTiltTermAtGridCoord = function (x, y) {
        return -this.tilt * (y - this.rows / 2);
    };
    TerrainGrid.prototype.getSurfaceNormalAtWorldCoord = function (x, z) {
        var dummy = new THREE.Vector3(0, 0, 0);
        var A = new THREE.Vector3(x, 0.0, z + 0.5);
        A.y = (this.getNoTiltHeightAtWorldCoord(A.x, A.z) + this.getTiltTermAtWorldCoord(A.x, A.z));
        var B = new THREE.Vector3(x + 0.5, 0.0, z - 0.5);
        B.y = (this.getNoTiltHeightAtWorldCoord(B.x, B.z) + this.getTiltTermAtWorldCoord(B.x, B.z));
        var C = new THREE.Vector3(x - 0.5, 0.0, z - 0.5);
        C.y = (this.getNoTiltHeightAtWorldCoord(C.x, C.z) + this.getTiltTermAtWorldCoord(C.x, C.z));
        var Dir = dummy.crossVectors(dummy
            .subVectors(B, A).clone(), dummy.subVectors(C, A).clone());
        //console.log("DIR",Dir);
        return Dir.normalize();
    };
    TerrainGrid.prototype.getSurfaceNormalAtWorldCoordLarge = function (x, z) {
        var dummy = new THREE.Vector3(0, 0, 0);
        var A = new THREE.Vector3(x, 0.0, z + 1);
        A.y = (this.getNoTiltHeightAtWorldCoord(A.x, A.z) + this.getTiltTermAtWorldCoord(A.x, A.z));
        var B = new THREE.Vector3(x + 1, 0.0, z - 1);
        B.y = (this.getNoTiltHeightAtWorldCoord(B.x, B.z) + this.getTiltTermAtWorldCoord(B.x, B.z));
        var C = new THREE.Vector3(x - 1, 0.0, z - 1);
        C.y = (this.getNoTiltHeightAtWorldCoord(C.x, C.z) + this.getTiltTermAtWorldCoord(C.x, C.z));
        var Dir = dummy.crossVectors(dummy
            .subVectors(B, A).clone(), dummy.subVectors(C, A).clone());
        //console.log("DIR", Dir);
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
            newGrid = this.iterateGrid(newGrid, 1 / Math.pow(newGrid.length, 1.5) / 2);
        }
        for (var i = 0; i < this.rows; i++) {
            for (var j = 0; j < this.columns; j++) {
                this.heights[i][j] = newGrid[i][j] / 2;
            }
        }
        var midVal = this.heights[Math.floor(this.rows / 2)][Math.floor(this.columns / 2)];
        for (var i = 0; i < this.rows; i++) {
            for (var j = 0; j < this.columns; j++) {
                this.heights[i][j] = (this.heights[i][j] - midVal) * 40 - this.tilt * (i - this.rows / 2);
            }
        }
    };
    TerrainGrid.prototype.getHeightTiltExpanded = function (x, y) {
        return this.getHeightMapValueCorrected(x, y) + this.tilt * (((y % this.rows + this.rows)) % this.rows - this.rows / 2) - this.tilt * (y - this.rows / 2);
    };
    TerrainGrid.prototype.generateTrees = function () {
        this.grid = [];
        for (var i = 0; i < this.rows; i++) {
            this.grid[i] = [];
            for (var j = 0; j < this.columns; j++) {
                this.grid[i][j] = [];
                if (Math.max(Math.abs(this.getHeightTiltExpanded(j - 1, i) - this.getHeightTiltExpanded(j + 1, i)), Math.abs(this.getHeightTiltExpanded(j, i - 1) - this.getHeightTiltExpanded(j, i + 1))) < 10) {
                    if (Math.random() < 0.01) {
                        var dx = Math.random();
                        var dy = Math.random();
                        this.grid[i][j] = [new GridSquare(this.getHeightTiltExpanded(j + dx, i + dy), 0, 0, Math.random() * Math.PI * 2, "tree_1", j + dx, i + dy)];
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
var INDEX = path.join(__dirname, 'src/public/index.html');
var playerColors = [0xf9ff60, 0xff6060, 0x82ff60, 0x607eff, 0x60eaff, 0xff60ee, 0xe360ff, 0xffaf60, 0xa3ff60, 0xff609c, 0x60ff82, 0xcc60ff, 0xc65959, 0xf2d957, 0xc55252, 0x498e56, 0xc45151, 0xc35454, 0xc85757, 0xc85959, 0x5b74b6, 0x5c81bd, 0x5bb146, 0xd8c963, 0x404b7f];
var server = express()
    .use("/", express.static(path.join(__dirname, 'src/public/'))).use('/node_scripts/', express.static(path.join(__dirname, 'node_modules/')))
    .listen(PORT, function () { return console.log("Listening on " + PORT); });
var io = SocketIO(server);
var clients = [];
var players = [];
var terrainDetail = 6;
var maxVel = 10;
var worldTerrain = new TerrainGrid(Math.pow(2, terrainDetail), Math.pow(2, terrainDetail), 0.3, 512 / 8);
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
        if (data.username !== undefined) {
            var playerInfo = new Player(socket.id, data.username);
            //playerInfo.username = data.username;
            //playerInfo.playerId = socket.id;
            playerInfo.color = playerColors[Math.floor(Math.random() * playerColors.length)];
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
            socket
                .on('rotation', function (data) {
                var deltaR = (data || 0) - playerInfo.rotation.y;
                playerInfo.rotation.y = data || 0;
                playerInfo.quat = playerInfo.quat.multiplyQuaternions(playerInfo.quat.clone(), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, deltaR, 0, 'XYZ')));
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
//setInterval(() => io.emit('terrain', worldTerrain), 10000);
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
setInterval(tick, 10);
function tick() {
    var delta = Math.min(100, new Date().getTime() - lastTick);
    lastTick = new Date().getTime();
    var dummy = new THREE.Vector3(0, 0, 0);
    for (var i = 0; i < players.length; i++) {
        var p = players[i];
        var newRotation = p
            .rotation.clone();
        var newQuat = p
            .quat.clone();
        var eulerFromQuat = new THREE.Euler(p.rotation.x, p.rotation.y, p.rotation.z, "XYZ").setFromQuaternion(newQuat);
        newRotation = new THREE.Vector3(eulerFromQuat.x, eulerFromQuat.y, eulerFromQuat.z);
        var newPosition = p
            .position
            .add(p.velocity.clone().multiplyScalar(delta / 1000));
        var newVelocity = p.velocity.clone();
        newPosition.setY(newPosition.y - worldTerrain.getTiltTermAtWorldCoord(newPosition.x, newPosition.z));
        newPosition.setX(((newPosition.x + worldTerrain.gridSize / 2) % worldTerrain.gridSize + worldTerrain.gridSize) % worldTerrain.gridSize - worldTerrain.gridSize / 2);
        newPosition.setZ(((newPosition.z + worldTerrain.gridSize / 2) % worldTerrain.gridSize + worldTerrain.gridSize) % worldTerrain.gridSize - worldTerrain.gridSize / 2);
        newPosition.setY(newPosition.y + worldTerrain.getTiltTermAtWorldCoord(newPosition.x, newPosition.z));
        var vel = newVelocity.length();
        if (vel > maxVel) {
            newVelocity = newVelocity.normalize().multiplyScalar(maxVel);
        }
        var wHeight = worldTerrain.getHeightAtWorldCoord(newPosition.x, newPosition.z);
        var terrainNormal = worldTerrain.getSurfaceNormalAtWorldCoord(newPosition.x, newPosition.z);
        var largeNormal = worldTerrain.getSurfaceNormalAtWorldCoordLarge(newPosition.x, newPosition.z);
        var playerDirVec = new THREE
            .Vector3(0, 0, 1)
            .applyEuler(new THREE.Euler(newRotation.x, newRotation.y, newRotation.z, "XYZ"));
        var playerDirVecLeft = dummy.crossVectors(new THREE.Vector3(0, 1, 0), playerDirVec).clone();
        var playerDirVecFlat = new THREE
            .Vector3(playerDirVec.x, 0, playerDirVec.z).normalize();
        var playerDirVecProjected = playerDirVec.clone().projectOnPlane(largeNormal).normalize();
        var playerDirVecProjectedFlat = new THREE
            .Vector3(playerDirVecProjected.x, 0, playerDirVecProjected.z).normalize();
        if (wHeight <= newPosition.y) {
            //console.log("falling");
            newVelocity.setY(newVelocity.y - 5 * (delta / 1000));
            var Umx = new THREE.Matrix4().lookAt(playerDirVecFlat, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0));
            var Uqt = new THREE.Quaternion().setFromRotationMatrix(Umx);
            var Mqt = newQuat.slerp(Uqt, Math.min(delta / 10 / 20, 1));
            var Ueu = new THREE.Euler(p.rotation.x, p.rotation.y, p.rotation.z, "XYZ").setFromQuaternion(Uqt);
            newQuat = Mqt.clone();
            eulerFromQuat = new THREE.Euler(p.rotation.x, p.rotation.y, p.rotation.z, "XYZ").setFromQuaternion(newQuat);
            newRotation = new THREE.Vector3(eulerFromQuat.x, eulerFromQuat.y, eulerFromQuat.z);
        }
        if (wHeight + 0.1 > newPosition.y) {
            var mx = new THREE.Matrix4().lookAt(playerDirVecProjected.clone(), new THREE.Vector3(0, 0, 0), largeNormal);
            var qt = new THREE.Quaternion().setFromRotationMatrix(mx);
            var MqtF = newQuat.slerp(qt, Math.min(1 - Math.min(((wHeight - newPosition.y) / 0.1) / 10 * delta / 1, 1), 1));
            newQuat = MqtF.clone();
            var eu = new THREE.Euler(p.rotation.x, p.rotation.y, p.rotation.z, "XYZ").setFromQuaternion(MqtF);
            newRotation = new THREE.Vector3(eu.x, eu.y, eu.z);
            newRotation.y = p.rotation.y;
            newRotation.x = (newRotation.x + Math.PI / 2) % Math.PI - Math.PI / 2;
            newRotation.z = (newRotation.z + Math.PI / 2) % Math.PI - Math.PI / 2;
            if (wHeight > newPosition.y) {
                //console.log(terrainNormal);
                var deltaPos = dummy.subVectors(newPosition, new THREE.Vector3(newPosition.x, wHeight, newPosition.z));
                var deltaReflectPos = dummy.subVectors(deltaPos, terrainNormal.clone().multiplyScalar(1.1 * dummy.subVectors(new THREE.Vector3(0, 0, 0), deltaPos).dot(terrainNormal)));
                /*newPosition = dummy
                    .addVectors(dummy.subVectors(newPosition, deltaPos),deltaReflectPos.clone());*/
                newPosition.y = wHeight;
                //console.log("before reflect",newVelocity);
                playerDirVec.y = 0;
                playerDirVec = playerDirVec.normalize();
                var addVelComp = dummy.addVectors(dummy.addVectors(terrainNormal
                    .clone()
                    .multiplyScalar(-1.0 * newVelocity.dot(terrainNormal)), new THREE.Vector3(0, 0, -worldTerrain.getTiltTermAtWorldCoord(0, 2))), playerDirVec.clone().multiplyScalar(-worldTerrain
                    .getTiltTermAtWorldCoord(0, 2)));
                var tempY = addVelComp.y + 0;
                addVelComp.y = 0;
                addVelComp = playerDirVec.clone().multiplyScalar(addVelComp.dot(playerDirVec));
                addVelComp.y = tempY * 0.1;
                var reflectedVel = dummy.subVectors(newVelocity, terrainNormal.clone().multiplyScalar(1.0 * newVelocity.dot(terrainNormal)));
                reflectedVel = dummy.addVectors(reflectedVel, addVelComp.clone().multiplyScalar(0.3));
                newVelocity = reflectedVel; //dummy.addVectors(reflectedVel,new THREE.Vector3(0,0,-worldTerrain.getTiltTermAtWorldCoord(0,2)));//.y += worldTerrain.deflectVelAtWorldCoord(newPosition.x, newPosition.z) - delta / 1000;
                var draggedVelComp = newVelocity.clone();
                var tempY2 = draggedVelComp.y + 0;
                draggedVelComp.y = 0;
                draggedVelComp = playerDirVec
                    .clone()
                    .multiplyScalar(draggedVelComp.dot(playerDirVec));
                draggedVelComp.y = tempY2;
                newVelocity = newVelocity.lerp(draggedVelComp, 0.3);
            }
        }
        vel = newVelocity.length();
        if (vel > maxVel) {
            newVelocity = newVelocity
                .normalize()
                .clone()
                .multiplyScalar(maxVel);
        }
        players[i] = p;
        //console.log(newVelocity,newPosition);
        players[i].velocity = newVelocity;
        console.log(newQuat);
        players[i].quat = newQuat.clone();
        eulerFromQuat = new THREE.Euler(p.rotation.x, p.rotation.y, p.rotation.z, "XYZ").setFromQuaternion(newQuat);
        newRotation = new THREE.Vector3(eulerFromQuat.x, eulerFromQuat.y, eulerFromQuat.z);
        players[i].setPosition(newPosition.x, newPosition.y, newPosition.z);
        players[i].setRotation(newRotation.x, newRotation.y, newRotation.z);
    }
    io.emit('players', players);
    //console.log("running TICK",players);
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
