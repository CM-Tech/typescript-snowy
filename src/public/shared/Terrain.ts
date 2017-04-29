class TerrainGrid {
    rows : number;
    columns : number;
    grid : Array < Array < Array < GridSquare >>>;
    heights : Array < Array < number >>;
gridSize : number;
tilt : number;
constructor(rows : number, columns : number, tilt : number, gridSize : number) {
    this.gridSize = gridSize;
        this.tilt=tilt;
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
  getMapValue(x : number, y : number, map : Array < Array < number >>):number {
var minX : number = Math.floor(x % map[0].length + map[0].length) % map[0].length;
var maxX : number = (Math.floor(x % map[0].length + map[0].length) + 1) % map[0].length;
var modX=x-Math.floor(x);
var minY : number = Math.floor(y % map.length + map.length) % map.length;
var maxY : number = (Math.floor(y % map.length + map.length) + 1) % map.length;
var modY=y-Math.floor(y);
//console.log(minX,maxX,this.columns,minY,maxY,this.rows);
return map[minY][minX] * (1 - modX) * (1 - modY) + map[maxY][minX] * (modX) * (1 - modY) + map[maxY][maxX] * (modX) * (modY) + map[minY][maxX] * (1-modX) * (modY);
    }
getHeightAtWorldCoord(x : number, z : number) : number {
    return this.getMapValue((x / this.gridSize + 0.5) * this.columns, (z / this.gridSize + 0.5) * this.rows, this.heights);
}
getNoTiltHeightAtWorldCoord(x : number, z : number) : number {
return this.getMapValue((x / this.gridSize + 0.5) * this.columns, (z / this.gridSize + 0.5) * this.rows, this.heights) - this.getTiltTermAtWorldCoord(x,z);
}
getTiltTermAtWorldCoord(x : number, z : number) : number {
return -this.tilt * ((z / this.gridSize + 0.5) * this.rows - this.rows / 2);
}
getSurfaceNormalArWorldCoord(x : number, z : number) : THREE.Vector3 {
var A: THREE.Vector3 = new THREE.Vector3(x, 0.0, z + 0.05);
A.y = this.getNoTiltHeightAtWorldCoord(A.x, A.z) + this.getTiltTermAtWorldCoord(A.x, A.z);
var B: THREE.Vector3 = new THREE.Vector3(x + 0.05, 0.0, z - 0.05);
B.y = this.getNoTiltHeightAtWorldCoord(B.x, B.z) + this.getTiltTermAtWorldCoord(B.x, B.z);
var C: THREE.Vector3 = new THREE.Vector3(x - 0.05, 0.0, z - 0.05);
C.y = this.getNoTiltHeightAtWorldCoord(C.x, C.z) + this.getTiltTermAtWorldCoord(C.x, C.z);
var Dir: THREE.Vector3 = B
    .sub(A)
    .cross(C.sub(A));
return Dir.normalize();
}
    iterateGrid(grid : Array < Array < number >>, randScale : number) : Array < Array < number >> {
        var newGrid: Array < Array < number >>= [];
        for (var i = 0; i < grid.length * 2; i++) {
            newGrid[i] = [];
            for (var j = 0; j < grid[0].length * 2; j++) {
                newGrid[i][j] = this.getMapValue(j / 2, i / 2, grid) + Math.random() * randScale;
            }
        }
        return newGrid;
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
                this.heights[i][j] = 0.0;
            }
        }
        var newGrid: Array < Array < number >>= [
            [0]
        ];
        while (newGrid.length < this.rows || newGrid[0].length < this.columns) {
            newGrid = this.iterateGrid(newGrid, 1 / newGrid.length / 3);
        }
        /*for (var m = 1; m < maxFractal; m++) {
for (var i = 0; i < this.rows / Math.pow(2, m); i++) {
    perlinMap[i] = [];
for (var j = 0; j < this.columns / Math.pow(2, m); j++) {
        perlinMap[i][j] = Math.random();
    }
}
for (var i = 0; i < this.rows; i++) {
    for (var j = 0; j < this.columns; j++) {

this.heights[i][j] += this.getMapValue((j)  / Math.pow(2, m)+0.5, (i ) / Math.pow(2, m)+0.5, perlinMap) / Math.pow(2, maxFractal-m);

    }
}
}*/
        for (var i = 0; i < this.rows; i++) {
            for (var j = 0; j < this.columns; j++) {

                this.heights[i][j] = newGrid[i][j];

            }
        }
        var midVal: number = this.heights[Math.floor(this.rows / 2)][Math.floor(this.columns / 2)];
        for (var i = 0; i < this.rows; i++) {

            for (var j = 0; j < this.columns; j++) {

                this.heights[i][j] = (this.heights[i][j] - midVal) * 70;
            }
        }
    }
    generateTrees() : void {
        this.grid = [];
        for (var i = 0; i < this.rows; i++) {
            this.grid[i] = [];
            for (var j = 0; j < this.columns; j++) {
                this.grid[i][j] = [];
                if (Math.max(Math.abs(this.getMapValue(j - 1, i, this.heights) - this.getMapValue(j + 1, i, this.heights)), Math.abs(this.getMapValue(j, i - 1, this.heights) - this.getMapValue(j, i + 1, this.heights))) < 10) {

                    if (Math.random() < 0.01) {
                        var dx = Math.random();
                        var dy = Math.random();
                        this.grid[i][j] = [new GridSquare(this.getMapValue(j + dx, i + dy, this.heights), 0, 0, Math.random() * Math.PI * 2, "tree_1", j + dx, i + dy)];
                    }
                }
            }
        }
    }
setGridFromData(data : Array < Array < Array < GridSquare >>>, heights : Array < Array < number >>, tilt : number):void {
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
