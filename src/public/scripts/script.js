/// <reference path="../../../typings/globals/socket.io-client/index.d.ts" />
/// <reference path="../shared/Player.ts"/>
//import * as io from 'socket.io-client';
var socket = io();
console.log("hello client");
socket.on('spawn', function (data) {
    console.log(data);
});
