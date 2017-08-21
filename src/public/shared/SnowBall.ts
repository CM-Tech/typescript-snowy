class SnowBall {
    playerId: string;
    clientId: string;
    color: number;
    fireTime: number;
    damage: number;
    
    position: THREE.Vector3;
    rotation: THREE.Vector3;
    quat: THREE.Quaternion;
    velocity: THREE.Vector3;
    constructor(playerId: string, damage: number) {
        this.playerId = playerId;
        this.damage = damage;
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