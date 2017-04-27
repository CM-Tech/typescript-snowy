// <reference path="../../../typings/globals/three/index.d.ts" />
declare namespace THREE {
export class MeshToonMaterial extends THREE.MeshPhongMaterial {
constructor(parameters?: THREE.MeshPhongMaterialParameters);

color : THREE.Color; // diffuse
specular : THREE.Color;
shininess : number;
map : THREE.Texture;
lightMap : THREE.Texture;
lightMapIntensity : number;
aoMap : THREE.Texture;
aoMapIntensity : number;
emissive : THREE.Color;
emissiveIntensity : number;
emissiveMap : THREE.Texture;
bumpMap : THREE.Texture;
bumpScale : number;
normalMap : THREE.Texture;
normalScale : THREE.Vector2;
displacementMap : THREE.Texture;
displacementScale : number;
displacementBias : number;
specularMap : THREE.Texture;
alphaMap : THREE.Texture;
envMap : THREE.Texture;
combine : THREE.Combine;
reflectivity : number;
refractionRatio : number;
wireframe : boolean;
wireframeLinewidth : number;
wireframeLinecap : string;
wireframeLinejoin : string;
skinning : boolean;
morphTargets : boolean;
morphNormals : boolean;
/**
         * @deprecated
         */
metal : boolean;

setValues(parameters : THREE.MeshPhongMaterialParameters) : void;
}
}