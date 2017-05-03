// <reference path="../../../typings/globals/socket.io-client/index.d.ts" />

//--

// <reference path="../../../typings/globals/three/index.d.ts" />

//--

// <reference path="../shared/Player.ts"/>
// <reference path="./OutlineEffect.ts"/>
// <reference path="../shared/Terrain.ts"/>
var inGame: boolean = false;
var socket = io();
var players: Array<Player> = [];
var myPlayer: Player = null;
var lastPlayerTime: number = 0;
var username = prompt("username?");
var oldRot: THREE.Quaternion = new THREE.Quaternion(0, 0, 0, 0);
var scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer;
function playerForId(id) {
  for (var i = 0, len = players.length; i < Math.min(len, players.length); i++) {
    var c = players[i];

    if (c.playerId === id) {
      return c;
    }
  }
  return null;
}
var tree: THREE.Object3D = null;
var models: Array<ModelEntry> = [];
console.log("hello client");
socket.on('spawn', function(data) {
  console.log(data);
});
var playerStuff: Array<THREE.Object3D> = [];
socket
  .on('players', function(data) {
    players = data;
    lastPlayerTime = new Date().getTime();
    if (playerForId(socket.id) !== null) {
      myPlayer = playerForId(socket.id);
      /*camera.position.x=myPlayer.position.x;
      camera.position.y = myPlayer.position.y+1.5;
      camera.position.z = myPlayer.position.z;
          camera.rotation.y = myPlayer.rotation.y + Math.PI;
          //camera.rotation.z = myPlayer.rotation.z;//mouseY / windowHalfY * Math.PI * 2;
          //camera.rotation.x = myPlayer.rotation.x;
          camera.rotateX(-mouseY / windowHalfY * Math.PI * 1);
      camera.rotateX(-mouseY / windowHalfY * Math.PI * 1);
          camera.rotateX(-mouseY / windowHalfY * Math.PI * 1);*/
      inGame = true;
    }
    var pLen = playerStuff.length + 0;
    for (var i = 0; i < pLen; i++) {
      scene.remove(playerStuff.pop());
    }
    for (var i = 0; i < players.length; i++) {
      var playerGroup: THREE.Object3D = new THREE.Object3D();
      var skis: THREE.Object3D = new THREE.Object3D();
      var ski: THREE.Object3D = new THREE.Object3D();
      var skiBaseGeometry = new THREE.BoxGeometry(0.15, 0.025, 2.70);
      var skiBaseMaterial = new THREE.MeshToonMaterial({ color: 0x888888, specular: 0x777777, shininess: 0.5, shading: THREE.FlatShading });
      var skiBase: THREE.Mesh = new THREE.Mesh(skiBaseGeometry, skiBaseMaterial);
      skiBase.position.z = -0.15 / 2;
      skiBase.castShadow = true;
      skiBase.receiveShadow = true;
      ski.add(skiBase);
      var skiTipGeometry = new THREE.BoxGeometry(0.15, 0.025, 0.3);
      var skiTipMaterial = new THREE.MeshToonMaterial({ color: 0xFF7777, specular: 0xdF4444, shininess: 0.5, shading: THREE.FlatShading });
      var skiTip: THREE.Mesh = new THREE.Mesh(skiTipGeometry, skiTipMaterial);
      skiTip.position.z = 1.35 / 1 + 0.15 / 2;
      skiTip.castShadow = true;
      skiTip.receiveShadow = true;
      ski.add(skiTip);
      ski.position.y = 0.0125;
      var skiLeft = ski.clone();
      skiLeft.position.x = 0.3;
      var skiRight = ski.clone();
      skiRight.position.x = -0.3;

      playerGroup.add(skiLeft);
      playerGroup.add(skiRight);
      //if (players[i].clientId !== socket.id) {
      var bodyGeometry = new THREE.BoxGeometry(1, 1, 1);
      var coatRuffleGeometry = new THREE.BoxGeometry(1.08, 0.1, 1.08);
      var bodyMaterial = new THREE.MeshToonMaterial({ color: players[i].color, specular: 0x000000, shininess: 0, shading: THREE.FlatShading });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      var coatRuffle = new THREE.Mesh(coatRuffleGeometry, bodyMaterial);

      body
        .position
        .set(0, 0.5, 0);
      body.castShadow = true;
      body.receiveShadow = true;
      for (var j = 0; j < 5; j++) {
        var coatRuffleClone = coatRuffle.clone();
        coatRuffleClone.castShadow = true;
        coatRuffleClone.receiveShadow = true;
        coatRuffleClone.position.set(0, (j - 2) * 0.2, 0);
        body.add(coatRuffleClone);
      }
      playerGroup.add(body);
      //}
      playerGroup.position.x = (players[i].position.x - myPlayer.position.x) % worldTerrain.gridSize + myPlayer.position.x;
      playerGroup.position.y = players[i].position.y - worldTerrain.getTiltTermAtWorldCoord(players[i].position.x, players[i].position.z) + worldTerrain.getTiltTermAtWorldCoord((players[i].position.x - myPlayer.position.x) % worldTerrain.gridSize + myPlayer.position.x, (players[i].position.z - myPlayer.position.z) % worldTerrain.gridSize + myPlayer.position.z);
      playerGroup.position.z = (players[i].position.z - myPlayer.position.z) % worldTerrain.gridSize + myPlayer.position.z;
      playerGroup.rotation.x = players[i].rotation.x;
      playerGroup.rotation.y = players[i].rotation.y;
      playerGroup.rotation.z = players[i].rotation.z;
      if (players[i].playerId === socket.id) {
        var newPos: THREE.Vector3 = playerGroup.getWorldPosition().clone().add(new THREE.Vector3(0, 1.5, 0).applyEuler(playerGroup.rotation.clone()));
        camera.position.x = newPos.x;
        camera.position.y = newPos.y;
        camera.position.z = newPos.z;
        var currentDir = oldRot.clone();
        var nextDir = eval("new THREE.Quaternion(myPlayer.quat._x, myPlayer.quat._y,myPlayer.quat._z, myPlayer.quat._w)");
        //console.log("next dir", nextDir);
        var middleDir = currentDir.clone().slerp(nextDir, 0.75);
        //console.log("middle 1",middleDir);
        middleDir.slerp(nextDir, 0.75);
        //console.log("middle 2", middleDir);
        //middleDir =THREE.Quaternion.slerp(currentDir.clone(), nextDir.clone(), middleDir,0.5);
        camera.setRotationFromQuaternion(middleDir.clone());
        oldRot = middleDir;
        //camera.setRotationFromEuler(playerGroup.rotation.clone());//forget about cam animation for now
        camera.rotateY(Math.PI * 1);
        camera.rotateX(-mouseY / windowHalfY * Math.PI * 1);
        //camera.rotation.y = -camera.rotation.y;
        //playerGroup.add(camera);
      }
      scene.add(playerGroup);
      playerStuff.push(playerGroup);
    }
  });
var terrainDetail: number = 6;
var worldTerrain: TerrainGrid = new TerrainGrid(Math.pow(2, terrainDetail), Math.pow(2, terrainDetail), 0.5, 512 / 8);
var worldSize: number = 512 / 8;
var planeGeometry: THREE.PlaneGeometry = new THREE.PlaneGeometry(worldSize, worldSize, worldTerrain.rows, worldTerrain.columns);
var terrainStuff: Array<THREE.Object3D> = [];
class ModelEntry {
  name: string;
  mesh: THREE.Mesh;
  constructor(modelName: string, mesh: THREE.Mesh) {
    this.name = modelName;
    this.mesh = mesh;
  }
}
function getModelByName(name: string) {
  for (var modelEntry of models) {
    if (modelEntry.name === name) {
      var geometry = (modelEntry.mesh.children[0] as THREE.Mesh).geometry as THREE.BufferGeometry;
      var material = (modelEntry.mesh.children[0] as THREE.Mesh).material;

      return new THREE.Mesh(geometry, material);
    }
  }
  return null;
}
var effect;
var WIDTH: number = window.innerWidth;
var HEIGHT: number = window.innerHeight;
var mouseX = 0,
  mouseY = 0;
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
  renderer.domElement.onclick = function(event: MouseEvent) {

    document.exitPointerLock = eval("document.exitPointerLock || document.mozExitPointerLock");
    if (document.pointerLockElement !== renderer.domElement) {
      if (event.button === 0) {
        renderer.domElement.requestPointerLock();
      } else if (event.button === 2) {
        document.exitPointerLock();
      }
    }
  }
  renderer.domElement.addEventListener('mousemove', onDocumentMouseMove, false);
  window.addEventListener('resize', onWindowResize, false);
  renderer.domElement.requestPointerLock();
  loadModel("naturePack_084", "tree_1");
  socket.on('connect', function() {
    socket.emit("join", { username: username });
  })
}


function initSocket() {
  socket
    .on('cube', function(data) {
      //cube.rotation.x = data.rotation.x;
      //cube.rotation.y = data.rotation.y;
      //cube.rotation.z = data.rotation.z;
      if (tree === null) {
        scene.remove(tree);
        tree = getModelByName("tree_1");
        if (tree !== null) {
          //tree.children
          tree
            .children
            .forEach(child => {
              child.castShadow = true;

              child.receiveShadow = true;
            });
          tree.position.z = 1;
          tree.castShadow = true;

          tree.receiveShadow = true;
          //scene.add(tree);
        }
      }
      if (tree !== null) {
        tree.rotation.x = data.rotation.x;
        tree.rotation.y = data.rotation.y;
        tree.rotation.z = data.rotation.z;
      }
      //console.log(cube, new Date().getTime() - data.time);
    });
  socket
    .on('terrain', function(data) {
      worldTerrain.gridSize = data.gridSize;
      worldSize = worldTerrain.gridSize;
      worldTerrain.setGridFromData(data.grid, data.heights, data.tilt);
      scene.remove(plane);
      planeGeometry = new THREE.PlaneGeometry(worldSize * 3, worldSize * 3, worldTerrain.rows * 3, worldTerrain.columns * 3);
      for (var i = 0; i < planeGeometry.vertices.length; i++) {
        var y: number = Math.floor(i / (worldTerrain.columns * 3 + 1)) % worldTerrain.rows;
        var yn: number = Math.floor(i / (worldTerrain.columns * 3 + 1));
        var x: number = Math.floor(i % (worldTerrain.columns * 3 + 1)) % worldTerrain.columns;
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
          var terrainSquareItems: Array<GridSquare> = worldTerrain.grid[y][x];
          for (var item of terrainSquareItems) {
            var object: THREE.Mesh = getModelByName(item.modelLabel);
            if (object !== null) {
              object
                .children
                .forEach(child => {
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
      var planeMaterial = new THREE.MeshToonMaterial({ color: 0xfefefe, specular: 0x000000, shininess: 0.0, shading: THREE.FlatShading })
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
  renderer.setClearColor(new THREE.Color(100, 128, 208))
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
  effect = new THREE.OutlineEffect(renderer);
}
var cube;
var light;
var plane;
//label is what to call it after import
function loadModel(name: string, label: string) {
  var mtlLoader = new THREE.MTLLoader();
  mtlLoader.setPath('models/');
  mtlLoader.load(name + '.mtl', function(materials) {
    materials.preload();
    var objLoader = new THREE.OBJLoader();
    objLoader.setMaterials(materials);
    objLoader.setPath('models/');
    objLoader.load(name + '.obj', function(object: THREE.Mesh) {
      console.log(object);
      object.updateMatrix();
      var bbox: THREE.Box3 = new THREE
        .Box3()
        .setFromObject(object);
      console.log(bbox);
      var center: THREE.Vector3 = bbox.getCenter(new THREE.Vector3(0, 0, 0));
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
    .set(10, 100, -30);
  light.castShadow = true; // default false
  light.shadow.mapSize.width = 1024 * 2; // default 512
  light.shadow.mapSize.height = 1024 * 2; // default 512
  light.shadow.camera.near = 0.5; // default 0.5
  light.shadow.camera.far = 1024;
  light.shadowCameraLeft = -512;
  light.shadowCameraRight = 512;
  light.shadowCameraTop = 512;
  light.shadowCameraBottom = -512;
  light.lookAt(scene.position);
  scene.add(light);
  var ambient = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambient);
  //planeGeometry.vertices[0].setComponent(1,10);
  var planeMaterial = new THREE.MeshToonMaterial({ color: 0xfefefe, specular: 0x000000, shininess: 0.0, shading: THREE.FlatShading })
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
  if (document.pointerLockElement !== renderer.domElement) {
    mouseX = (event.clientX - windowHalfX) / 2;
    mouseY = (event.clientY - windowHalfY) / 2;
  } else {
    mouseX += (event.movementX) / 2;
    mouseY += (event.movementY) / 2;
    mouseY = Math.min(Math.max(mouseY, -windowHalfY / 2), windowHalfY / 2);
  }
  /*camera.rotation.y = -mouseX / windowHalfX * Math.PI * 2 + Math.PI;
  camera.rotation.z = 0;//mouseY / windowHalfY * Math.PI * 2;
  camera.rotation.x = 0;
  if (myPlayer) {
      camera.rotation.y = myPlayer.rotation.y + Math.PI;
      camera.rotation.z = myPlayer.rotation.z;//mouseY / windowHalfY * Math.PI * 2;
      camera.rotation.x = myPlayer.rotation.x;
  }*/
  //camera.rotateX(-mouseY / windowHalfY * Math.PI * 1);
  socket.emit("rotation", - mouseX / windowHalfX * Math.PI * 2);
}
