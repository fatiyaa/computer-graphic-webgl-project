"use strict";

var perspectiveExample = function() {
    var canvas;
    var gl;

    var numPositions = 36;

    var positionsArray = [];
    var colorsArray = [];

    var vertices = [
        vec4(-0.1, -0.1,  0.1, 1.0),
        vec4(-0.1,  0.1,  0.1, 1.0),
        vec4(0.1,  0.1,  0.1, 1.0),
        vec4(0.1, -0.1,  0.1, 1.0),
        vec4(-0.1, -0.1, -0.1, 1.0),
        vec4(-0.1,  0.1, -0.1, 1.0),
        vec4(0.1,  0.1, -0.1, 1.0),
        vec4(0.1, -0.1, -0.1, 1.0)
    ];

    var vertexColors = [
        vec4(0.0, 0.0, 0.0, 1.0),  // black
        vec4(1.0, 0.0, 0.0, 1.0),  // red
        vec4(1.0, 1.0, 0.0, 1.0),  // yellow
        vec4(0.0, 1.0, 0.0, 1.0),  // green
        vec4(0.0, 0.0, 1.0, 1.0),  // blue
        vec4(1.0, 0.0, 1.0, 1.0),  // magenta
        vec4(0.0, 1.0, 1.0, 1.0),  // cyan
        vec4(1.0, 1.0, 1.0, 1.0)   // white
    ];

    var near = 0.1;
    var far = 10.0;
    var radius = 2.0;
    var theta = 0.0;
    var phi = 0.0;
    var dr = 5.0 * Math.PI / 180.0;

    var fovy = 45.0;
    var aspect;

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

    function colorCube() {
        quad(1, 0, 3, 2);
        quad(2, 3, 7, 6);
        quad(3, 0, 4, 7);
        quad(6, 5, 1, 2);
        quad(4, 5, 6, 7);
        quad(5, 4, 0, 1);
    }

    function init() {
        canvas = document.getElementById("gl-canvas");

        var realWidth = canvas.clientWidth;
        var realHeight = canvas.clientHeight;
        var pixelRatio = window.devicePixelRatio || 1;
        canvas.width = realWidth * pixelRatio;
        canvas.height = realHeight * pixelRatio;

        gl = canvas.getContext('webgl2');
        if (!gl) alert("WebGL 2.0 isn't available");

        gl.viewport(0, 0, canvas.width, canvas.height);
        aspect = canvas.width / canvas.height;

        gl.clearColor(1.0, 1.0, 1.0, 1.0);
        gl.enable(gl.DEPTH_TEST);

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

        // Tambahkan event listener untuk tombol
        document.getElementById("startButton").onclick = startAnimation;
        document.getElementById("resetButton").onclick = resetAnimation;

        render();
    }

    // Variabel untuk mengatur posisi awal dan kecepatan kubus
    var startPositionX = -0.7;    // Posisi awal kubus di sumbu X
    var startPositionY = 0.65;    // Posisi awal kubus di sumbu Y
    var speed = 0;               // Kecepatan awal kubus
    var gravity = -9.8;          // Percepatan gravitasi (m/s^2), negatif karena arah jatuh
    var timeStep = 0.005;         // Langkah waktu dalam detik
    var bottomLimit = -0.65;      // Batas bawah dalam koordinat WebGL (y = -1)
    var isFalling = false;       // Status apakah kubus sedang jatuh

    function startAnimation() {
        isFalling = true;  // Set status jatuh ke true
        speed = 0;         // Reset kecepatan saat mulai
    }

    function resetAnimation() {
        isFalling = false;  // Set status jatuh ke false
        startPositionY = 0.65; // Reset posisi Y ke atas
        speed = 0;           // Reset kecepatan
    }

    function updateCubePosition() {
        if (isFalling) {
            // Perbarui kecepatan berdasarkan gravitasi
            speed += gravity * timeStep;

            // Perbarui posisi Y berdasarkan kecepatan
            startPositionY += speed * timeStep;

            // Periksa apakah kubus sudah mencapai batas bawah
            if (startPositionY <= bottomLimit) {
                // Set posisi di batas bawah dan hentikan pergerakan
                startPositionY = bottomLimit;
                speed = 0;
                isFalling = false; // Hentikan pergerakan
            }
        }

        // Buat matriks translasi untuk memindahkan kubus
        var translationMatrix = translate(startPositionX, startPositionY, 0.0);  // Memindahkan di sumbu X dan Y
        return translationMatrix;
    }

    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Panggil fungsi untuk memperbarui posisi kubus
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

        // Gambar kubus
        gl.drawArrays(gl.TRIANGLES, 0, numPositions);
        requestAnimationFrame(render);
    }

    init();
}
perspectiveExample();
