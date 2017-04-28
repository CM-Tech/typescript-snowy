"use strict";
exports.__esModule = true;
var Player = (function () {
    function Player(playerId, username) {
        this.playerId = playerId;
        this.username = username;
        this.position = new THREE.Vector3(0, 0, 0);
        this.rotation = new THREE.Vector3(0, 0, 0);
    }
    Player.prototype.setRotation = function (x, y, z) {
        this.rotation.set(x, y, z);
    };
    Player.prototype.setPosition = function (x, y, z) {
        this
            .position
            .set(x, y, z);
    };
    return Player;
}());
/*declare module "Player" {
    export= Player;
}*/
exports["default"] = Player;
