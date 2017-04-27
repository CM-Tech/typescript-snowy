export class Player {
    playerId: string;
    clientId: string;
    username: string;
    color: number;
    lastActive: number;
    points: number;
    tot: number;
    constructor(playerId: string, username: string) {
        this.playerId = playerId;
        this.username = username;
    }
}