// <reference path="../../../typings/globals/socket.io-client/index.d.ts" />
//--
// <reference path="../../../typings/globals/three/index.d.ts" />
//--
// <reference path="../shared/Player.ts"/> <reference path="./OutlineEffect.ts"/>
var socket = io();
var tree = new THREE.Mesh();
var models = [];
console.log("hello client");
socket.on('spawn', function (data) {
    console.log(data);
});
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
            return modelEntry.mesh.clone();
        }
    }
    return new THREE.Mesh();
}
var scene, camera, renderer;
var effect;
var WIDTH = window.innerWidth;
var HEIGHT = window.innerHeight;
var mouseX = 0, mouseY = 0;
var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;
var object;
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
        scene.remove(tree);
        tree = getModelByName("tree_1");
        tree.position.z = 1;
        tree.castShadow = true;
        tree.receiveShadow = true;
        scene.add(tree);
        tree.rotation.x = data.rotation.x;
        tree.rotation.y = data.rotation.y;
        tree.rotation.z = data.rotation.z;
        //console.log(cube, new Date().getTime() - data.time);
    });
}
function initCamera() {
    camera = new THREE.PerspectiveCamera(70, WIDTH / HEIGHT, 1, 10);
    camera
        .position
        .set(0, 5, 5);
    camera.lookAt(scene.position);
}
function initRenderer() {
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(WIDTH, HEIGHT);
    renderer.setClearColor(new THREE.Color(180, 180, 180));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
    //effect = new THREE.OutlineEffect(renderer);
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
            models.push(new ModelEntry(label, object));
        });
    });
}
function initCube() {
    var boxGeometry = new THREE.BoxGeometry(1, 1, 1);
    var boxMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff, specular: 0x000000, shininess: 0, shading: THREE.FlatShading });
    cube = new THREE.Mesh(boxGeometry, boxMaterial);
    cube
        .position
        .set(0, 1, 0);
    cube.castShadow = true;
    cube.receiveShadow = true;
    //scene.add(cube);
    light = new THREE.DirectionalLight(0xffffff, 1);
    light
        .position
        .set(2, 12, 2);
    light.castShadow = true; // default false
    light.shadow.mapSize.width = 1024; // default 512
    light.shadow.mapSize.height = 1024; // default 512
    light.shadow.camera.near = 2; // default 0.5
    light.shadow.camera.far = 100;
    light.lookAt(scene.position);
    scene.add(light);
    var planeGeometry = new THREE.PlaneGeometry(20, 20, 32, 32);
    var planeMaterial = new THREE.MeshPhongMaterial({ color: 0xFF3333, specular: 0x000000, shininess: 0, shading: THREE.FlatShading });
    plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane
        .position
        .set(0, -1, 0);
    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true;
    scene.add(plane);
}
function render() {
    renderer.render(scene, camera);
    //effect.render(scene, camera);
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
}
