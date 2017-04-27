// / <reference path="../../../typings/globals/socket.io-client/index.d.ts" /> /
// <reference path="../../../typings/globals/three/index.d.ts" /> <reference
// path="../shared/Player.ts"/> <reference path="./OutlineEffect.ts"/>
var socket = io();
console.log("hello client");
socket.on('spawn', function (data) {
    console.log(data);
});
var scene, camera, renderer, effect;
var WIDTH = window.innerWidth;
var HEIGHT = window.innerHeight;
function init() {
    scene = new THREE.Scene();
    initCamera();
    initRenderer();
    initCube();
    initSocket();
    document
        .body
        .appendChild(renderer.domElement);
}
function initSocket() {
    socket
        .on('cube', function (data) {
        cube.rotation.x = data.rotation.x;
        cube.rotation.y = data.rotation.y;
        cube.rotation.z = data.rotation.z;
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
    effect = new THREE.OutlineEffect(renderer);
}
var cube;
var light;
var plane;
function initCube() {
    var boxGeometry = new THREE.BoxGeometry(1, 1, 1);
    var boxMaterial = new THREE.MeshToonMaterial({ color: 0xffffff, specular: 0x000000, shininess: 0, shading: THREE.FlatShading });
    cube = new THREE.Mesh(boxGeometry, boxMaterial);
    cube
        .position
        .set(0, 1, 0);
    cube.castShadow = true;
    cube.receiveShadow = true;
    scene.add(cube);
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
    var planeMaterial = new THREE.MeshToonMaterial({ color: 0xFF3333, specular: 0x000000, shininess: 0, shading: THREE.FlatShading });
    plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane
        .position
        .set(0, -1, 0);
    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true;
    scene.add(plane);
}
function render() {
    //renderer.render(scene, camera);
    effect.render(scene, camera);
    requestAnimationFrame(render);
}
init();
render();
