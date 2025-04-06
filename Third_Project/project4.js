// Function to get the ModelViewProjection matrix
function GetModelViewProjection(projectionMatrix, translationX, translationY, translationZ, rotationX, rotationY) {
    // Translation matrix
    var trans = [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        translationX, translationY, translationZ, 1
    ];

    // Rotation matrix around the X-axis
    var rotateX = [
        1, 0, 0, 0,
        0, Math.cos(rotationX), Math.sin(rotationX), 0,
        0, -Math.sin(rotationX), Math.cos(rotationX), 0,
        0, 0, 0, 1
    ];

    // Rotation matrix around the Y-axis
    var rotateY = [
        Math.cos(rotationY), 0, -Math.sin(rotationY), 0,
        0, 1, 0, 0,
        Math.sin(rotationY), 0, Math.cos(rotationY), 0,
        0, 0, 0, 1
    ];

    // Apply transformations in the order: Translation -> Rotation Y -> Rotation X
    var modelViewMatrix = MatrixMult(trans, MatrixMult(rotateX, rotateY));

    // Finally, multiply with the projection matrix
    var mvp = MatrixMult(projectionMatrix, modelViewMatrix);

    return mvp;
}

// MeshDrawer class for drawing and managing the 3D model
class MeshDrawer {
    constructor() {
        // Initialize the shader program and get uniform and attribute locations
        this.prog = InitShaderProgram(meshVS, meshFS);
        this.mvp = gl.getUniformLocation(this.prog, 'mvp');
        this.vertPosAttrib = gl.getAttribLocation(this.prog, 'pos');
        this.texCoordAttrib = gl.getAttribLocation(this.prog, 'texCoord');
        this.useTextureUniform = gl.getUniformLocation(this.prog, 'useTexture');

        // Create buffers for position, texture coordinates, and normals
        this.positionBuffer = gl.createBuffer();
        this.texCoordBuffer = gl.createBuffer();
        this.normalBuffer = gl.createBuffer();

        this.texture = null;
        this.numTriangles = 0;
        this.vertexCount = 0;

        // Save original vertices for axis swapping
        this.meshVertices = [];

        // Flag to indicate whether the texture should be used
        this.textureEnabled = false;
    }

    // Set the mesh with vertex positions and texture coordinates
    setMesh(vertPos, texCoords) {
        // Save a copy of the original vertices
        this.meshVertices = vertPos.slice();

        // Bind and set the position buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

        let normalizedTexCoords = [];
        if (texCoords) {
            // Normalize the texture coordinates (UV mapping)
            for (let i = 0; i < texCoords.length; i += 2) {
                normalizedTexCoords.push(texCoords[i]);     // U
                normalizedTexCoords.push(texCoords[i + 1]);   // V
            }
        }

        // Bind and set the texture coordinate buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalizedTexCoords), gl.STATIC_DRAW);

        // Calculate the number of vertices
        this.vertexCount = vertPos.length / 3;
    }

    // Set the texture visibility based on the checkbox state
    showTexture(show) {
        this.textureEnabled = show;
        gl.useProgram(this.prog);
        gl.uniform1i(this.useTextureUniform, (this.textureEnabled && this.texture) ? 1 : 0);
    }

    // Draw the 3D model using the provided transformation matrix
    draw(trans) {
        gl.useProgram(this.prog);
        gl.uniformMatrix4fv(this.mvp, false, trans);

        // Set vertex positions
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.vertexAttribPointer(this.vertPosAttrib, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.vertPosAttrib);

        // Set texture coordinates
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.vertexAttribPointer(this.texCoordAttrib, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.texCoordAttrib);

        // Apply the texture if enabled and if it exists
        if (this.texture && this.textureEnabled) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.uniform1i(this.useTextureUniform, 1);
        } else {
            gl.uniform1i(this.useTextureUniform, 0);
        }

        // Draw the mesh using the vertex count
        gl.drawArrays(gl.TRIANGLES, 0, this.vertexCount);
    }

    // Set the texture for the mesh
    setTexture(img) {
        // Create and bind the texture
        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);

        // Set texture parameters for filtering and wrapping
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

        // Set the texture flag to true the first time the texture is applied
        this.textureEnabled = true;
        gl.useProgram(this.prog);
        gl.uniform1i(this.useTextureUniform, 1);
    }

    // Function to swap the Y and Z axes for the vertices
    swapYZ(swap) {
        gl.useProgram(this.prog);
        let newVertPos = [];
        if (swap) {
            // Swap Y and Z axes from the original vertex data
            for (let i = 0; i < this.meshVertices.length; i += 3) {
                let x = this.meshVertices[i];
                let y = this.meshVertices[i + 1];
                let z = this.meshVertices[i + 2];
                newVertPos.push(x, z, y);  // Swap Y and Z
            }
        } else {
            // Restore the original vertex positions
            newVertPos = this.meshVertices.slice();
        }
        // Update the position buffer with the new vertex positions
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(newVertPos), gl.STATIC_DRAW);
    }
}

// Vertex Shader
var meshVS = `
attribute vec3 pos;         // Vertex position
attribute vec2 texCoord;    // Vertex texture coordinates
uniform mat4 mvp;           // Model-view-projection matrix
varying vec2 vTexCoord;     // Pass texture coordinates to the fragment shader

void main() {
    // Calculate the final vertex position
    gl_Position = mvp * vec4(pos, 1.0);
    // Pass texture coordinates to the fragment shader
    vTexCoord = texCoord;
}
`;

// Fragment Shader
var meshFS = `
precision mediump float;
uniform sampler2D texture;   // Texture sampler
uniform bool useTexture;     // Flag to decide whether to use the texture
varying vec2 vTexCoord;      // Texture coordinates passed from the vertex shader

void main() {
    if (useTexture) {
        // If texture is enabled, sample the texture at the given coordinates
        vec4 texColor = texture2D(texture, vTexCoord);
        gl_FragColor = texColor;  // Set the final color to the texture color
    } else {
        // If texture is not enabled, use a base color modulated by depth
        gl_FragColor = vec4(1.0, gl_FragCoord.z * gl_FragCoord.z, 0.0, 1.0);
    }
}
`;
