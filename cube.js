"use strict";

var perspectiveExample = function(){
var canvas;
var gl;

var numPositions  = 36;

var positionsArray = [];
var colorsArray = [];

var vertices = [
    vec4(-0.1, -0.1,  0.1, 1.0),
    vec4(-0.1,  0.1,  0.1, 1.0),
    vec4(0.1,  0.1,  0.1, 1.0),
    vec4(0.1, -0.1,  0.1, 1.0),
    vec4(-0.1, -0.1, 0.1, 1.0),
    vec4(-0.1,  0.1, 0.1, 1.0),
    vec4(0.1,  0.1, 0.1, 1.0),
    vec4(0.1, -0.1, 0.1, 1.0)
];

var vertexColors = [
    vec4(0.0, 0.0, 0.0, 1.0),  // black
    vec4(1.0, 0.0, 0.0, 1.0),  // red
    vec4(1.0, 1.0, 0.0, 1.0),  // yellow
    vec4(0.0, 1.0, 0.0, 1.0),  // green
    vec4(0.0, 0.0, 1.0, 1.0),  // blue
    vec4(1.0, 0.0, 1.0, 1.0),  // magenta
    vec4(0.0, 1.0, 1.0, 1.0),  // cyan
    vec4(1.0, 1.0, 1.0, 1.0),  // white
];


var near = 0.1;
var far = 10.0;
var radius = 2.0;
var theta = 0.0;
var phi = 0.0;
var dr = 5.0 * Math.PI/180.0;

var  fovy = 45.0;  // Field-of-view in Y direction angle (in degrees)
var  aspect;       // Viewport aspect ratio

var modelViewMatrixLoc, projectionMatrixLoc;
var modelViewMatrix, projectionMatrix;
var eye;
const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);

function quad(a, b, c, d) {
     positionsArray.push(vertices[a]);
     colorsArray.push(vertexColors[a]);
     positionsArray.push(vertices[b]);
     colorsArray.push(vertexColors[a]);
     positionsArray.push(vertices[c]);
     colorsArray.push(vertexColors[a]);
     positionsArray.push(vertices[a]);
     colorsArray.push(vertexColors[a]);
     positionsArray.push(vertices[c]);
     colorsArray.push(vertexColors[a]);
     positionsArray.push(vertices[d]);
     colorsArray.push(vertexColors[a]);
}

init();

function colorCube()
{
    quad(1, 0, 3, 2);
    quad(2, 3, 7, 6);
    quad(3, 0, 4, 7);
    quad(6, 5, 1, 2);
    quad(4, 5, 6, 7);
    quad(5, 4, 0, 1);
}

// Sesuaikan dengan devicePixelRatio untuk resolusi yang lebih tajam
function init() {
    
    canvas = document.getElementById("gl-canvas");
    
    // Ambil ukuran canvas dari HTML
    var realWidth = canvas.clientWidth;
    var realHeight = canvas.clientHeight;
    var pixelRatio = window.devicePixelRatio || 1;
    canvas.width = realWidth * pixelRatio;
    canvas.height = realHeight * pixelRatio;

    gl = canvas.getContext('webgl2');
    if (!gl) alert("WebGL 2.0 isn't available" );

    gl.viewport(0, 0, canvas.width, canvas.height);

    aspect =  canvas.width/canvas.height;

    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    gl.enable(gl.DEPTH_TEST);


    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    colorCube();

    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW);

    var colorLoc = gl.getAttribLocation(program, "aColor");
    gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLoc);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positionsArray), gl.STATIC_DRAW);

    var positionLoc = gl.getAttribLocation(program, "aPosition");
    gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);

    modelViewMatrixLoc = gl.getUniformLocation(program, "uModelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "uProjectionMatrix");

// buttons for viewing parameters

    // document.getElementById("Button1").onclick = function(){near  *= 1.1; far *= 1.1;};
    // document.getElementById("Button2").onclick = function(){near *= 0.9; far *= 0.9;};
    // document.getElementById("Button3").onclick = function(){radius *= 2.0;};
    // document.getElementById("Button4").onclick = function(){radius *= 0.5;};
    // document.getElementById("Button5").onclick = function(){theta += dr;};
    // document.getElementById("Button6").onclick = function(){theta -= dr;};
    // document.getElementById("Button7").onclick = function(){phi += dr;};
    // document.getElementById("Button8").onclick = function(){phi -= dr;};

    render();
}

var startPositionYInPixels = 50;  // Posisi awal dari atas dalam piksel
var startPositionXInPixels = 10;  // Posisi awal di sebelah kiri dalam piksel
var speedInPixels = 10;           // Kecepatan perpindahan ke bawah dalam piksel
var bottomLimitInPixels = 1000;   // Batas bawah dalam piksel

function updateCubePosition() {
    // Pastikan canvas sudah terisi
    var canvasHeight = canvas.height;
    var canvasWidth = canvas.width;

    // Konversi posisi dari piksel ke koordinat normal WebGL (-1 hingga 1)
    var startPositionY = 2 * (canvasHeight - startPositionYInPixels) / canvasHeight - 1;
    var startPositionX = 2 * startPositionXInPixels / canvasWidth - 1.75;  // Konversi posisi X dengan benar

    // Konversi batas bawah dari piksel ke koordinat normal WebGL
    var bottomLimit = 2 * (canvasHeight - bottomLimitInPixels) / canvasHeight - 1;

    // Periksa apakah cube sudah mencapai batas bawah
    if (startPositionY > bottomLimit) {
        // Perbarui posisi untuk memindahkan cube ke bawah dalam satuan piksel
        startPositionYInPixels += speedInPixels;
    }

    // Buat matriks translasi untuk memindahkan cube
    var translationMatrix = translate(startPositionX, startPositionY, 0.0);

    // Kembalikan matriks translasi untuk digunakan di fungsi render
    return translationMatrix;
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Panggil fungsi untuk memperbarui posisi cube
    var translationMatrix = updateCubePosition();

    eye = vec3(radius * Math.sin(theta) * Math.cos(phi),
               radius * Math.sin(theta) * Math.sin(phi),
               radius * Math.cos(theta));

    // Terapkan translasi pada matriks pandangan-model
    modelViewMatrix = mult(lookAt(eye, at, up), translationMatrix);
    projectionMatrix = perspective(fovy, aspect, near, far);

    // Kirim matriks ke shader
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    // Gambar cube
    gl.drawArrays(gl.TRIANGLES, 0, numPositions);
    requestAnimationFrame(render);
}

}
perspectiveExample();
