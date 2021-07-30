
// The import statements look different as they are imported via CDNs here to ensure the Three.js library works properly with codepen.io
import {OrbitControls} from 'https://threejsfundamentals.org/threejs/resources/threejs/r122/examples/jsm/controls/OrbitControls.js';
import {GUI} from 'https://threejsfundamentals.org/threejs/../3rdparty/dat.gui.module.js';
import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/build/three.module.js';
// doesn't work
// import { MeshLine, MeshLineMaterial, MeshLineRaycast } from '../node_modules/three.meshline/src/THREE.MeshLine.js';

document.addEventListener("DOMContentLoaded", function(event) { 


// Constants
const octobong_radius_ = 1.;
const octobong_sides = 8;
const octobong_height_ = 2.;
const octobong_levels_ = 8;
const octobong_offset_ = 0.35 * Math.PI;

var octobong_height = octobong_height_;
var octobong_offset = octobong_offset_;
var octobong_levels = octobong_levels_;
var octobong_radius = octobong_radius_;
// Scene
const scene = new THREE.Scene();

const scene_div = document.getElementById("scene");
const svg = document.getElementById('svg');

// Camera
const camera = new THREE.PerspectiveCamera(60, scene_div.offsetWidth / scene_div.offsetHeight, 0.6, 1200);
///camera.position.x = -4*octobong_radius; // Set camera position
//camera.position.y = 5; // Set camera position

camera.position.x = 3; // Set camera position
camera.position.y = 3; // Set camera position
camera.position.z = 3;   ; // Set camera position

// Renderer
const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setClearColor("#233143"); // Set background colour
//renderer.setSize(600, 600 * scene_div.offsetHeight / scene_div.offsetWidth );
renderer.setSize(scene_div.offsetWidth, scene_div.offsetHeight);
document.getElementById('scene').appendChild(renderer.domElement); // Add renderer to HTML as a canvas element

// Make Canvas Responsive
window.addEventListener('resize', () => {
    renderer.setSize(scene_div.offsetWidth, scene_div.offsetHeight); // Update size
    camera.aspect = scene_div.offsetWidth / scene_div.offsetHeight; // Update aspect ratio
    camera.updateProjectionMatrix(); // Apply changes
})


// Top plate
class Autogeometry {
    constructor() {
        this.geometry = new THREE.BufferGeometry();
        this.vertices = [];
        this.rewind_mode = false;
        this.frozen = false;
    }
    
    rewind() {
        assert(this.frozen, "Call get_geometry() to freeze mesh before rewind()");
        this.rewind_mode = true;
        this.index = 0;
    }

    push_face_coords(v1, v2, v3) {
        if(!this.rewind_mode) {
            assert(!this.frozen, "Mesh is frozen after call to get_geometry. Use rewind() to update vertices.");
            this.vertices.push(v1[0]);
            this.vertices.push(v1[1]);
            this.vertices.push(v1[2]);

            this.vertices.push(v2[0]);
            this.vertices.push(v2[1]);
            this.vertices.push(v2[2]);

            this.vertices.push(v3[0]);
            this.vertices.push(v3[1]);
            this.vertices.push(v3[2]);
        } else { // rewind mode
            const positions = this.geometry.attributes.position.array;
            positions[this.index ++] = v1[0];
            positions[this.index ++] = v1[1];
            positions[this.index ++] = v1[2];
        
            positions[this.index ++] = v2[0];
            positions[this.index ++] = v2[1];
            positions[this.index ++] = v2[2];
    
            positions[this.index ++] = v3[0];
            positions[this.index ++] = v3[1];
            positions[this.index ++] = v3[2];
        }
    }

    request_update() {
        // cutoff after this.index
        this.geometry.computeVertexNormals();
        this.geometry.setDrawRange( 0, this.index / 3 );
        this.geometry.attributes.position.needsUpdate = true;
    }

    get_geometry() {
        this.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(this.vertices), 3));
        //this.geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(this.normals), 3));
        //this.geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(this.uvs), 2));

        // set the faces
        this.geometry.computeVertexNormals();
        this.frozen = true;

        return this.geometry;
    }

    get_mesh_and_register(material) {
        this.mesh = new THREE.Mesh(this.get_geometry(), material);
        scene.add(this.mesh);
        return this.mesh;
    }
}

function assert(condition, message) {
    if (!condition) {
        throw message || "Assertion failed";
    }
}

function get_ith_coords(i, level) {
    var coords = {};
    assert (level>=0 && level <= octobong_levels, "get_ith_coords: Level out of range: " + level);
    const offset = level * octobong_offset;
    const height = level * octobong_height / octobong_levels;
    i = i % octobong_sides;
    coords.x = octobong_radius * Math.cos(2*Math.PI * i/ octobong_sides + offset);
    coords.z = octobong_radius * Math.sin(2*Math.PI * i / octobong_sides + offset);
    coords.y = height;
    return [coords.x, coords.y, coords.z];
}

const bong_material = new THREE.MeshStandardMaterial({color: '#fff', metalness: 0.3});

// Define bong part geometries
const geometry_bottom = new Autogeometry();
const geometry_top = new Autogeometry();
const geometry_side = new Autogeometry();

function define_bong() {
    // Bottom plate
    for(var i=0; i<8; i++) {
        geometry_bottom.push_face_coords(
            [0,0,0], 
            get_ith_coords(i, 0), 
            get_ith_coords(i+1, 0));
    }
    
    // Top plate
    for(var i=0; i<8; i++) {
        geometry_top.push_face_coords(
            [0, octobong_height, 0], 
            get_ith_coords(i+1, octobong_levels),
            get_ith_coords(i, octobong_levels)
        );
    }
    
    // Mesh sides 
    for(var level=0; level<octobong_levels; level++) {
        for(var side=0; side<octobong_sides; side++) {
            geometry_side.push_face_coords(
                get_ith_coords(side, level),
                get_ith_coords(side, level+1),
                get_ith_coords(side+1, level+1)     
            );
            geometry_side.push_face_coords(
                get_ith_coords(side, level),
                get_ith_coords(side+1, level+1),
                get_ith_coords(side+1, level),
            );
        }
    }
    
    // Add edges
    //const geometry_side_wires = new THREE.EdgesGeometry( geometry_side.get_geometry() );
    //const bong_side_wires = new THREE.LineSegments(geometry_side_wires, new THREE.LineBasicMaterial( { 	color: 0xff0000 } ) );
    //scene.add(bong_side);
}

define_bong(); // define first with max levels, then adjust levels
const bong_bottom = geometry_bottom.get_mesh_and_register(bong_material);
const bong_top = geometry_top.get_mesh_and_register(bong_material);
const bong_side = geometry_side.get_mesh_and_register(bong_material);




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


  
var color = 0x00F0dd;
var intensity = 0.5;
var light = new THREE.AmbientLight(color, intensity);
scene.add(light);


var color = 0xffffff;
var intensity = 1.;
var light = new THREE.DirectionalLight(color, intensity);
light.position.set(10, 0, 0);
light.target.position.set(0, octobong_height/2, 0);
scene.add(light);
scene.add(light.target);
var helper = new THREE.DirectionalLightHelper(light);
scene.add(helper);


var color = 0xddddff;
var intensity = 0.5;
var light = new THREE.DirectionalLight(color, intensity);
light.position.set(0, 0, 10);
light.target.position.set(0, octobong_height/2, 0);
scene.add(light);
scene.add(light.target);
var helper = new THREE.DirectionalLightHelper(light);
scene.add(helper);


var color = 0xffdddd;
var intensity = 0.5;
var light = new THREE.DirectionalLight(color, intensity);
light.position.set(0, 0, -10);
light.target.position.set(0, octobong_height/2, 0);
scene.add(light);
scene.add(light.target);
var helper = new THREE.DirectionalLightHelper(light);
scene.add(helper);

/*
var color = 0xffccff;
var intensity = 0.5;
var light = new THREE.DirectionalLight(color, intensity);
light.position.set(0, 0, -10);
light.target.position.set(0, 0, 0);
scene.add(light);
scene.add(light.target);
var helper = new THREE.DirectionalLightHelper(light);
scene.add(helper);
*/

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

/*
const gui = new GUI();
gui.addColor(new ColorGUIHelper(light, 'color'), 'value').name('color');
gui.add(light, 'intensity', 0, 2, 0.01);
gui.add(light.target.position, 'x', -10, 10, .01);
gui.add(light.target.position, 'z', -10, 10, .01);
gui.add(light.target.position, 'y', 0, 10, .01);
*/


//Trackball Controls for Camera 
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, octobong_height/2, 0);
controls.update();

// axes helper
const axesHelper = new THREE.AxesHelper( 5 );
scene.add( axesHelper );


var pivot = new THREE.Group();
pivot.add( bong_side );
pivot.add( bong_top);
pivot.add( bong_bottom);
//pivot.add( bong_side_wires);
scene.add(pivot);
//side1.position.set( 0, ); // the negative of the group's center


// update positions
function update_bong() {

    // read parameters from sliders
    octobong_height = slider_height.value;
    octobong_radius = slider_radius.value;
    octobong_levels = slider_levels.value;
    octobong_offset = slider_offset.value;

    geometry_bottom.rewind();
    geometry_top.rewind();
    geometry_side.rewind();
    define_bong();
    geometry_bottom.request_update();
    geometry_top.request_update();
    geometry_side.request_update();
}

octobong_levels = 3;

// Slider
const slider_height = document.getElementById("slider_height");
const slider_offset = document.getElementById("slider_offset");
const slider_levels = document.getElementById("slider_levels");
const slider_radius = document.getElementById("slider_radius");

update_bong();


slider_height.addEventListener("input", function(e) {
    update_bong();
});
slider_offset.addEventListener("input", function(e) {
    update_bong();
});
slider_levels.addEventListener("input", function(e) {
    update_bong();
});
slider_radius.addEventListener("input", function(e) {
    update_bong();
});


// Rendering Function
var theta = 0;
const rendering = function() {
    // Rerender every time the page refreshes (pause when on another tab)
    requestAnimationFrame(rendering); 

    // Update trackball controls
    controls.update();

    theta += 0.005;


    // Constantly rotate box
    //scene.rotation.z += 0.005;
    //scene.rotation.x = Math.PI/2;
    pivot.rotation.y = theta;

    renderer.render(scene, camera);
}

rendering();


}); // document.ready