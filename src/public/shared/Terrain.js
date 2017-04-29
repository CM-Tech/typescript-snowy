var TerrainGrid = (function () {
    function TerrainGrid(rows, columns, tilt, gridSize) {
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
    TerrainGrid.prototype.getMapValue = function (x, y, map) {
        var minX = Math.floor(x % map[0].length + map[0].length) % map[0].length;
        var maxX = (Math.floor(x % map[0].length + map[0].length) + 1) % map[0].length;
        var modX = x - Math.floor(x);
        var minY = Math.floor(y % map.length + map.length) % map.length;
        var maxY = (Math.floor(y % map.length + map.length) + 1) % map.length;
        var modY = y - Math.floor(y);
        //console.log(minX,maxX,this.columns,minY,maxY,this.rows);
        return map[minY][minX] * (1 - modX) * (1 - modY) + map[maxY][minX] * (modX) * (1 - modY) + map[maxY][maxX] * (modX) * (modY) + map[minY][maxX] * (1 - modX) * (modY);
    };
    TerrainGrid.prototype.getHeightAtWorldCoord = function (x, z) {
        return this.getMapValue((x / this.gridSize + 0.5) * this.columns, (z / this.gridSize + 0.5) * this.rows, this.heights);
    };
    TerrainGrid.prototype.getNoTiltHeightAtWorldCoord = function (x, z) {
        return this.getMapValue((x / this.gridSize + 0.5) * this.columns, (z / this.gridSize + 0.5) * this.rows, this.heights) - this.getTiltTermAtWorldCoord(x, z);
    };
    TerrainGrid.prototype.getTiltTermAtWorldCoord = function (x, z) {
        return -this.tilt * ((z / this.gridSize + 0.5) * this.rows - this.rows / 2);
    };
    TerrainGrid.prototype.getSurfaceNormalArWorldCoord = function (x, z) {
        var A = new THREE.Vector3(x, 0.0, z + 0.05);
        A.y = this.getNoTiltHeightAtWorldCoord(A.x, A.z) + this.getTiltTermAtWorldCoord(A.x, A.z);
        var B = new THREE.Vector3(x + 0.05, 0.0, z - 0.05);
        B.y = this.getNoTiltHeightAtWorldCoord(B.x, B.z) + this.getTiltTermAtWorldCoord(B.x, B.z);
        var C = new THREE.Vector3(x - 0.05, 0.0, z - 0.05);
        C.y = this.getNoTiltHeightAtWorldCoord(C.x, C.z) + this.getTiltTermAtWorldCoord(C.x, C.z);
        var Dir = B
            .sub(A)
            .cross(C.sub(A));
        return Dir.normalize();
    };
    TerrainGrid.prototype.iterateGrid = function (grid, randScale) {
        var newGrid = [];
        for (var i = 0; i < grid.length * 2; i++) {
            newGrid[i] = [];
            for (var j = 0; j < grid[0].length * 2; j++) {
                newGrid[i][j] = this.getMapValue(j / 2, i / 2, grid) + Math.random() * randScale;
            }
        }
        return newGrid;
    };
    TerrainGrid.prototype.generateHeights = function () {
        var perlinMap = [];
        for (var i = 0; i < this.rows; i++) {
            perlinMap[i] = [];
            for (var j = 0; j < this.columns; j++) {
                perlinMap[i][j] = Math.random();
            }
        }
        this.heights = [];
        var maxFractal = Math.floor(Math.log(this.columns) / Math.log(2));
        for (var i = 0; i < this.rows; i++) {
            this.heights[i] = [];
            for (var j = 0; j < this.columns; j++) {
                this.heights[i][j] = 0.0;
            }
        }
        var newGrid = [
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
        var midVal = this.heights[Math.floor(this.rows / 2)][Math.floor(this.columns / 2)];
        for (var i = 0; i < this.rows; i++) {
            for (var j = 0; j < this.columns; j++) {
                this.heights[i][j] = (this.heights[i][j] - midVal) * 70;
            }
        }
    };
    TerrainGrid.prototype.generateTrees = function () {
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
    };
    TerrainGrid.prototype.setGridFromData = function (data, heights, tilt) {
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
    };
    return TerrainGrid;
}());
var GridSquare = (function () {
    function GridSquare(height, dx, dz, rotation, modelLabel, gx, gz) {
        this.height = height;
        this.dx = dx;
        this.dz = dz;
        this.rotation = rotation;
        this.modelLabel = modelLabel;
        this.gx = gx;
        this.gz = gz;
    }
    return GridSquare;
}());
