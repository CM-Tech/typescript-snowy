var TerrainGrid = (function () {
    function TerrainGrid(rows, columns) {
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
    TerrainGrid.prototype.generateHeights = function () { };
    TerrainGrid.prototype.setGridFromData = function (data, heights) {
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
