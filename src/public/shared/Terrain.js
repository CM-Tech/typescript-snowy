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
    TerrainGrid.prototype.getHeightMapValueCorrected = function (x, y) {
        var map = this.heights;
        var minX = Math.floor(x % map[0].length + map[0].length) % map[0].length;
        var maxX = (Math.floor(x % map[0].length + map[0].length) + 1) % map[0].length;
        var modX = x - Math.floor(x);
        var minY = Math.floor(y % map.length + map.length) % map.length;
        var maxY = (Math.floor(y % map.length + map.length) + 1) % map.length;
        var modY = y - Math.floor(y);
        //console.log(minX,maxX,this.columns,minY,maxY,this.rows);
        return (map[minY][minX] + (minY - this.columns / 2) * this.tilt) * (1 - modX) * (1 - modY) + (map[maxY][minX] + (maxY - this.columns / 2) * this.tilt) * (modX) * (1 - modY) + (map[maxY][maxX] + (maxY - this.columns / 2) * this.tilt) * (modX) * (modY) + (map[minY][maxX] + (minY - this.columns / 2) * this.tilt) * (1 - modX) * (modY) - (y - this.columns / 2) * this.tilt;
    };
    TerrainGrid.prototype.getHeightAtWorldCoord = function (x, z) {
        return this.getHeightMapValueCorrected((x / this.gridSize + 0.5) * this.columns, (z / this.gridSize + 0.5) * this.rows);
    };
    TerrainGrid.prototype.getNoTiltHeightAtWorldCoord = function (x, z) {
        return this.getHeightMapValueCorrected((x / this.gridSize + 0.5) * this.columns, (z / this.gridSize + 0.5) * this.rows) - this.getTiltTermAtWorldCoord(x, z);
    };
    TerrainGrid.prototype.getTiltTermAtWorldCoord = function (x, z) {
        return -this.tilt * ((z / this.gridSize + 0.5) * this.rows - this.rows / 2);
    };
    TerrainGrid.prototype.getTiltTermAtGridCoord = function (x, y) {
        return -this.tilt * (y - this.rows / 2);
    };
    TerrainGrid.prototype.getSurfaceNormalAtWorldCoord = function (x, z) {
        var dummy = new THREE.Vector3(0, 0, 0);
        var A = new THREE.Vector3(x, 0.0, z + 0.5);
        A.y = (this.getNoTiltHeightAtWorldCoord(A.x, A.z) + this.getTiltTermAtWorldCoord(A.x, A.z));
        var B = new THREE.Vector3(x + 0.5, 0.0, z - 0.5);
        B.y = (this.getNoTiltHeightAtWorldCoord(B.x, B.z) + this.getTiltTermAtWorldCoord(B.x, B.z));
        var C = new THREE.Vector3(x - 0.5, 0.0, z - 0.5);
        C.y = (this.getNoTiltHeightAtWorldCoord(C.x, C.z) + this.getTiltTermAtWorldCoord(C.x, C.z));
        var Dir = dummy.crossVectors(dummy
            .subVectors(B, A).clone(), dummy.subVectors(C, A).clone());
        console.log("DIR", Dir);
        return Dir.normalize();
    };
    TerrainGrid.prototype.getSurfaceNormalAtWorldCoordLarge = function (x, z) {
        var dummy = new THREE.Vector3(0, 0, 0);
        var A = new THREE.Vector3(x, 0.0, z + 1);
        A.y = (this.getNoTiltHeightAtWorldCoord(A.x, A.z) + this.getTiltTermAtWorldCoord(A.x, A.z));
        var B = new THREE.Vector3(x + 1, 0.0, z - 1);
        B.y = (this.getNoTiltHeightAtWorldCoord(B.x, B.z) + this.getTiltTermAtWorldCoord(B.x, B.z));
        var C = new THREE.Vector3(x - 1, 0.0, z - 1);
        C.y = (this.getNoTiltHeightAtWorldCoord(C.x, C.z) + this.getTiltTermAtWorldCoord(C.x, C.z));
        var Dir = dummy.crossVectors(dummy
            .subVectors(B, A).clone(), dummy.subVectors(C, A).clone());
        console.log("DIR", Dir);
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
        var newGrid = [[0]];
        while (newGrid.length < this.rows || newGrid[0].length < this.columns) {
            newGrid = this.iterateGrid(newGrid, 1 / Math.pow(newGrid.length, 1.5) / 2);
        }
        for (var i = 0; i < this.rows; i++) {
            for (var j = 0; j < this.columns; j++) {
                this.heights[i][j] = newGrid[i][j] / 2;
            }
        }
        var midVal = this.heights[Math.floor(this.rows / 2)][Math.floor(this.columns / 2)];
        for (var i = 0; i < this.rows; i++) {
            for (var j = 0; j < this.columns; j++) {
                this.heights[i][j] = (this.heights[i][j] - midVal) * 40 - this.tilt * (i - this.rows / 2);
            }
        }
    };
    TerrainGrid.prototype.getHeightTiltExpanded = function (x, y) {
        return this.getHeightMapValueCorrected(x, y) + this.tilt * (((y % this.rows + this.rows)) % this.rows - this.rows / 2) - this.tilt * (y - this.rows / 2);
    };
    TerrainGrid.prototype.generateTrees = function () {
        this.grid = [];
        for (var i = 0; i < this.rows; i++) {
            this.grid[i] = [];
            for (var j = 0; j < this.columns; j++) {
                this.grid[i][j] = [];
                if (Math.max(Math.abs(this.getHeightTiltExpanded(j - 1, i) - this.getHeightTiltExpanded(j + 1, i)), Math.abs(this.getHeightTiltExpanded(j, i - 1) - this.getHeightTiltExpanded(j, i + 1))) < 10) {
                    if (Math.random() < 0.01) {
                        var dx = Math.random();
                        var dy = Math.random();
                        this.grid[i][j] = [new GridSquare(this.getHeightTiltExpanded(j + dx, i + dy), 0, 0, Math.random() * Math.PI * 2, "tree_1", j + dx, i + dy)];
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
