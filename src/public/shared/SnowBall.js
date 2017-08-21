var SnowBall = (function () {
    function SnowBall(playerId, damage) {
        this.playerId = playerId;
        this.damage = damage;
        this.position = new THREE.Vector3(0, 0, 0);
        this.rotation = new THREE.Vector3(0, 0, 0);
        this.quat = new THREE.Quaternion(0, 0, 0, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
    }
    SnowBall.prototype.setRotation = function (x, y, z) {
        this
            .rotation
            .set(x, y, z);
    };
    SnowBall.prototype.setPosition = function (x, y, z) {
        this
            .position
            .set(x, y, z);
    };
    return SnowBall;
}());
