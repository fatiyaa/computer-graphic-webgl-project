"use strict";

var perspectiveExample = function () {
  var canvas;
  var gl;

  var numPositions = 36;

  var positionsArray = [];
  var colorsArray = [];

  var vertices = [
    vec4(-0.1, -0.1, 0.1, 1.0),
    vec4(-0.1, 0.1, 0.1, 1.0),
    vec4(0.1, 0.1, 0.1, 1.0),
    vec4(0.1, -0.1, 0.1, 1.0),
    vec4(-0.1, -0.1, -0.1, 1.0),
    vec4(-0.1, 0.1, -0.1, 1.0),
    vec4(0.1, 0.1, -0.1, 1.0),
    vec4(0.1, -0.1, -0.1, 1.0),
  ];

  var vertexColors = [
    vec4(0.0, 0.0, 0.0, 1.0), // black
    vec4(1.0, 0.0, 0.0, 1.0), // red
    vec4(1.0, 1.0, 0.0, 1.0), // yellow
    vec4(0.0, 1.0, 0.0, 1.0), // green
    vec4(0.0, 0.0, 1.0, 1.0), // blue
    vec4(1.0, 0.0, 1.0, 1.0), // magenta
    vec4(0.0, 1.0, 1.0, 1.0), // cyan
    vec4(1.0, 1.0, 1.0, 1.0), // white
  ];

  var near = 0.1;
  var far = 10.0;
  var radius = 2.0;
  var theta = 0.0;
  var phi = 0.0;
  var dr = (5.0 * Math.PI) / 180.0;

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

    gl = canvas.getContext("webgl2");
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

    // Add event listeners for buttons
    document.getElementById("startButton").onclick = startAnimation;
    document.getElementById("resetButton").onclick = resetAnimation;

    render();
  }

  // Variables for controlling cube movement based on GLBB
  var startPositionX = -0.7; // Initial position of the cube on the X axis
  var speed = 0; // Initial velocity
  var acceleration = 0; // Acceleration
  var timeStep = 0.005; // Time step in seconds
  var rightLimit = 1.0; // Right boundary (WebGL normalized space)
  var isMoving = false; // Movement status
  var time = 0; // Time tracker

  // Function to read input values for speed and acceleration
  function updateParameters() {
    var inputSpeed = parseFloat(document.getElementById("speedInput").value);
    var inputAcceleration = parseFloat(
      document.getElementById("accelerationInput").value
    );
    if (!isNaN(inputSpeed)) {
      speed = inputSpeed;
    }
    if (!isNaN(inputAcceleration)) {
      acceleration = inputAcceleration;
    }
  }

  function startAnimation() {
    isMoving = true;
    time = 0; // Reset time
    updateParameters(); // Ensure the parameters are set when the animation starts
  }

  function resetAnimation() {
    isMoving = false;
    startPositionX = -0.7; // Reset X position
    time = 0; // Reset time
  }

  function updateCubePosition() {
    if (isMoving) {
      // Update time
      time += timeStep;

      // Calculate new position based on GLBB formula
      startPositionX +=
        speed * timeStep + 0.5 * acceleration * Math.pow(time, 2);

      // Update velocity based on acceleration
      speed += acceleration * timeStep;

      // Stop the cube if it reaches the right boundary
      if (startPositionX >= rightLimit) {
        startPositionX = rightLimit;
        isMoving = false;
      }
    }

    // Create translation matrix for moving the cube
    var translationMatrix = translate(startPositionX, 0.0, 0.0); // Move in X axis
    return translationMatrix;
  }

  function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var translationMatrix = updateCubePosition();

    eye = vec3(
      radius * Math.sin(theta) * Math.cos(phi),
      radius * Math.sin(theta) * Math.sin(phi),
      radius * Math.cos(theta)
    );

    modelViewMatrix = mult(lookAt(eye, at, up), translationMatrix);
    projectionMatrix = perspective(fovy, aspect, near, far);

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    gl.drawArrays(gl.TRIANGLES, 0, numPositions);
    requestAnimationFrame(render);
  }

  init();
};
perspectiveExample();
