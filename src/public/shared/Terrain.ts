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
return map[minY][minX] * (1 - modX) * (1 - modY) + map[maxY][minX] * (modX) * (1 - modY) + map[maxY][maxX] * (modX) * (modY) + map[minY][maxX] * (1 - modX) * (modY);
}
generateHeights() : void {
    var perlinMap: Array < Array < number >>= [];
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
            this.heights[i][j] = 0;
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
