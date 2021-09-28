
// The import statements look different as they are imported via CDNs here to ensure the Three.js library works properly with codepen.io
//import {OrbitControls} from 'https://threejsfundamentals.org/threejs/resources/threejs/r122/examples/jsm/controls/OrbitControls.js';
import * as THREE from './three.module.js';
import {OrbitControls} from './OrbitControls.js';
//import {GUI} from 'https://threejsfundamentals.org/threejs/../3rdparty/dat.gui.module.js';
//import {GUI} from './dat.gui.module.js';
//import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/build/three.module.js';
// doesn't work
// import { MeshLine, MeshLineMaterial, MeshLineRaycast } from '../node_modules/three.meshline/src/THREE.MeshLine.js';

document.addEventListener("DOMContentLoaded", function(event) { 

// Sliders & Labels for bong characteristics
// 1. Setters
const slider_radius = document.getElementById("slider_radius");
const label_radius = document.getElementById("label_radius");

const slider_sides = document.getElementById("slider_sides");
const label_sides = document.getElementById("label_sides");

const slider_offset = document.getElementById("slider_offset");
const label_offset = document.getElementById("label_offset");

const slider_levels = document.getElementById("slider_levels");
const label_levels = document.getElementById("label_levels");

const slider_post_overlap = document.getElementById("slider_post_overlap");
const label_post_overlap = document.getElementById("label_post_overlap");

const slider_pre_overlap = document.getElementById("slider_pre_overlap");
const label_pre_overlap = document.getElementById("label_pre_overlap");

const slider_flapsize = document.getElementById("slider_flapsize");
const label_flapsize = document.getElementById("label_flapsize");

const slider_flaptaper = document.getElementById("slider_flaptaper");
const label_flaptaper = document.getElementById("label_flaptaper");


// 2. Computed
const label_side_length = document.getElementById("label_side_length");
const label_bounding_box = document.getElementById("label_bounding_box");
const label_height = document.getElementById("label_height");
const label_small_diagonal = document.getElementById("label_small_diagonal");
const label_large_diagonal = document.getElementById("label_large_diagonal");

// Sliders & Labels for bong state
// 1. Setters
const slider_current_offset = document.getElementById("slider_current_offset");
const label_current_offset = document.getElementById("label_current_offset");
// 2. Computed
const label_current_height = document.getElementById("label_current_height");
const label_current_small_diagonal = document.getElementById("label_current_small_diagonal");
const label_current_large_diagonal = document.getElementById("label_current_large_diagonal");


// Constants -> set to max first (to get all vertices)
var octobong_radius = parseFloat(slider_radius.value);
var octobong_sides = 16; //Math.floor(slider_sides.value);
var octobong_offset = parseFloat(slider_offset.value) * 180 / Math.PI;
var octobong_levels = 5; //Math.floor(slider_levels.value);
var octobong_post_overlap = parseFloat(slider_post_overlap.value);
var octobong_pre_overlap = parseFloat(slider_pre_overlap.value);
var octobong_flapsize = parseFloat(slider_flapsize);
var octobong_flaptaper = parseFloat(slider_flaptaper);
var current_offset = parseFloat(slider_current_offset.value) * 180 / Math.PI;


// recomputed by recompute_bong:
var flapsize_absolute;

var octobong_small_diag;
var octobong_large_diag; 
var octobong_side; 
var octobong_height;

// live state
var current_small_diag;
var current_large_diag;
var current_height;
var stretch_height;

recompute_bong_measures();

// Scene
const scene = new THREE.Scene();

const scene_div = document.getElementById("scene");
const svg = document.getElementById('blueprint');

// Camera
const camera = new THREE.PerspectiveCamera(60, scene_div.offsetWidth / scene_div.offsetHeight, 0.6, 1200);
///camera.position.x = -4*octobong_radius; // Set camera position
//camera.position.y = 5; // Set camera position

camera.position.x = 3; // Set camera position
camera.position.y = 3; // Set camera position
camera.position.z = 3;   ; // Set camera position

// Renderer
const renderer = new THREE.WebGLRenderer({antialias: true});

const valid_render_bg = "#233143";
const invalid_render_bg = "#ff7777";
renderer.setClearColor(valid_render_bg); // Set background colour
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
    const offset = level * current_offset;
    const height = level * current_height / octobong_levels;
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
            [0, current_height, 0], 
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
function recompute_bong_measures() {
    // characteristics
    octobong_small_diag = 2*octobong_radius*Math.sin(octobong_offset/2);
    octobong_large_diag = 2*octobong_radius*Math.sin(octobong_offset/2 + Math.PI/octobong_sides);
    var wrong_old_octobong_side = 2*Math.PI/octobong_sides*octobong_radius;
    octobong_side = 2*octobong_radius*Math.sin(Math.PI/octobong_sides);
    var wrong_old_octobong_height = octobong_levels * (octobong_large_diag**2+ octobong_side**2-octobong_small_diag**2) / (2*octobong_side);
    octobong_height = octobong_levels * Math.sqrt(octobong_small_diag**2-(octobong_large_diag**2-octobong_small_diag**2-octobong_side**2)**2 / (2*octobong_side)**2 )

    // live state
    current_small_diag = 2*octobong_radius*Math.sin(current_offset/2); // projected horizontally
    current_large_diag = 2*octobong_radius*Math.sin(current_offset/2 + Math.PI/octobong_sides); // projected horizontally
    current_height = octobong_levels * 2*octobong_radius*Math.sqrt(Math.sin(octobong_offset/2+Math.PI/octobong_sides)**2
        -Math.sin(current_offset/2+Math.PI/octobong_sides)**2);
    stretch_height = octobong_levels*2*octobong_radius*Math.sqrt(Math.sin(octobong_offset/2)**2
        -Math.sin(current_offset/2)**2);

    flapsize_absolute = octobong_flapsize*octobong_height/octobong_levels;

}

// update positions
function update_bong() {

    audio.play();

    document.getElementById("header").classList.add("glow");

    // bong parameters (fixed for a given bong)
    // characteristics
    octobong_radius = parseFloat(slider_radius.value);
    octobong_offset = parseFloat(slider_offset.value) / 180 * Math.PI;
    octobong_sides = parseInt(slider_sides.value);
    octobong_levels = parseInt(slider_levels.value);
    octobong_post_overlap = parseFloat(slider_post_overlap.value);
    octobong_pre_overlap = parseFloat(slider_pre_overlap.value);
    octobong_flapsize = parseFloat(slider_flapsize.value);
    octobong_flaptaper = parseFloat(slider_flaptaper.value);
    // state
    current_offset = parseFloat(slider_current_offset.value) / 180 * Math.PI;

    recompute_bong_measures();
    draw_flat_bong();

    // display warning if current_height < current_stretch_height
    if(current_height > stretch_height || current_offset > octobong_offset) {
        renderer.setClearColor(invalid_render_bg); // Set background colour
    } else {
        renderer.setClearColor(valid_render_bg); // Set background colour
    }


    // patch labels
    label_radius.innerHTML = "Radius: " + (octobong_radius * 100).toFixed(0) + "mm";
    label_sides.innerHTML = "Sides: " + octobong_sides+ " sides";
    label_levels.innerHTML = "Levels: " + octobong_levels + " levels";
    label_post_overlap.innerHTML = "Post Overlap: " + (octobong_post_overlap*100).toFixed(0) + "%";
    label_pre_overlap.innerHTML = "Pre Overlap: " + (octobong_pre_overlap*100).toFixed(0) + "%";
    label_flapsize.innerHTML = "Flap Size: " + (octobong_flapsize*100).toFixed(0) + "% (" + (flapsize_absolute*100).toFixed(0) + " mm)";
    label_flaptaper.innerHTML = "Flap Taper: " + (octobong_flaptaper*100).toFixed(0) + "%";
    label_offset.innerHTML = "Flat Offset: " + (octobong_offset*180/Math.PI).toFixed(0) + "°";
    label_bounding_box.innerHTML = "Bounding Box (8sides): " + (octobong_side * 100 * (1. + Math.sqrt(2))).toFixed(0) + "mm";
    label_side_length.innerHTML = "Side Length: " + (octobong_side * 100).toFixed(0) + "mm";
    label_height.innerHTML = "Flat Height: " + (octobong_height * 100).toFixed(0) + "mm";
    label_diagonals.innerHTML = "Small/Large Diagonal: " + (octobong_small_diag * 100).toFixed(0) + " / "+ (octobong_large_diag * 100).toFixed(0) + "mm";
    label_current_offset.innerHTML = "Current Offset: " + (current_offset * 180 / Math.PI).toFixed(0) + "°";
    label_current_height.innerHTML = "Current Height: " + (current_height * 100).toFixed(0) + "mm";
    label_stretch_height.innerHTML = "Stretch Height: " + (stretch_height * 100).toFixed(0) + "mm";
    label_current_diagonals.innerHTML = "Projected Small/Large Diagonal: " + (current_small_diag * 100).toFixed(0) + " / "+ (current_large_diag * 100).toFixed(0) + "mm";


    geometry_bottom.rewind();
    geometry_top.rewind();
    geometry_side.rewind();
    define_bong();
    geometry_bottom.request_update();
    geometry_top.request_update();
    geometry_side.request_update();
}

function draw_line(x1, y1, x2, y2, stroke, unit, multiplier) {
    stroke = stroke || "black";
    unit = unit || "";
    multiplier = multiplier || 1;
    var newLine = document.createElementNS('http://www.w3.org/2000/svg','line');
    newLine.setAttribute('x1',multiplier*x1+unit);
    newLine.setAttribute('y1',multiplier*y1+unit);
    newLine.setAttribute('x2',multiplier*x2+unit);
    newLine.setAttribute('y2',multiplier*y2+unit);
    newLine.setAttribute("stroke", stroke);
    svg.append(newLine);
    console.log("Drew: x1:" + x1 + " y1:" + y1 + " x2:" + x2 + " y2" + y2);
}
var GLOBAL_X=0;
var GLOBAL_Y=0;
function score(x1, y1, x2, y2) {
    // assume 72 DPI (Illustrator style)
    return draw_line(GLOBAL_X+x1, GLOBAL_Y+y1, GLOBAL_X+x2, GLOBAL_Y+y2, "black", "", 100*2.83465);
}
function cut (x1, y1, x2, y2) {
    // assume 72 DPI (Illustrator style)
    return draw_line(GLOBAL_X+x1, GLOBAL_Y+y1, GLOBAL_X+x2, GLOBAL_Y+y2 , "red", "", 100*2.83465);
}
function draw_flat_bong() {
    svg.innerHTML = "";
    const bbox = svg.getBoundingClientRect();
    const h = bbox.height;
    const w = bbox.width;

    const level_height = octobong_height / octobong_levels;
    const delta = (octobong_large_diag**2-octobong_small_diag**2-octobong_side**2) / (2*octobong_side);

    // shift bong w.r.t. flap sizes
    GLOBAL_X = (0.1+octobong_pre_overlap)*octobong_side;
    GLOBAL_Y = (0.1+octobong_flapsize)*octobong_height/octobong_levels;


    for(var level=0; level<=octobong_levels; level++) {
        // Draw horizontal lines first - extend into side flaps except first and last
        if(level==0 || level==octobong_levels) {
            cut(
                level*delta-octobong_pre_overlap*octobong_side,
                level*level_height,
                level*delta,
                level*level_height);             
            score(
                level*delta,
                level*level_height,
                level*delta+octobong_side*(octobong_sides),
                level*level_height); 
            cut(
                level*delta+octobong_side*(octobong_sides),
                level*level_height,
                level*delta+octobong_side*(octobong_sides+octobong_post_overlap),
                level*level_height)
        } else {
            score(
                level*delta-octobong_pre_overlap*octobong_side,
                level*level_height,
                level*delta+octobong_side*(octobong_sides+octobong_post_overlap),
                level*level_height); 
        }

    }

    for(var side=0; side<=octobong_sides; side++) {
        // small diagonal
        score(
            side*octobong_side,
            0,
            delta*octobong_levels+(side)*octobong_side,
            octobong_levels*level_height,
            "black",
            "",
            100*2.83465);

    }
    // one extra small-diagonal (pre flap)
    cut(
        (-octobong_pre_overlap)*octobong_side,
        0,
        delta*octobong_levels+(-octobong_pre_overlap)*octobong_side,
        octobong_levels*level_height,
        "red",
        "",
        100*2.83465);
    // one extra small-diagonal (post flap)
    cut(
        (octobong_sides+octobong_post_overlap)*octobong_side,
        0,
        delta*octobong_levels+(octobong_sides+octobong_post_overlap)*octobong_side,
        octobong_levels*level_height,
        "red",
        "",
        100*2.83465);

    for(var side=-octobong_levels; side<=octobong_sides; side++) {
        var x1_ = side*octobong_side;
        var y1_ = 0;
        var x2_ = delta*octobong_levels+(side+octobong_levels)*octobong_side;
        var y2_ = octobong_levels*level_height;

        // trim lines after post flap
        var k_post = Math.min(octobong_sides-side+octobong_post_overlap, octobong_levels)/octobong_levels;
        var x2 = x1_+(x2_-x1_)*k_post;
        var y2 = y1_+(y2_-y1_)*k_post;

        // trim lines before pre flap
        var k_pre = Math.min(side + octobong_levels + octobong_pre_overlap, octobong_levels) / octobong_levels;
        var x1 = x2_ + (x1_-x2_)*k_pre;
        var y1 = y2_ + (y1_-y2_)*k_pre;

        // large diagonal
        score(
            x1,
            y1,
            x2,
            y2,
            "black",
            "",
            100*2.83465);
        
    }

    // Draw flaps
    for(var side=0; side<octobong_sides; side++) {
        // top flaps
        cut(// left
            side*octobong_side,
            0,
            (side+(1-octobong_flaptaper)/2)*octobong_side,
            -octobong_flapsize*octobong_height/octobong_levels);      
        cut(//mid
            (side+(1-octobong_flaptaper)/2)*octobong_side,
            -octobong_flapsize*octobong_height/octobong_levels,
            (side+1-(1-octobong_flaptaper)/2)*octobong_side,
            -octobong_flapsize*octobong_height/octobong_levels);
        cut(//right
            (side+1-(1-octobong_flaptaper)/2)*octobong_side,
            -octobong_flapsize*octobong_height/octobong_levels,
            (side+1)*octobong_side,
            0
        )
    

        // bottom flaps
        cut(// left
            delta*octobong_levels+side*octobong_side,
            octobong_height,
            delta*octobong_levels+(side+(1-octobong_flaptaper)/2)*octobong_side,
            octobong_height+octobong_flapsize*octobong_height/octobong_levels);      
        cut(//mid
            delta*octobong_levels+(side+(1-octobong_flaptaper)/2)*octobong_side,
            octobong_height+octobong_flapsize*octobong_height/octobong_levels,
            delta*octobong_levels+(side+1-(1-octobong_flaptaper)/2)*octobong_side,
            octobong_height+octobong_flapsize*octobong_height/octobong_levels);
        cut(//right
            delta*octobong_levels+(side+1-(1-octobong_flaptaper)/2)*octobong_side,
            octobong_height+octobong_flapsize*octobong_height/octobong_levels,
            delta*octobong_levels+(side+1)*octobong_side,
            octobong_height
        )
        }
}



function download_svg() {
    //get svg source.
    var svgData = svg.outerHTML;
    var svgBlob = new Blob([svgData], {type:"image/svg+xml;charset=utf-8"});
    var svgUrl = URL.createObjectURL(svgBlob);
    var downloadLink = document.createElement("a");
    downloadLink.href = svgUrl;
    downloadLink.download = "octobong_blueprint.svg";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

document.getElementById("blueprint_link").addEventListener("click", 
    function (event) {
        event.preventDefault();

        // generate name
        var name = "blueprint_" 
        + (octobong_radius*100).toFixed(0) + "mm_" 
        + octobong_sides + "sides_" 
        + octobong_levels + "levels_" 
        + (octobong_offset*180/Math.PI).toFixed(0) + "deg_"
        + (flapsize_absolute*100).toFixed(0) + "flapmm_"
        + (octobong_flaptaper*100).toFixed(0) + "flaptaper";

        svgExport.downloadSvg(
            document.getElementById("blueprint"), // SVG DOM Element object to be exported. Alternatively, a string of the serialized SVG can be passed
            name, // chart title: file name of exported image
            { useCSS: false, width: 1728, height: 864, originalWidth: 1728, originalHeight: 864} // options (optional, please see below for a list of option properties)
          );
}, 
false);



draw_flat_bong();




// back to default (instead of max, which was necessary to create enough vertices)
octobong_levels = 3;
update_bong();


slider_radius.addEventListener("input", function(e) {
    update_bong();
});
slider_sides.addEventListener("input", function(e) {
    update_bong();
});
slider_levels.addEventListener("input", function(e) {
    update_bong();
});
slider_offset.addEventListener("input", function(e) {
    update_bong();
});
slider_current_offset.addEventListener("input", function(e) {
    update_bong();
});
slider_post_overlap.addEventListener("input", function(e) {
    update_bong();
});
slider_pre_overlap.addEventListener("input", function(e) {
    update_bong();
});

slider_flapsize.addEventListener("input", function(e) {
    update_bong();
});
slider_flaptaper.addEventListener("input", function(e) {
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

