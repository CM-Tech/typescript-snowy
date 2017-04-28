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
    generateHeights() : void {}
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
