
// The import statements look different as they are imported via CDNs here to ensure the Three.js library works properly with codepen.io
import {OrbitControls} from 'https://threejsfundamentals.org/threejs/resources/threejs/r122/examples/jsm/controls/OrbitControls.js';
import {GUI} from 'https://threejsfundamentals.org/threejs/../3rdparty/dat.gui.module.js';
import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/build/three.module.js';
// doesn't work
// import { MeshLine, MeshLineMaterial, MeshLineRaycast } from '../node_modules/three.meshline/src/THREE.MeshLine.js';

document.addEventListener("DOMContentLoaded", function(event) { 

// Sliders
const slider_height = document.getElementById("slider_height");
const slider_offset = document.getElementById("slider_offset");
const slider_levels = document.getElementById("slider_levels");
const slider_radius = document.getElementById("slider_radius");

const label_height = document.getElementById("label_height");
const label_offset = document.getElementById("label_offset");
const label_levels = document.getElementById("label_levels");
const label_radius = document.getElementById("label_radius");

// Constants -> set to max first (to get all vertices)
var octobong_height = slider_height.value;
var octobong_offset = slider_offset.value;
var octobong_levels = 5; //Math.floor(slider_levels.value);
var octobong_radius = slider_radius.value;
var octobong_sides = 16; //Math.floor(slider_sides.value);

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
    for(var i=0; i<octobong_sides; i++) {
        geometry_bottom.push_face_coords(
            [0,0,0], 
            get_ith_coords(i, 0), 
            get_ith_coords(i+1, 0));
    }
    
    // Top plate
    for(var i=0; i<octobong_sides; i++) {
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
//scene.add(helper);


var color = 0xddddff;
var intensity = 0.5;
var light = new THREE.DirectionalLight(color, intensity);
light.position.set(0, 0, 10);
light.target.position.set(0, octobong_height/2, 0);
scene.add(light);
scene.add(light.target);
var helper = new THREE.DirectionalLightHelper(light);
//scene.add(helper);


var color = 0xffdddd;
var intensity = 0.5;
var light = new THREE.DirectionalLight(color, intensity);
light.position.set(0, 0, -10);
light.target.position.set(0, octobong_height/2, 0);
scene.add(light);
scene.add(light.target);
var helper = new THREE.DirectionalLightHelper(light);


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


var audio = new Audio('mp3/nine-lives-unicorn-heads.mp3');

// update positions
function update_bong() {

    audio.play();

    document.getElementById("header").classList.add("glow");

    // read parameters from sliders
    octobong_height = slider_height.value;
    octobong_radius = slider_radius.value;
    octobong_levels = slider_levels.value;
    octobong_offset = slider_offset.value;
    octobong_sides = slider_sides.value;

    // patch labels
    label_height.innerHTML = "Height: " + (octobong_height * 100).toFixed(0) + "mm";
    label_radius.innerHTML = "Radius: " + (octobong_radius * 100).toFixed(0) + "mm";
    label_offset.innerHTML = "Offset: " + (octobong_offset * 180 / Math.PI).toFixed(0) + "°";
    label_levels.innerHTML = "Levels: " + octobong_levels + " levels";
    label_sides.innerHTML = "Sides: " + octobong_sides+ " sides";

    geometry_bottom.rewind();
    geometry_top.rewind();
    geometry_side.rewind();
    define_bong();
    geometry_bottom.request_update();
    geometry_top.request_update();
    geometry_side.request_update();
}

function draw_line(x1, y1, x2, y2, stroke) {
    stroke = stroke || "black";
    var newLine = document.createElementNS('http://www.w3.org/2000/svg','line');
    newLine.setAttribute('x1',x1);
    newLine.setAttribute('y1',y1);
    newLine.setAttribute('x2',x2);
    newLine.setAttribute('y2',y2);
    newLine.setAttribute("stroke", "black");
    svg.append(newLine);
}
function draw_flat_bong() {
    const bbox = svg.getBoundingClientRect();
    const h = bbox.height;
    const w = bbox.width;
    for(var i=0;i<10;i++){
        draw_line(i*h/10, 0, i*h/10, h);
        draw_line(0, i*h/10, h, i*h/10);
    }
}
draw_flat_bong();



octobong_levels = 3;
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
slider_sides.addEventListener("input", function(e) {
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

renderer.setSize(scene_div.offsetWidth, scene_div.offsetHeight);


}); // document.ready