
// The import statements look different as they are imported via CDNs here to ensure the Three.js library works properly with codepen.io
import {OrbitControls} from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/controls/OrbitControls.js';
import {GUI} from 'https://threejsfundamentals.org/threejs/../3rdparty/dat.gui.module.js';
import { DDSLoader } from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/loaders/DDSLoader.js';


// Constants
const octobong_radius = 1.;
const octobong_sides = 8;
const octobong_height = 2.;
const octobong_levels = 3.;
const octobong_offset = 0.35 * Math.PI;

const loader = new DDSLoader();


// Scene
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(25, window.innerWidth / window.innerHeight, 0.6, 1200);
///camera.position.x = -4*octobong_radius; // Set camera position
//camera.position.y = 5; // Set camera position

camera.position.x = 10; // Set camera position
camera.position.y = 0; // Set camera position
camera.position.z = 10   ; // Set camera position

// Renderer
const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setClearColor("#233143"); // Set background colour
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement); // Add renderer to HTML as a canvas element

// Make Canvas Responsive
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight); // Update size
    camera.aspect = window.innerWidth / window.innerHeight; // Update aspect ratio
    camera.updateProjectionMatrix(); // Apply changes
})

// Create box:
const boxGeometry = new THREE.BoxGeometry(2, 2, 2); // Define geometry
var boxMaterial = new THREE.MeshBasicMaterial({color: 0x00FF00}); // Define material // Simple white box
//const boxMaterial = new THREE.MeshLambertMaterial({color: 0xFFFFFF}); // Define material // Simple white box
const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial); // Build box
boxMesh.rotation.set(40, 0, 40); // Set box initial rotation
//scene.add(boxMesh); // Add box to canvas

console.log(boxGeometry);

// Create other surfaces

// Octobong Base

// R




/*
var v1 = new THREE.Vector3(0,0,0);
var v2 = new THREE.Vector3(0,500,0);
var v3 = new THREE.Vector3(0,500,500);

geom.vertices.push(v1);
geom.vertices.push(v2);
geom.vertices.push(v3);

geom.faces.push( new THREE.Face3( 0, 1, 2 ) );
*/

function get_ith_coords(i, offset, height) {
    var coords = {};
    coords.x = octobong_radius * Math.cos(2*Math.PI * i/ octobong_sides + offset);
    coords.y = octobong_radius * Math.sin(2*Math.PI * i / octobong_sides + offset);
    coords.z = height;
    return new THREE.Vector3(coords.x, coords.y, coords.z);
}

// Bottom plate
var geom = new THREE.Geometry(); 
for(var i=0; i<8; i++) {
    var l = geom.vertices.length;
    geom.vertices.push(new THREE.Vector3(0,0,0));
    geom.vertices.push(get_ith_coords(i, 0, 0));
    geom.vertices.push(get_ith_coords(i+1, 0, 0));
    geom.faces.push( new THREE.Face3( l, l+2, l+1) );
}
geom.computeFaceNormals();

var boxMaterial = new THREE.MeshStandardMaterial({color: '#fff', metalness: 0.3});
var object = new THREE.Mesh( geom, boxMaterial );
scene.add(object);

// Top plate
var geom = new THREE.Geometry(); 
for(var i=0; i<8; i++) {
    var l = geom.vertices.length;
    geom.vertices.push(new THREE.Vector3(0,0,octobong_height));
    geom.vertices.push(get_ith_coords(i, octobong_offset*octobong_levels, octobong_height));
    geom.vertices.push(get_ith_coords(i+1, octobong_offset*octobong_levels, octobong_height));
    geom.faces.push( new THREE.Face3( l, l+1, l+2) );
}
var boxMaterial = new THREE.MeshStandardMaterial({color: '#fff', metalness: 0.3});
geom.computeFaceNormals();

//boxMaterial = new THREE.MeshPhongMaterial({color: '#CA8'}); // Define material // Simple white box
var object = new THREE.Mesh( geom, boxMaterial );
scene.add(object);


// Mesh sides
var geom = new THREE.Geometry(); 
var geom2 = new THREE.Geometry(); 
var level = 1;
for(var level=0; level<=octobong_levels; level++) {
    for(var side=0; side<octobong_sides; side++) {
        geom.vertices.push(get_ith_coords(side, octobong_offset*level, octobong_height / octobong_levels * level))
        geom2.vertices.push(get_ith_coords(side, octobong_offset*level, octobong_height / octobong_levels * level))
    }
}

for(var level=0; level<octobong_levels; level++) {
    for(var side=0; side<octobong_sides; side++) {
        // Side 1
        var i = level*octobong_sides+((side+0) % octobong_sides);
        var j = level*octobong_sides+((side+1) % octobong_sides);
        var I = (level+1)*octobong_sides+((side+0) % octobong_sides);
        var J = (level+1)*octobong_sides+((side+1) % octobong_sides);
        geom.faces.push(new THREE.Face3(i, J, I));
        geom2.faces.push(new THREE.Face3(i, j, J));
    }
}

const map3 = loader.load( '../assets/hepatica_dxt3_mip.dds' );
map3.anisotropy = 4;

//var boxMaterial = new THREE.MeshPhongMaterial({color: '#CA8'});
//var boxMaterial2 = new THREE.MeshPhongMaterial({color: '#CA8'});

var boxMaterial = new THREE.MeshStandardMaterial({color: '#fff', metalness: 0.3});
var boxMaterial2 = new THREE.MeshStandardMaterial({color: '#fff', metalness: 0.3});


//var boxMaterial = new THREE.MeshBasicMaterial( { map: map3, alphaTest: 0.5 } );
//var boxMaterial2 = new THREE.MeshBasicMaterial( { map: map3, alphaTest: 0.5 } );
////var boxMaterial = new THREE.MeshBasicMaterial({color: 0x00bc00}); // green Define material // Simple white box
//var boxMaterial2 = new THREE.MeshBasicMaterial({color: 0x0000bc}); // blue Define material // Simple white box
geom.computeFaceNormals();
geom2.computeFaceNormals();

var object = new THREE.Mesh( geom, boxMaterial );
var object2 = new THREE.Mesh( geom2, boxMaterial2 );
scene.add(object);
scene.add(object2);



// sphere
const sphereRadius = 3;
const sphereWidthDivisions = 32;
const sphereHeightDivisions = 16;
const sphereGeo = new THREE.SphereGeometry(sphereRadius, sphereWidthDivisions, sphereHeightDivisions);
const sphereMat = new THREE.MeshPhongMaterial({color: '#CA8'});
const mesh = new THREE.Mesh(sphereGeo, sphereMat);
mesh.position.set(-sphereRadius - 1, sphereRadius + 2, 0);
scene.add(mesh);


// light gui
class ColorGUIHelper {
    constructor(object, prop) {
      this.object = object;
      this.prop = prop;
    }
    get value() {
      return `#${this.object[this.prop].getHexString()}`;
    }
    set value(hexString) {
      this.object[this.prop].set(hexString);
    }
  }


  var color = 0x00FFFF;
  var intensity = 0.0;
  var light = new THREE.AmbientLight(color, intensity);
  scene.add(light);

  

var color = 0xffcccc;
var intensity = 0.5;
var light = new THREE.DirectionalLight(color, intensity);
light.position.set(0, 0, 10);
light.target.position.set(0, 0, 0);
scene.add(light);
scene.add(light.target);
var helper = new THREE.DirectionalLightHelper(light);
scene.add(helper);


var color = 0xffccff;
var intensity = 0.5;
var light = new THREE.DirectionalLight(color, intensity);
light.position.set(0, 0, -10);
light.target.position.set(0, 0, 0);
scene.add(light);
scene.add(light.target);
var helper = new THREE.DirectionalLightHelper(light);
scene.add(helper);


/*
var color = 0xccffcc;
var intensity = 0.1;
var light = new THREE.DirectionalLight(color, intensity);
light.position.set(10, 0, 5);
light.target.position.set(0, 0, 0);
scene.add(light);
scene.add(light.target);

var helper = new THREE.DirectionalLightHelper(light);
scene.add(helper);
*/
const gui = new GUI();
gui.addColor(new ColorGUIHelper(light, 'color'), 'value').name('color');
gui.add(light, 'intensity', 0, 2, 0.01);
gui.add(light.target.position, 'x', -10, 10, .01);
gui.add(light.target.position, 'z', -10, 10, .01);
gui.add(light.target.position, 'y', 0, 10, .01);



//Trackball Controls for Camera 
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.update();



// Rendering Function
var theta = 0;
const rendering = function() {
    // Rerender every time the page refreshes (pause when on another tab)
    requestAnimationFrame(rendering); 

    // Update trackball controls
    controls.update();

    theta += 0.01;
    light.position.x = 3*Math.cos(theta);
    light.position.y = 3*Math.sin(theta);
    light.position.z = -10;
    light.target.position.x = 10;
    light.target.position.y = 0;
    light.target.position.z = 0;  

    // Constantly rotate box
    scene.rotation.z += 0.005;
    scene.rotation.x = Math.PI/2;


    renderer.render(scene, camera);
}

rendering();
