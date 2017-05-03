/// <reference path="./typings/globals/node/index.d.ts" />
/// <reference path="./typings/globals/socket.io/index.d.ts" />
/// <reference path="./typings/globals/three/index.d.ts" />
/// <reference path="./typings/modules/express/index.d.ts" />
/// <reference path="./src/public/shared/Player.ts"/>
/// <reference path="./src/public/shared/Terrain.ts"/>
/*
           (,_    ,_,    _,)
           /|\`-._( )_.-'/|\
          / | \`-'/ \'-`/ | \
         /__|.-'`-\_/-`'-.|__\
        `          "          `
        Sorry For The BAT Pun
*/
declare function require(name: string);
import THREE = require('three');
//import "./src/public/shared/Player";
class Player {
  playerId: string;
  clientId: string;
  username: string;
  color: number;
  lastActive: number;
  points: number;
  tot: number;
  position: THREE.Vector3;
  rotation: THREE.Vector3;
  quat: THREE.Quaternion;
  velocity: THREE.Vector3;
  constructor(playerId: string, username: string) {
    this.playerId = playerId;
    this.username = username;
    this.position = new THREE.Vector3(0, 0, 0);
    this.rotation = new THREE.Vector3(0, 0, 0);
    this.quat = new THREE.Quaternion(0, 0, 0, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
  }
  setRotation(x: number, y: number, z: number): void {
    this
      .rotation
      .set(x, y, z);
  }
  setPosition(x: number, y: number, z: number): void {
    this
      .position
      .set(x, y, z);
  }
}
class TerrainGrid {
  rows: number;
  columns: number;
  grid: Array<Array<Array<GridSquare>>>;
  heights: Array<Array<number>>;
  gridSize: number;
  tilt: number;
  constructor(rows: number, columns: number, tilt: number, gridSize: number) {
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
  getMapValue(x: number, y: number, map: Array<Array<number>>): number {
    var minX: number = Math.floor(x % map[0].length + map[0].length) % map[0].length;
    var maxX: number = (Math.floor(x % map[0].length + map[0].length) + 1) % map[0].length;
    var modX = x - Math.floor(x);
    var minY: number = Math.floor(y % map.length + map.length) % map.length;
    var maxY: number = (Math.floor(y % map.length + map.length) + 1) % map.length;
    var modY = y - Math.floor(y);
    //console.log(minX,maxX,this.columns,minY,maxY,this.rows);
    return map[minY][minX] * (1 - modX) * (1 - modY) + map[maxY][minX] * (modX) * (1 - modY) + map[maxY][maxX] * (modX) * (modY) + map[minY][maxX] * (1 - modX) * (modY);
  }
  getHeightMapValueCorrected(x: number, y: number): number {
    var map: Array<Array<number>> = this.heights;
    var minX: number = Math.floor(x % map[0].length + map[0].length) % map[0].length;
    var maxX: number = (Math.floor(x % map[0].length + map[0].length) + 1) % map[0].length;
    var modX = x - Math.floor(x);
    var minY: number = Math.floor(y % map.length + map.length) % map.length;
    var maxY: number = (Math.floor(y % map.length + map.length) + 1) % map.length;
    var modY = y - Math.floor(y);
    //console.log(minX,maxX,this.columns,minY,maxY,this.rows);
    return (map[minY][minX] + (minY - this.columns / 2) * this.tilt) * (1 - modX) * (1 - modY) + (map[maxY][minX] + (maxY - this.columns / 2) * this.tilt) * (modX) * (1 - modY) + (map[maxY][maxX] + (maxY - this.columns / 2) * this.tilt) * (modX) * (modY) + (map[minY][maxX] + (minY - this.columns / 2) * this.tilt) * (1 - modX) * (modY) - (y - this.columns / 2) * this.tilt;
  }
  getHeightAtWorldCoord(x: number, z: number): number {
    return this.getHeightMapValueCorrected((x / this.gridSize + 0.5) * this.columns, (z / this.gridSize + 0.5) * this.rows);
  }
  getNoTiltHeightAtWorldCoord(x: number, z: number): number {
    return this.getHeightMapValueCorrected((x / this.gridSize + 0.5) * this.columns, (z / this.gridSize + 0.5) * this.rows) - this.getTiltTermAtWorldCoord(x, z);
  }
  getTiltTermAtWorldCoord(x: number, z: number): number {
    return -this.tilt * ((z / this.gridSize + 0.5) * this.rows - this.rows / 2);
  }
  getTiltTermAtGridCoord(x: number, y: number): number {
    return -this.tilt * (y - this.rows / 2);
  }
  getSurfaceNormalAtWorldCoord(x: number, z: number): THREE.Vector3 {
    var dummy = new THREE.Vector3(0, 0, 0);
    var A: THREE.Vector3 = new THREE.Vector3(x, 0.0, z + 0.5);
    A.y = (this.getNoTiltHeightAtWorldCoord(A.x, A.z) + this.getTiltTermAtWorldCoord(A.x, A.z));
    var B: THREE.Vector3 = new THREE.Vector3(x + 0.5, 0.0, z - 0.5);
    B.y = (this.getNoTiltHeightAtWorldCoord(B.x, B.z) + this.getTiltTermAtWorldCoord(B.x, B.z));
    var C: THREE.Vector3 = new THREE.Vector3(x - 0.5, 0.0, z - 0.5);
    C.y = (this.getNoTiltHeightAtWorldCoord(C.x, C.z) + this.getTiltTermAtWorldCoord(C.x, C.z));
    var Dir: THREE.Vector3 = dummy.crossVectors(dummy
      .subVectors(B, A).clone(), dummy.subVectors(C, A).clone());
    //console.log("DIR",Dir);
    return Dir.normalize();
  }
  getSurfaceNormalAtWorldCoordLarge(x: number, z: number): THREE.Vector3 {
    var dummy = new THREE.Vector3(0, 0, 0);
    var A: THREE.Vector3 = new THREE.Vector3(x, 0.0, z + 1);
    A.y = (this.getNoTiltHeightAtWorldCoord(A.x, A.z) + this.getTiltTermAtWorldCoord(A.x, A.z));
    var B: THREE.Vector3 = new THREE.Vector3(x + 1, 0.0, z - 1);
    B.y = (this.getNoTiltHeightAtWorldCoord(B.x, B.z) + this.getTiltTermAtWorldCoord(B.x, B.z));
    var C: THREE.Vector3 = new THREE.Vector3(x - 1, 0.0, z - 1);
    C.y = (this.getNoTiltHeightAtWorldCoord(C.x, C.z) + this.getTiltTermAtWorldCoord(C.x, C.z));
    var Dir: THREE.Vector3 = dummy.crossVectors(dummy
      .subVectors(B, A).clone(), dummy.subVectors(C, A).clone());
    //console.log("DIR", Dir);
    return Dir.normalize();
  }
  iterateGrid(grid: Array<Array<number>>, randScale: number): Array<Array<number>> {
    var newGrid: Array<Array<number>> = [];
    for (var i = 0; i < grid.length * 2; i++) {
      newGrid[i] = [];
      for (var j = 0; j < grid[0].length * 2; j++) {
        newGrid[i][j] = this.getMapValue(j / 2, i / 2, grid) + Math.random() * randScale;
      }
    }
    return newGrid;
  }
  generateHeights(): void {
    var perlinMap: Array<Array<number>> = [];
    for (var i = 0; i < this.rows; i++) {
      perlinMap[i] = [];
      for (var j = 0; j < this.columns; j++) {
        perlinMap[i][j] = Math.random();
      }
    }
    this.heights = [];
    var maxFractal: number = Math.floor(Math.log(this.columns) / Math.log(2));
    for (var i = 0; i < this.rows; i++) {
      this.heights[i] = [];
      for (var j = 0; j < this.columns; j++) {
        this.heights[i][j] = 0.0;
      }
    }
    var newGrid: Array<Array<number>> = [[0]];
    while (newGrid.length < this.rows || newGrid[0].length < this.columns) {
      newGrid = this.iterateGrid(newGrid, 1 / Math.pow(newGrid.length, 1.5) / 2);
    }

    for (var i = 0; i < this.rows; i++) {
      for (var j = 0; j < this.columns; j++) {

        this.heights[i][j] = newGrid[i][j] / 2;

      }
    }
    var midVal: number = this.heights[Math.floor(this.rows / 2)][Math.floor(this.columns / 2)];
    for (var i = 0; i < this.rows; i++) {

      for (var j = 0; j < this.columns; j++) {

        this.heights[i][j] = (this.heights[i][j] - midVal) * 40 - this.tilt * (i - this.rows / 2);
      }
    }
  }
  getHeightTiltExpanded(x: number,
    y: number): number {
    return this.getHeightMapValueCorrected(x, y) + this.tilt * (((y % this.rows + this.rows)) % this.rows - this.rows / 2) - this.tilt * (y - this.rows / 2)
  }
  generateTrees(): void {
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
  }
  setGridFromData(data: Array<Array<Array<GridSquare>>>, heights: Array<Array<number>>, tilt: number): void {
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
  }

}
class GridSquare {
  height: number;
  dx: number;
  dz: number;
  rotation: number;
  modelLabel: string;
  gx: number;
  gz: number;

  constructor(height: number, dx: number, dz: number, rotation: number, modelLabel: string, gx: number, gz: number) {
    this.height = height;
    this.dx = dx;
    this.dz = dz;
    this.rotation = rotation;
    this.modelLabel = modelLabel;
    this.gx = gx;
    this.gz = gz;
  }
}


console.log(Player);
require('ts-node/register');
//require('node');
console.log("Starting Server");
//import * as express from '@types/express';
import SocketIO = require('socket.io');
import express = require('express');
import path = require('path');
const PORT = process.env.PORT || 9000;
console.log(__dirname);
const INDEX = path.join(__dirname, 'src/public/index.html');
var playerColors = [0xf9ff60, 0xff6060, 0x82ff60, 0x607eff, 0x60eaff, 0xff60ee, 0xe360ff, 0xffaf60, 0xa3ff60, 0xff609c, 0x60ff82, 0xcc60ff, 0xc65959, 0xf2d957, 0xc55252, 0x498e56, 0xc45151, 0xc35454, 0xc85757, 0xc85959, 0x5b74b6, 0x5c81bd, 0x5bb146, 0xd8c963, 0x404b7f];
const server = express()
  .use("/", express.static(path.join(__dirname, 'src/public/'))).use('/node_scripts/', express.static(path.join(__dirname, 'node_modules/')))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));
const io = SocketIO(server);
var clients: Array<Client> = [];
var players: Array<Player> = [];
var terrainDetail: number = 6;
var maxVel: number = 10;
var worldTerrain: TerrainGrid = new TerrainGrid(Math.pow(2, terrainDetail), Math.pow(2, terrainDetail), 0.3, 512 / 8);
worldTerrain.generateHeights();
worldTerrain.generateTrees();
class Client {
  clientId: string;
  customId: string;
  constructor(clientId: string, customId: string) {
    this.clientId = clientId;
    this.customId = customId;
  }
}
io.sockets.on('connection', function(socket) {
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
  socket.emit('terrain', worldTerrain);

  socket.on('join', function(data) {
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
      socket.on('active', function(data) {
        playerInfo.lastActive = new Date().getTime();
      });
      socket
        .on('rotation', function(data) {
          var deltaR = (data || 0) - playerInfo.rotation.y
          playerInfo.rotation.y = data || 0;
          playerInfo.quat = playerInfo.quat.multiplyQuaternions(playerInfo.quat.clone(), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, deltaR, 0, 'XYZ')));
        });
      socket.emit('terrain', worldTerrain);
    }
  });
  socket.on('leave', function(data) {
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
  socket.on('disconnect', function(data) {
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
  var delta: number = Math.min(100, new Date().getTime() - lastTick);
  lastTick = new Date().getTime();
  var dummy = new THREE.Vector3(0, 0, 0);
  for (var i = 0; i < players.length; i++) {
    var p: Player = players[i];
    var newRotation: THREE.Vector3 = p
      .rotation.clone();
    var newQuat: THREE.Quaternion = p
      .quat.clone();
    var eulerFromQuat = new THREE.Euler(p.rotation.x, p.rotation.y, p.rotation.z, "XYZ").setFromQuaternion(newQuat);
    newRotation = new THREE.Vector3(eulerFromQuat.x, eulerFromQuat.y, eulerFromQuat.z);
    var newPosition: THREE.Vector3 = p
      .position
      .add(p.velocity.clone().multiplyScalar(delta / 1000));
    var newVelocity: THREE.Vector3 = p.velocity.clone();
    newPosition.setY(newPosition.y - worldTerrain.getTiltTermAtWorldCoord(newPosition.x, newPosition.z));
    newPosition.setX(((newPosition.x + worldTerrain.gridSize / 2) % worldTerrain.gridSize + worldTerrain.gridSize) % worldTerrain.gridSize - worldTerrain.gridSize / 2);
    newPosition.setZ(((newPosition.z + worldTerrain.gridSize / 2) % worldTerrain.gridSize + worldTerrain.gridSize) % worldTerrain.gridSize - worldTerrain.gridSize / 2);
    newPosition.setY(newPosition.y + worldTerrain.getTiltTermAtWorldCoord(newPosition.x, newPosition.z));
    var vel = newVelocity.length();
    if (vel > maxVel) {
      newVelocity = newVelocity.normalize().multiplyScalar(maxVel);
    }
    var wHeight = worldTerrain.getHeightAtWorldCoord(newPosition.x, newPosition.z);
    var terrainNormal: THREE.Vector3 = worldTerrain.getSurfaceNormalAtWorldCoord(newPosition.x, newPosition.z);
    var largeNormal: THREE.Vector3 = worldTerrain.getSurfaceNormalAtWorldCoordLarge(newPosition.x, newPosition.z);
    var playerDirVec: THREE.Vector3 = new THREE
      .Vector3(0, 0, 1)
      .applyEuler(new THREE.Euler(newRotation.x, newRotation.y, newRotation.z, "XYZ"));
    var playerDirVecLeft: THREE.Vector3 = dummy.crossVectors(new THREE.Vector3(0, 1, 0), playerDirVec).clone();
    var playerDirVecFlat: THREE.Vector3 = new THREE
      .Vector3(playerDirVec.x, 0, playerDirVec.z).normalize();
    var playerDirVecProjected: THREE.Vector3 = playerDirVec.clone().projectOnPlane(largeNormal).normalize();
    var playerDirVecProjectedFlat: THREE.Vector3 = new THREE
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
      newRotation.y = p.rotation.y
      newRotation.x = (newRotation.x + Math.PI / 2) % Math.PI - Math.PI / 2;
      newRotation.z = (newRotation.z + Math.PI / 2) % Math.PI - Math.PI / 2;

      if (wHeight > newPosition.y) {
        //console.log(terrainNormal);
        var deltaPos: THREE.Vector3 = dummy.subVectors(newPosition, new THREE.Vector3(newPosition.x, wHeight, newPosition.z));
        var deltaReflectPos: THREE.Vector3 = dummy.subVectors(deltaPos, terrainNormal.clone().multiplyScalar(1.1 * dummy.subVectors(new THREE.Vector3(0, 0, 0), deltaPos).dot(terrainNormal)));
        /*newPosition = dummy
            .addVectors(dummy.subVectors(newPosition, deltaPos),deltaReflectPos.clone());*/
        newPosition.y = wHeight;
        //console.log("before reflect",newVelocity);
        playerDirVec.y = 0;
        playerDirVec = playerDirVec.normalize();
        var addVelComp: THREE.Vector3 = dummy.addVectors(dummy.addVectors(terrainNormal
          .clone()
          .multiplyScalar(-1.0 * newVelocity.dot(terrainNormal)),
          new THREE.Vector3(0, 0, -worldTerrain.getTiltTermAtWorldCoord(0, 2))),
          playerDirVec.clone().multiplyScalar(- worldTerrain
            .getTiltTermAtWorldCoord(0, 2)));
        var tempY = addVelComp.y + 0;
        addVelComp.y = 0;
        addVelComp = playerDirVec.clone().multiplyScalar(addVelComp.dot(playerDirVec));
        addVelComp.y = tempY * 0.1;
        var reflectedVel: THREE.Vector3 = dummy.subVectors(newVelocity, terrainNormal.clone().multiplyScalar(1.0 * newVelocity.dot(terrainNormal)));
        reflectedVel = dummy.addVectors(reflectedVel, addVelComp.clone().multiplyScalar(0.3));
        newVelocity = reflectedVel;//dummy.addVectors(reflectedVel,new THREE.Vector3(0,0,-worldTerrain.getTiltTermAtWorldCoord(0,2)));//.y += worldTerrain.deflectVelAtWorldCoord(newPosition.x, newPosition.z) - delta / 1000;
        var draggedVelComp: THREE.Vector3 = newVelocity.clone();
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
    //console.log(newQuat);
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
