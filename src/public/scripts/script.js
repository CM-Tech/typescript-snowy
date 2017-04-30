// <reference path="../../../typings/globals/socket.io-client/index.d.ts" />
//--
// <reference path="../../../typings/globals/three/index.d.ts" />
//--
// <reference path="../shared/Player.ts"/>
// <reference path="./OutlineEffect.ts"/>
// <reference path="../shared/Terrain.ts"/>
var inGame = false;
var socket = io();
var players = [];
var myPlayer = null;
var lastPlayerTime = 0;
function playerForId(id) {
    for (var i = 0, len = players.length; i < Math.min(len, players.length); i++) {
        var c = players[i];
        if (c.playerId == id) {
            return c;
        }
    }
    return null;
}
var tree = null;
var models = [];
console.log("hello client");
socket.on('spawn', function (data) {
    console.log(data);
});
socket
    .on('players', function (data) {
    players = data;
    lastPlayerTime = new Date().getTime();
    if (playerForId(socket.id) != null) {
        myPlayer = playerForId(socket.id);
        camera.position.x = myPlayer.position.x;
        camera.position.y = myPlayer.position.y + 5;
        camera.position.z = myPlayer.position.z;
        inGame = true;
    }
});
var terrainDetail = 6;
var worldTerrain = new TerrainGrid(Math.pow(2, terrainDetail), Math.pow(2, terrainDetail), 0.5, 512 / 8);
var worldSize = 512 / 8;
var planeGeometry = new THREE.PlaneGeometry(worldSize, worldSize, worldTerrain.rows, worldTerrain.columns);
var terrainStuff = [];
var ModelEntry = (function () {
    function ModelEntry(modelName, mesh) {
        this.name = modelName;
        this.mesh = mesh;
    }
    return ModelEntry;
}());
function getModelByName(name) {
    for (var _i = 0, models_1 = models; _i < models_1.length; _i++) {
        var modelEntry = models_1[_i];
        if (modelEntry.name == name) {
            return modelEntry.mesh.clone(true);
        }
    }
    return null;
}
var scene, camera, renderer;
var effect;
var WIDTH = window.innerWidth;
var HEIGHT = window.innerHeight;
var mouseX = 0, mouseY = 0;
var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;
function init() {
    scene = new THREE.Scene();
    initCamera();
    initRenderer();
    initCube();
    initSocket();
    document
        .body
        .appendChild(renderer.domElement);
    document.addEventListener('mousemove', onDocumentMouseMove, false);
    window.addEventListener('resize', onWindowResize, false);
    loadModel("naturePack_084", "tree_1");
}
function initSocket() {
    socket
        .on('cube', function (data) {
        //cube.rotation.x = data.rotation.x;
        //cube.rotation.y = data.rotation.y;
        //cube.rotation.z = data.rotation.z;
        if (tree == null) {
            scene.remove(tree);
            tree = getModelByName("tree_1");
            if (tree != null) {
                //tree.children
                tree
                    .children
                    .forEach(function (child) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                });
                tree.position.z = 1;
                tree.castShadow = true;
                tree.receiveShadow = true;
                //scene.add(tree);
            }
        }
        if (tree != null) {
            tree.rotation.x = data.rotation.x;
            tree.rotation.y = data.rotation.y;
            tree.rotation.z = data.rotation.z;
        }
        //console.log(cube, new Date().getTime() - data.time);
    });
    socket
        .on('terrain', function (data) {
        worldTerrain.gridSize = data.gridSize;
        worldSize = worldTerrain.gridSize;
        worldTerrain.setGridFromData(data.grid, data.heights, data.tilt);
        scene.remove(plane);
        planeGeometry = new THREE.PlaneGeometry(worldSize * 3, worldSize * 3, worldTerrain.rows * 3, worldTerrain.columns * 3);
        for (var i = 0; i < planeGeometry.vertices.length; i++) {
            var y = Math.floor(i / (worldTerrain.columns * 3 + 1)) % worldTerrain.rows;
            var yn = Math.floor(i / (worldTerrain.columns * 3 + 1));
            var x = Math.floor(i % (worldTerrain.columns * 3 + 1)) % worldTerrain.columns;
            planeGeometry
                .vertices[i]
                .setComponent(2, worldTerrain.heights[y][x] + worldTerrain.tilt * (y - worldTerrain.rows / 2) - worldTerrain.tilt * (yn - 3 * worldTerrain.rows / 2));
        }
        var tLen = terrainStuff.length + 0;
        for (var i = 0; i < tLen; i++) {
            scene.remove(terrainStuff.pop());
        }
        for (var x = 0; x < worldTerrain.grid[0].length; x++) {
            for (var y = 0; y < worldTerrain.grid.length; y++) {
                var terrainSquareItems = worldTerrain.grid[y][x];
                for (var _i = 0, terrainSquareItems_1 = terrainSquareItems; _i < terrainSquareItems_1.length; _i++) {
                    var item = terrainSquareItems_1[_i];
                    var object = getModelByName(item.modelLabel);
                    if (object !== null) {
                        object
                            .children
                            .forEach(function (child) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                        });
                        object.castShadow = true;
                        object.receiveShadow = true;
                        terrainStuff.push(object);
                        object.rotation.y = item.rotation;
                        object
                            .position
                            .set((item.gx - worldTerrain.columns / 2) * worldSize / worldTerrain.columns, item.height, (item.gz - worldTerrain.rows / 2) * worldSize / worldTerrain.rows);
                        scene.add(object);
                        object = object.clone();
                        terrainStuff.push(object);
                        object
                            .position
                            .set((item.gx - worldTerrain.columns / 2) / worldTerrain.columns * worldSize + worldSize, item.height, ((item.gz - worldTerrain.rows / 2) / worldTerrain.rows) * worldSize);
                        scene.add(object);
                        object = object.clone();
                        terrainStuff.push(object);
                        object
                            .position
                            .set((item.gx - worldTerrain.columns / 2) / worldTerrain.columns * worldSize - worldSize, item.height, ((item.gz - worldTerrain.rows / 2) / worldTerrain.rows) * worldSize);
                        scene.add(object);
                        object = object.clone();
                        terrainStuff.push(object);
                        object
                            .position
                            .set((item.gx - worldTerrain.columns / 2) / worldTerrain.columns * worldSize - worldSize, item.height - worldTerrain.rows * worldTerrain.tilt, ((item.gz - worldTerrain.rows / 2) / worldTerrain.rows + 1) * worldSize);
                        scene.add(object);
                        object = object.clone();
                        terrainStuff.push(object);
                        object
                            .position
                            .set((item.gx - worldTerrain.columns / 2) / worldTerrain.columns * worldSize, item.height - worldTerrain.rows * worldTerrain.tilt, ((item.gz - worldTerrain.rows / 2) / worldTerrain.rows + 1) * worldSize);
                        scene.add(object);
                        object = object.clone();
                        terrainStuff.push(object);
                        object
                            .position
                            .set((item.gx - worldTerrain.columns / 2) / worldTerrain.columns * worldSize + worldSize, item.height - worldTerrain.rows * worldTerrain.tilt, ((item.gz - worldTerrain.rows / 2) / worldTerrain.rows + 1) * worldSize);
                        scene.add(object);
                        object = object.clone();
                        terrainStuff.push(object);
                        object
                            .position
                            .set((item.gx - worldTerrain.columns / 2) / worldTerrain.columns * worldSize, item.height + worldTerrain.rows * worldTerrain.tilt, ((item.gz - worldTerrain.rows / 2) / worldTerrain.rows - 1) * worldSize);
                        scene.add(object);
                        object = object.clone();
                        terrainStuff.push(object);
                        object
                            .position
                            .set((item.gx - worldTerrain.columns / 2) / worldTerrain.columns * worldSize + worldSize, item.height + worldTerrain.rows * worldTerrain.tilt, ((item.gz - worldTerrain.rows / 2) / worldTerrain.rows - 1) * worldSize);
                        scene.add(object);
                        object = object.clone();
                        terrainStuff.push(object);
                        object
                            .position
                            .set((item.gx - worldTerrain.columns / 2) / worldTerrain.columns * worldSize - worldSize, item.height + worldTerrain.rows * worldTerrain.tilt, ((item.gz - worldTerrain.rows / 2) / worldTerrain.rows - 1) * worldSize);
                        scene.add(object);
                    }
                }
            }
        }
        var planeMaterial = new THREE.MeshToonMaterial({ color: 0xfefefe, specular: 0x000000, shininess: 0.0, shading: THREE.FlatShading });
        plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane
            .position
            .set(0, 0, 0);
        plane.rotation.x = -Math.PI / 2;
        plane.receiveShadow = true;
        plane.castShadow = true;
        scene.add(plane);
    });
}
socket.emit("join", { username: "BOB" });
function initCamera() {
    camera = new THREE.PerspectiveCamera(70, WIDTH / HEIGHT, 1, 40);
    camera
        .position
        .set(0, 10, 10);
    camera.lookAt(scene.position);
    //scene.fog=new THREE.Fog(0xeeeeee,50,75)
}
function initRenderer() {
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(WIDTH, HEIGHT);
    renderer.setClearColor(new THREE.Color(100, 128, 208));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
    effect = new THREE.OutlineEffect(renderer);
}
var cube;
var light;
var plane;
//label is what to call it after import
function loadModel(name, label) {
    var mtlLoader = new THREE.MTLLoader();
    mtlLoader.setPath('models/');
    mtlLoader.load(name + '.mtl', function (materials) {
        materials.preload();
        var objLoader = new THREE.OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.setPath('models/');
        objLoader.load(name + '.obj', function (object) {
            console.log(object);
            object.updateMatrix();
            var bbox = new THREE
                .Box3()
                .setFromObject(object);
            console.log(bbox);
            var center = bbox.getCenter(new THREE.Vector3(0, 0, 0));
            object.applyMatrix(new THREE.Matrix4().makeTranslation(-center.x, 0, -center.z));
            object.updateMatrix();
            //object.applyMatrix();
            //object.geometry.computeBoundingBox();
            // var center:THREE.Vector3=object.geometry.boundingBox.getCenter();
            //object.geometry.applyMatrix(new THREE.Matrix4().makeTranslation(-center.x,-center.y,0))
            models.push(new ModelEntry(label, object));
        });
    });
}
function initCube() {
    var boxGeometry = new THREE.BoxGeometry(1, 1, 1);
    var boxMaterial = new THREE.MeshToonMaterial({ color: 0xffffff, specular: 0x000000, shininess: 0, shading: THREE.FlatShading });
    cube = new THREE.Mesh(boxGeometry, boxMaterial);
    cube
        .position
        .set(0, 1, 0);
    cube.castShadow = true;
    cube.receiveShadow = true;
    //scene.add(cube);
    light = new THREE.DirectionalLight(0xffffff, 0.5);
    light
        .position
        .set(10, 10, -30);
    light.castShadow = true; // default false
    light.shadow.mapSize.width = 1024; // default 512
    light.shadow.mapSize.height = 1024; // default 512
    light.shadow.camera.near = 2; // default 0.5
    light.shadow.camera.far = 100;
    light.lookAt(scene.position);
    scene.add(light);
    var ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);
    //planeGeometry.vertices[0].setComponent(1,10);
    var planeMaterial = new THREE.MeshToonMaterial({ color: 0xfefefe, specular: 0x000000, shininess: 0.0, shading: THREE.FlatShading });
    plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane
        .position
        .set(0, -1, 0);
    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true;
    plane.castShadow = true;
    //scene.add(plane);
}
function render() {
    //renderer.render(scene, camera);
    scene.autoUpdate = true;
    effect.render(scene, camera);
    requestAnimationFrame(render);
}
init();
render();
function onWindowResize() {
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
function onDocumentMouseMove(event) {
    mouseX = (event.clientX - windowHalfX) / 2;
    mouseY = (event.clientY - windowHalfY) / 2;
    camera.rotation.y = -mouseX / windowHalfX * Math.PI * 2 + Math.PI;
    camera.rotation.z = 0; //mouseY / windowHalfY * Math.PI * 2;
    camera.rotation.x = 0;
    camera.rotateX(-mouseY / windowHalfY * Math.PI * 1);
    socket.emit("rotation", -mouseX / windowHalfX * Math.PI * 2);
}
