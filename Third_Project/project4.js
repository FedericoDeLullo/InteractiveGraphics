// Function to compute the ModelViewProjection (MVP) Matrix
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

    // Apply transformations: Translation -> Rotation X -> Rotation Y
    var modelViewMatrix = MatrixMult(trans, MatrixMult(rotateX, rotateY));

    // Multiply with the projection matrix to get the final MVP matrix
    var mvp = MatrixMult(projectionMatrix, modelViewMatrix);

    return mvp;
}

// Class responsible for drawing a textured 3D mesh
class MeshDrawer {
    constructor() {
        this.prog = InitShaderProgram(meshVS, meshFS); // Compile shaders and link program

        // Attribute locations
        this.posAttr = gl.getAttribLocation(this.prog, 'pos');
        this.texAttr = gl.getAttribLocation(this.prog, 'texCoord');

        // Uniform locations
        this.mvpUniform = gl.getUniformLocation(this.prog, 'mvp');
        this.swapUniform = gl.getUniformLocation(this.prog, 'swap');
        this.useTexUniform = gl.getUniformLocation(this.prog, 'useTexture');
        this.texSamplerUniform = gl.getUniformLocation(this.prog, 'texture');

        // Buffers for vertex positions and texture coordinates
        this.posBuffer = gl.createBuffer();
        this.texBuffer = gl.createBuffer();

        // Texture setup
        this.texture = null;
        this.textureSet = false;
        this.vertexCount = 0;

        // Initialize default shader values
        gl.useProgram(this.prog);
        gl.uniform1i(this.useTexUniform, false);
        gl.uniform1i(this.swapUniform, false);
    }

    // Sets the mesh geometry (vertex positions and texture coordinates)
    setMesh(vertPos, texCoords) {
        this.vertexCount = vertPos.length / 3;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.texBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
    }

    // Uploads the texture to the GPU and sets texture parameters
    setTexture(img) {
        gl.useProgram(this.prog);

        this.texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        gl.uniform1i(this.texSamplerUniform, 0);

        this.textureSet = true;

        // Enable the texture as soon as it's set
        gl.uniform1i(this.useTexUniform, true);
    }

    // Enables or disables texture usage
    showTexture(show) {
        gl.useProgram(this.prog);
        gl.uniform1i(this.useTexUniform, show && this.textureSet);
    }

    // Swaps Y and Z components in the vertex shader
    swapYZ(swap) {
        gl.useProgram(this.prog);
        gl.uniform1i(this.swapUniform, swap);
    }

    // Renders the mesh with the current settings and transformation
    draw(trans) {
        gl.useProgram(this.prog);
        gl.uniformMatrix4fv(this.mvpUniform, false, trans);

        // Bind vertex positions
        gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuffer);
        gl.vertexAttribPointer(this.posAttr, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.posAttr);

        // Bind texture coordinates
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texBuffer);
        gl.vertexAttribPointer(this.texAttr, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.texAttr);

        // Ensure the texture is active (if set)
        if (this.textureSet) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.uniform1i(this.texSamplerUniform, 0);
        }

        // Draw the mesh
        gl.drawArrays(gl.TRIANGLES, 0, this.vertexCount);
    }
}

// Vertex Shader
const meshVS = `
attribute vec3 pos;
attribute vec2 texCoord;

uniform mat4 mvp;
uniform bool swap;

varying vec2 vTexCoord;

void main() {
    // Optionally swap Y and Z coordinates
    vec3 finalPos = swap ? vec3(pos.x, pos.z, pos.y) : pos;
    gl_Position = mvp * vec4(finalPos, 1.0);
    vTexCoord = texCoord;
}
`;

// Fragment Shader
const meshFS = `
precision mediump float;

uniform sampler2D texture;
uniform bool useTexture;

varying vec2 vTexCoord;

void main() {
    // Use texture if available, otherwise apply a default color gradient based on depth
    if (useTexture) {
        gl_FragColor = texture2D(texture, vTexCoord);
    } else {
        gl_FragColor = vec4(1.0, gl_FragCoord.z * gl_FragCoord.z, 0.0, 1.0);
    }
}
`;
