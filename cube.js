"use strict";

var perspectiveExample = function () {
  var canvas;
  var gl;

  var numPositions = 36;

  var positionsArray = [];
  var colorsArray = [];

  var vertices = [
    vec4(-0.1, -0.1, 0.1, 1.0), // Vertex bottom
    vec4(-0.1, 0.1, 0.1, 1.0),  // Vertex top
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
    document.getElementById("parabola").onclick = resetParabola;
    document.getElementById("startParabola").onclick = startParabola;
    document.getElementById("resetParabola").onclick = resetParabola;

    document.getElementById("freeFall").onclick = resetFreeFall;
    document.getElementById("startFreeFall").onclick = startFreeFall;
    document.getElementById("resetFreeFall").onclick = resetFreeFall;

    document.getElementById("circular").onclick = resetCircular;
    document.getElementById("startCircular").onclick = startCircular;
    document.getElementById("resetCircular").onclick = resetCircular;

    render();
  }

  // Variables for controlling cube movement based on GLBB
  var startPositionX = -1.75; // Adjust to start near the left
  var startPositionY = -0.65; // Cube bottom touches canvas bottom
  var speed = 0; // Initial velocity
  var speedX = 0; // Velocity in X direction
  var speedY = 0; // Velocity in Y direction
  var launchAngle = 45; // Launch angle (θ)
  var gravity = -9.8; // Gravity in Y direction
  var accelerationX = 0; // Acceleration in X direction
  var timeStep = 0.005; // Time step in seconds
  var rightLimit = 2.5; // Right boundary near the right edge
  var leftLimit = -2.5; // Left boundary for wrapping
  var groundLevel = -0.65; // Ground level adjusted to align with cube's bottom
  var angularPosition = 0; // Current angular position in radians
  var angularVelocity = 0; // Initial angular velocity
  var angularAcceleration = 0; // Angular acceleration in radians per second squared
  var radiusCircular = 0.01; // Radius of the circular path
  var isMovingParabola = false, isMovingFreeFall = false, isMovingCircular = false; // Movement status
  var time = 0; // Time tracker

  // Function to read input values for speed and acceleration
  function updateParameters() {
    var inputSpeed = parseFloat(document.getElementById("speedInput").value);
    var inputSpeedY = parseFloat(document.getElementById("speedYInput").value);
    var inputAccelerationX = parseFloat(
      document.getElementById("accelerationInput").value
    );
    var inputLaunchAngle = parseFloat(document.getElementById("angleInput").value);
    var inputGravity = parseFloat(document.getElementById("gravityInput").value);
    var inputAngVel = parseFloat(document.getElementById("angularVelInput").value);
    var inputAngAccel = parseFloat(document.getElementById("angularAccelInput").value);
    var inputRadius = parseFloat(document.getElementById("radiusInput").value);

    if (!isNaN(inputSpeed)) {
      speed = inputSpeed;
    }
    if (!isNaN(inputSpeedY)) {   // Add this block to handle speedYInput
      speedY = inputSpeedY;
    } else {
      var angleInRadians = (launchAngle * Math.PI) / 180;
      speedY = speed * Math.sin(angleInRadians);
    }
    if (!isNaN(inputAccelerationX)) {
      accelerationX = inputAccelerationX;
    }
    if (!isNaN(inputLaunchAngle)) {
      launchAngle = inputLaunchAngle;
    }
    if (!isNaN(inputGravity)) {
      gravity = inputGravity;
    }
    if (!isNaN(inputAngVel)) {
      angularVelocity = inputAngVel;
    }
    if (!isNaN(inputAngAccel)) {
      angularAcceleration = inputAngAccel;
    }
    if (!isNaN(inputRadius)) {
      radiusCircular = inputRadius;
    }

    // Convert angle to radians and compute initial velocity components
    var angleInRadians = (launchAngle * Math.PI) / 180;
    speedX = speed * Math.cos(angleInRadians);
  }

  function startParabola() {
    // resetParabola();
    isMovingParabola = true;
    time = 0; // Reset time
    updateParameters(); // Ensure the parameters are set when the animation starts
  }

  function resetParabola() {
    isMovingParabola = false;
    startPositionX = -1.75; // Reset X position
    startPositionY = -0.65; // Reset Y position
    time = 0; // Reset time
  }

  function startCircular() {
    // resetParabola();
    isMovingCircular = true;
    time = 0; // Reset time
    updateParameters(); // Ensure the parameters are set when the animation starts
  }

  function resetCircular() {
    isMovingCircular = false;
    startPositionX = 0; // Reset X position
    startPositionY = 0; // Reset Y position
    time = 0; // Reset time
  }

  function startFreeFall() {
    // resetParabola();
    isMovingFreeFall = true;
    updateParameters(); // Ensure the parameters are set when the animation starts
    speed = 0; // Reset time
  }

  function resetFreeFall() {
    isMovingFreeFall = false;
    startPositionX = -1.5; // Reset X position
    startPositionY = 0.65; // Reset Y position
    speed = 0; // Reset time
  }

  function updateCubePosition() {
    if (isMovingParabola) {
      // Update time
      time += timeStep;

      // Calculate new position in X and Y based on GLBB formula
      startPositionX +=
        speedX * timeStep + 0.5 * accelerationX * Math.pow(time, 2);
      startPositionY += speedY * timeStep + 0.5 * gravity * Math.pow(time, 2);

      // Update velocities based on acceleration and gravity
      speedX += accelerationX * timeStep;
      speedY += gravity * timeStep;

      // Ensure cube wraps around horizontally when it crosses canvas boundaries
      if (startPositionX >= rightLimit) {
        startPositionX = leftLimit; // Wrap to left side
      } else if (startPositionX < leftLimit) {
        startPositionX = rightLimit; // Wrap to right side
      }

      // Stop the cube if it hits the ground level (y = -0.65)
      if (startPositionY <= groundLevel) {
        startPositionY = groundLevel;
        speedY = 0; // Stop vertical movement
        isMovingParabola = false; // Stop the animation when it hits the ground
      }
    } 
    else if (isMovingFreeFall) {
      // Perbarui kecepatan berdasarkan gravitasi
      speed += gravity * timeStep;

      // Perbarui posisi Y berdasarkan kecepatan
      startPositionY += speed * timeStep;

      // Periksa apakah kubus sudah mencapai batas bawah
      if (startPositionY <= groundLevel) {
        // Set posisi di batas bawah dan hentikan pergerakan
        startPositionY = groundLevel;
        speed = 0;
        isMovingFreeFall = false; // Hentikan pergerakan
      }
    }
    else if (isMovingCircular) {
      // Update time
      time += timeStep;

      // Update angular velocity based on angular acceleration
      angularVelocity += angularAcceleration * timeStep;

      // Update angular position based on angular velocity
      angularPosition += angularVelocity * timeStep;

      // Convert polar coordinates (circular motion) to Cartesian coordinates
      startPositionX = radiusCircular * Math.cos(angularPosition);
      startPositionY = radiusCircular * Math.sin(angularPosition);
    }

    // Create translation matrix for moving the cube in both X and Y axes
    var translationMatrix = translate(startPositionX, startPositionY, 0.0); // Move in X and Y axis
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
