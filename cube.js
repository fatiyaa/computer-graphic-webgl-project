"use strict";

var main = function () {
  var canvas;
  var gl;

  var numPositions = 36;

  var positionsArray = [];
  var colorsArray = [];

  const A = (1 + Math.sqrt(5)) / 2; // The golden ratio
  const B = 1 / A;

  var vertices = [
    vec4(-0.1, -0.1, 0.1, 1.0), // Vertex bottom
    vec4(-0.1, 0.1, 0.1, 1.0), // Vertex top
    vec4(0.1, 0.1, 0.1, 1.0),
    vec4(0.1, -0.1, 0.1, 1.0),
    vec4(-0.1, -0.1, -0.1, 1.0),
    vec4(-0.1, 0.1, -0.1, 1.0),
    vec4(0.1, 0.1, -0.1, 1.0),
    vec4(0.1, -0.1, -0.1, 1.0),
  ];

  var dodeVertices = [
    vec4(0.1, 0.1, 0.1, 1.0),
    vec4(0.1, 0.1, -0.1, 1.0),
    vec4(0.1, -0.1, 0.1, 1.0),
    vec4(0.1, -0.1, -0.1, 1.0),
    vec4(-0.1, 0.1, 0.1, 1.0),
    vec4(-0.1, 0.1, -0.1, 1.0),
    vec4(-0.1, -0.1, 0.1, 1.0),
    vec4(-0.1, -0.1, -0.1, 1.0),
    vec4(0, B / 10, A / 10, 1.0),
    vec4(0, B / 10, -A / 10, 1.0),
    vec4(0, -B / 10, A / 10, 1.0),
    vec4(0, -B / 10, -A / 10, 1.0),
    vec4(B / 10, A / 10, 0, 1.0),
    vec4(B / 10, -A / 10, 0, 1.0),
    vec4(-B / 10, A / 10, 0, 1.0),
    vec4(-B / 10, -A / 10, 0, 1.0),
    vec4(A / 10, 0, B / 10, 1.0),
    vec4(A / 10, 0, -B / 10, 1.0),
    vec4(-A / 10, 0, B / 10, 1.0),
    vec4(-A / 10, 0, -B / 10, 1.0),
  ];

  var tetraVertices = [
    vec4(0.0, 0.2, -0.1, 1.0), // Vertex bottom
    vec4(-0.2, -0.1, -0.1, 1.0), // Vertex bottom
    vec4(0.2, -0.1, -0.1, 1.0), // Vertex bottom
    vec4(0.0, 0.0, 0.2, 1.0), // Vertex bottom
  ]

  var dodeVertexColors = [
    vec4(0.0, 0.0, 0.0, 1.0), // black
    vec4(1.0, 0.0, 0.0, 1.0), // red
    vec4(1.0, 1.0, 0.0, 1.0), // yellow
    vec4(0.0, 1.0, 0.0, 1.0), // green
    vec4(0.0, 0.0, 1.0, 1.0), // blue
    vec4(1.0, 0.0, 1.0, 1.0), // magenta
    vec4(0.0, 1.0, 1.0, 1.0), // cyan
    vec4(0.5, 0.5, 0.5, 1.0), // grey
    vec4(0.5, 0.0, 0.0, 1.0), // half red
    vec4(0.5, 0.5, 0.0, 1.0), // yellow 2
    vec4(0.0, 0.5, 0.0, 1.0), // green 2
    vec4(0.0, 0.0, 0.5, 1.0), // blue 2
  ];

  var near = 0.1;
  var far = 10.0;
  var radius = 2.0;
  var theta = 0.0;
  var phi = 0.0;
  var dr = (5.0 * Math.PI) / 180.0;

  var fovy = 45.0; // Field of view in the y-direction
  var aspect;

  var cameraSpeed = 0.05;
  var fovSpeed = 1.0;

  var modelViewMatrixLoc, projectionMatrixLoc;
  var modelViewMatrix, projectionMatrix;
  var eye;
  const at = vec3(0.0, 0.0, 0.0);
  const up = vec3(0.0, 1.0, 0.0);

  var currentObject = "cube";

  function quad(a, b, c, d) {
    positionsArray.push(vertices[a]);
    colorsArray.push(dodeVertexColors[a]);
    positionsArray.push(vertices[b]);
    colorsArray.push(dodeVertexColors[a]);
    positionsArray.push(vertices[c]);
    colorsArray.push(dodeVertexColors[a]);
    positionsArray.push(vertices[a]);
    colorsArray.push(dodeVertexColors[a]);
    positionsArray.push(vertices[c]);
    colorsArray.push(dodeVertexColors[a]);
    positionsArray.push(vertices[d]);
    colorsArray.push(dodeVertexColors[a]);
  }

  function pentagon(a, b, c, d, e, colorIndex) {
    // Pecah pentagon menjadi 3 segitiga untuk membentuk fan
    positionsArray.push(dodeVertices[a]);
    colorsArray.push(dodeVertexColors[colorIndex]);
    positionsArray.push(dodeVertices[b]);
    colorsArray.push(dodeVertexColors[colorIndex]);
    positionsArray.push(dodeVertices[c]);
    colorsArray.push(dodeVertexColors[colorIndex]);

    positionsArray.push(dodeVertices[a]);
    colorsArray.push(dodeVertexColors[colorIndex]);
    positionsArray.push(dodeVertices[c]);
    colorsArray.push(dodeVertexColors[colorIndex]);
    positionsArray.push(dodeVertices[d]);
    colorsArray.push(dodeVertexColors[colorIndex]);

    positionsArray.push(dodeVertices[a]);
    colorsArray.push(dodeVertexColors[colorIndex]);
    positionsArray.push(dodeVertices[d]);
    colorsArray.push(dodeVertexColors[colorIndex]);
    positionsArray.push(dodeVertices[e]);
    colorsArray.push(dodeVertexColors[colorIndex]);
  }

  function triangle(a, b, c, colorIndex) {
    positionsArray.push(tetraVertices[a]);
    colorsArray.push(dodeVertexColors[colorIndex]);
    positionsArray.push(tetraVertices[b]);
    colorsArray.push(dodeVertexColors[colorIndex]);
    positionsArray.push(tetraVertices[c]);
    colorsArray.push(dodeVertexColors[colorIndex]);
  }

  function colorCube() {
    quad(1, 0, 3, 2);
    quad(2, 3, 7, 6);
    quad(3, 0, 4, 7);
    quad(6, 5, 1, 2);
    quad(4, 5, 6, 7);
    quad(5, 4, 0, 1);
  }

  function colorDodecahedron() {
    pentagon(0, 8, 10, 2, 16, 0); // black
    pentagon(0, 8, 4, 14, 12, 1); // red
    pentagon(0, 12, 1, 17, 16, 2); // yellow
    pentagon(1, 12, 14, 5, 9, 3); // green
    pentagon(4, 8, 10, 6, 18, 4); // blue 7
    pentagon(5, 14, 4, 18, 19, 5); // magenta
    pentagon(15, 13, 2, 10, 6, 6); // cyan
    pentagon(3, 11, 7, 15, 13, 7); // grey
    pentagon(1, 9, 11, 3, 17, 8); // half red
    pentagon(6, 15, 7, 19, 18, 9); // ywllow 2
    pentagon(2, 16, 17, 3, 13, 10); // green 2
    pentagon(7, 11, 9, 5, 19, 11); // blue`2
    // 3, 17, 16, 2, 13 green sbelah cyan
  }

  function colorTetrahedron() {
    triangle(0, 1, 2, 0);
    triangle(0, 2, 3, 1);
    triangle(0, 3, 1, 2);
    triangle(2, 1, 3, 3);
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

    // colorCube();
    if (currentObject === "cube") {
      colorCube();
    } else if (currentObject === "dodecahedron") {
      colorDodecahedron();
    } else if (currentObject === "tetrahedron") {
      colorTetrahedron();
    }

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

    window.addEventListener("keydown", handleKeyDown);

    // Add event listeners for buttons
    document.getElementById("cubeButton").onclick = function () {
      currentObject = "cube";
      positionsArray = []; // Clear positions and colors
      colorsArray = [];
      numPositions = 36;

      init(); // Re-initialize with cube
    };
    document.getElementById("dodecahedronButton").onclick = function () {
      currentObject = "dodecahedron";
      positionsArray = []; // Clear positions and colors
      colorsArray = [];
      numPositions = 108;

      init(); // Re-initialize with dodecahedron
    };
    document.getElementById("tetrahedronButton").onclick = function () {
      currentObject = "tetrahedron";
      positionsArray = []; // Clear positions and colors
      colorsArray = [];
      numPositions = 12;

      init(); // Re-initialize with dodecahedron
    };

    document.getElementById("parabola").onclick = resetParabola;
    document.getElementById("startParabola").onclick = startParabola;
    document.getElementById("resetParabola").onclick = resetParabola;

    document.getElementById("freeFall").onclick = resetFreeFall;
    document.getElementById("startFreeFall").onclick = startFreeFall;
    document.getElementById("resetFreeFall").onclick = resetFreeFall;

    document.getElementById("circular").onclick = resetCircular;
    document.getElementById("startCircular").onclick = startCircular;
    document.getElementById("resetCircular").onclick = resetCircular;

    document.getElementById("GLBB").onclick = resetGLBB;
    document.getElementById("startGLBB").onclick = startGLBB;
    document.getElementById("resetGLBB").onclick = resetGLBB;

    render();
  }

  function handleKeyDown(event) {
    switch (event.key) {
      case "w": // Move camera closer
        radius -= cameraSpeed;
        break;
      case "s": // Move camera further
        radius += cameraSpeed;
        break;
      case "a": // Rotate camera left
        theta -= cameraSpeed;
        break;
      case "d": // Rotate camera right
        theta += cameraSpeed;
        break;
      case "q": // Rotate camera up
        phi -= cameraSpeed;
        break;
      case "e": // Rotate camera down
        phi += cameraSpeed;
        break;
      case "z": // Zoom in (decrease FOV)
        fovy = Math.max(10.0, fovy - fovSpeed);
        break;
      case "x": // Zoom out (increase FOV)
        fovy = Math.min(90.0, fovy + fovSpeed);
        break;
    }
  }

  // Variables for controlling cube movement based on GLBB
  var startPositionX = -0; // Adjust to start near the left
  var startPositionY = -0; // Cube bottom touches canvas bottom
  // var speed = 0; // Initial velocity
  var speedX = 0; // Velocity in X direction
  var speedXGLBB = 0; // Velocity in X direction
  var speedY = 0; // Velocity in Y direction
  var launchAngle = 45; // Launch angle (θ)
  var gravity = -9.8; // Gravity in Y direction
  var gravityFF = -9.8; // Gravity in Y direction
  var accelerationX = 0; // Acceleration in X direction
  var timeStep = 0.005; // Time step in seconds
  var rightLimit = 2.5; // Right boundary near the right edge
  var leftLimit = -2.5; // Left boundary for wrapping
  var groundLevel = -0.65; // Ground level adjusted to align with cube's bottom
  var angularPosition = 0; // Current angular position in radians
  var angularVelocity = 0; // Initial angular velocity
  var angularAcceleration = 0; // Angular acceleration in radians per second squared
  var radiusCircular = 0.01; // Radius of the circular path
  var isMovingParabola = false,
    isMovingFreeFall = false,
    isMovingCircular = false, // Movement status
    isMovingGLBB = false; // Movement status
  var time = 0; // Time tracker

  // Function to read input values for speed and acceleration
  function updateParameters() {
    var inputSpeedX = parseFloat(document.getElementById("speedXInput").value);
    var inputSpeedXGLBB = parseFloat(document.getElementById("speedXInputGLBB").value);
    var inputSpeedY = parseFloat(document.getElementById("speedYInput").value);
    var inputAccelerationX = parseFloat(
      document.getElementById("accelerationInput").value
    );
    var inputLaunchAngle = parseFloat(
      document.getElementById("angleInput").value
    );
    var inputGravity = parseFloat(
      document.getElementById("gravityInput").value
    );
    var inputGravityFF = parseFloat(
      document.getElementById("gravityInputFF").value
    );
    var inputAngVel = parseFloat(
      document.getElementById("angularVelInput").value
    );
    var inputAngAccel = parseFloat(
      document.getElementById("angularAccelInput").value
    );
    var inputRadius = parseFloat(document.getElementById("radiusInput").value);

    if (!isNaN(inputSpeedX)) {
      speedX = inputSpeedX;
    }
    if (!isNaN(inputSpeedXGLBB)) {
      speedXGLBB = inputSpeedXGLBB;
    }
    if (!isNaN(inputSpeedY)) {
      // Add this block to handle speedYInput
      speedY = inputSpeedY;
    } 
    // else {
    //   var angleInRadians = (launchAngle * Math.PI) / 180;
    //   speedY = speed * Math.sin(angleInRadians);
    // }
    if (!isNaN(inputAccelerationX)) {
      accelerationX = inputAccelerationX;
    }
    if (!isNaN(inputLaunchAngle)) {
      launchAngle = inputLaunchAngle;
    }
    if (!isNaN(inputGravity)) {
      gravity = inputGravity;
    }
    if (!isNaN(inputGravityFF)) {
      gravityFF = inputGravityFF;
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
    // var angleInRadians = (launchAngle * Math.PI) / 180;
    // speedX = speed * Math.cos(angleInRadians);
  }

  function startParabola() {
    // resetParabola();
    updateParameters(); // Ensure the parameters are set when the animation starts
    time = 0; // Reset time
    isMovingParabola = true;
  }

  function resetParabola() {
    isMovingParabola = false;
    startPositionX = -1.75; // Reset X position
    startPositionY = -0.65; // Reset Y position
    time = 0; // Reset time
  }

  function startCircular() {
    // resetParabola();
    updateParameters(); // Ensure the parameters are set when the animation starts
    time = 0; // Reset time
    isMovingCircular = true;
  }

  function resetCircular() {
    isMovingCircular = false;
    startPositionX = 0; // Reset X position
    startPositionY = 0; // Reset Y position
    time = 0; // Reset time
  }

  function startFreeFall() {
    // resetParabola();
    updateParameters(); // Ensure the parameters are set when the animation starts
    speedY = 0; // Reset time
    isMovingFreeFall = true;
  }

  function resetFreeFall() {
    isMovingFreeFall = false;
    startPositionX = -1.5; // Reset X position
    startPositionY = 0.65; // Reset Y position
    speedY = 0; // Reset time
  }

  function startGLBB() {
    updateParameters(); // Ensure the parameters are set when the animation
    time = 0; 
    isMovingGLBB = true;
  }

  function resetGLBB() {
    isMovingGLBB = false;
    startPositionX = 0; // Reset X position
    startPositionY = 0; // Reset Y position
    time = 0;
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
    } else if (isMovingFreeFall) {
      // Perbarui posisi Y berdasarkan kecepatan
      startPositionY += speedY * timeStep;
    
      // Perbarui kecepatan berdasarkan gravitasi
      speedY += gravityFF * timeStep;

      // Periksa apakah kubus sudah mencapai batas bawah
      if (startPositionY <= groundLevel) {
        // Set posisi di batas bawah dan hentikan pergerakan
        startPositionY = groundLevel;
        speedY = 0;
        isMovingFreeFall = false; // Hentikan pergerakan
      }
    } else if (isMovingCircular) {
      // Update time
      time += timeStep;
      
      // Update angular position based on angular velocity
      angularPosition += angularVelocity * timeStep;
      
      // Update angular velocity based on angular acceleration
      angularVelocity += angularAcceleration * timeStep;

      // Convert polar coordinates (circular motion) to Cartesian coordinates
      startPositionX = radiusCircular * Math.cos(angularPosition);
      startPositionY = radiusCircular * Math.sin(angularPosition);
    } else if (isMovingGLBB) {
      // Update time
      time += timeStep;

      // Calculate new position based on V0 and acceleration (GLBB formula)
      // GLBB: s = v0 * t + 0.5 * a * t^2
      startPositionX += speedXGLBB * time + 0.5 * accelerationX * Math.pow(time, 2);

      // Update velocity based on acceleration
      speedXGLBB += accelerationX * timeStep;

      // Check if it reaches the boundary and wrap around horizontally
      if (startPositionX >= 2.1) {
        startPositionX = 2.1; // Wrap to left side
        isMovingGLBB = false; // Stop the animation
      } else if (startPositionX <= -2.1) {
        startPositionX = -2.1; // Wrap to right side
        isMovingGLBB = false; // Stop the animation
      }
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
main();
