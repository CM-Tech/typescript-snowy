/// <reference path="./typings/globals/node/index.d.ts" />
/// <reference path="./typings/globals/socket.io/index.d.ts" />
/// <reference path="./typings/modules/express/index.d.ts" />
/// <reference path="./src/public/shared/Player.ts"/>
/// <reference path="./src/public/shared/Terrain.ts"/>
declare function require(name: string);
//import "./src/public/shared/Player";
class Player {
    playerId : string;
    clientId : string;
    username : string;
    color : number;
    lastActive : number;
    points : number;
    tot : number;
    position : THREE.Vector3;
    rotation : THREE.Vector3;
    constructor(playerId : string, username : string) {
        this.playerId = playerId;
        this.username = username;
        this.position = new THREE.Vector3(0, 0, 0);
        this.rotation = new THREE.Vector3(0, 0, 0);
    }
    setRotation(x : number, y : number, z : number) : void {
        this
            .rotation
            .set(x, y, z);
    }
    setPosition(x : number, y : number, z : number) : void {
        this
            .position
            .set(x, y, z);
    }
}
class TerrainGrid {
    rows : number;
    columns : number;
    grid : Array < Array < Array < GridSquare >>>;
    heights : Array < Array < number >>;
    constructor(rows : number, columns : number) {
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
getMapValue(x : number, y : number, map : Array < Array < number >>) {
var minX : number = Math.floor(x % this.columns + this.columns) % this.columns;
var maxX : number = (Math.floor(x % this.columns + this.columns) + 1) % this.columns;
var modX=x-Math.floor(x);
var minY : number = Math.floor(y % this.rows + this.rows) % this.rows;
var maxY : number = (Math.floor(y % this.rows + this.rows) + 1) % this.rows;
var modY=y-Math.floor(y);
//console.log(minX,maxX,this.columns,minY,maxY,this.rows);
return map[minY][minX] * (1 - modX) * (1 - modY) + map[maxY][minX] * (modX) * (1 - modY) + map[maxY][maxX] * (modX) * (modY) + map[minY][maxX] * (1-modX) * (modY);
    }
    generateHeights() : void {
        var perlinMap:Array<Array<number>>=[];
for (var i = 0; i < this.rows; i++) {
    perlinMap[i] = [];
    for (var j = 0; j < this.columns; j++) {
        perlinMap[i][j] = Math.random();
    }
}
this.heights = [];
var maxFractal : number = Math.floor(Math.log(this.columns) / Math.log(2));
for (var i = 0; i < this.rows; i++) {
this.heights[i] = [];
    for (var j = 0; j < this.columns; j++) {
this.heights[i][j]=-30;
for (var m = 0; m < maxFractal; m++) {
this.heights[i][j] += this.getMapValue((j - this.columns / 2) / Math.pow(2, maxFractal - m), (i - this.rows / 2) / Math.pow(2, maxFractal - m), perlinMap) / Math.pow(2, maxFractal - m);
}
    }
}
    }
    setGridFromData(data : Array < Array < Array < GridSquare >>>, heights : Array < Array < number >>) : void {
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
height : number;
dx : number;
dz : number;
rotation : number;
modelLabel : string;
gx : number;
gz : number;

constructor(height : number, dx : number, dz : number, rotation : number, modelLabel : string, gx : number, gz : number) {
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
const INDEX = path.join(__dirname, 'src\\public\\index.html');
var playerColors = [0xf9ff60, 0xff6060, 0x82ff60, 0x607eff, 0x60eaff, 0xff60ee, 0xe360ff, 0xffaf60, 0xa3ff60, 0xff609c, 0x60ff82, 0xcc60ff, 0xc65959, 0xf2d957, 0xc55252, 0x498e56, 0xc45151, 0xc35454, 0xc85757, 0xc85959, 0x5b74b6, 0x5c81bd, 0x5bb146, 0xd8c963, 0x404b7f];
const server = express()
    .use("/",express.static(path.join(__dirname, 'src\\public\\'))).use('/node_scripts/', express.static(path.join(__dirname,'node_modules\\')))
    .listen(PORT, () => console.log(`Listening on ${PORT}`));
const io = SocketIO(server);
var clients: Array<Client> = [];
var players: Array<Player> = [];
var terrainDetail:number=6;
var worldTerrain : TerrainGrid = new TerrainGrid(Math.pow(2, terrainDetail), Math.pow(2, terrainDetail));
worldTerrain.generateHeights();
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
        console.log(`Join ${socket.id}`);
        data=data||{};
        console.log(data);
        if(data.username){
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

setInterval(() => io.emit('terrain', worldTerrain), 10000);
//setInterval(() => io.emit('hello', clients.length.toString()), 1000);
/*function updateGridChange(r, c) {
    io.emit('gridHex', {
        v: grid.get(r, c),
        r: r,
        c: c
    });
}*/
setInterval(() => io.emit('players', players), 10);
setInterval(() => io.emit('cube', {
    rotation: {
        x: 0,
        y: new Date().getTime() / 1000,
        z:0
    },
    time: new Date().getTime()
}), 10);
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