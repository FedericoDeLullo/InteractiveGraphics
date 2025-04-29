// Function to compute the ModelView (MVP) matrix
function GetModelViewMatrix(translationX, translationY, translationZ, rotationX, rotationY) {
    // Translation matrix
    var trans = [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        translationX, translationY, translationZ, 1
    ];

    // Rotation matrix around X axis
    var rotateX = [
        1, 0, 0, 0,
        0, Math.cos(rotationX), Math.sin(rotationX), 0,
        0, -Math.sin(rotationX), Math.cos(rotationX), 0,
        0, 0, 0, 1
    ];

    // Rotation matrix around Y axis
    var rotateY = [
        Math.cos(rotationY), 0, -Math.sin(rotationY), 0,
        0, 1, 0, 0,
        Math.sin(rotationY), 0, Math.cos(rotationY), 0,
        0, 0, 0, 1
    ];

    // Apply transformations: Translation -> Rotation X -> Rotation Y
    var modelViewMatrix = MatrixMult(trans, MatrixMult(rotateX, rotateY));

    // Return the ModelView matrix
    return modelViewMatrix;
}

// Class responsible for rendering a textured 3D mesh
class MeshDrawer {
    constructor() {
        this.prog = InitShaderProgram(meshVS, meshFS); // Compile shaders and link the program

        // Attribute locations for position, texture coordinates, and normals
        this.posAttr = gl.getAttribLocation(this.prog, 'pos');
        this.texAttr = gl.getAttribLocation(this.prog, 'texCoord');
        this.normAttr = gl.getAttribLocation(this.prog, 'normal'); // Add normal attribute

        // Uniform locations for MVP, swap, texture, light, and shininess
        this.mvpUniform = gl.getUniformLocation(this.prog, 'mvp');
        this.swapUniform = gl.getUniformLocation(this.prog, 'swap');
        this.useTexUniform = gl.getUniformLocation(this.prog, 'useTexture');
        this.texSamplerUniform = gl.getUniformLocation(this.prog, 'texture');
        this.lightDirUniform = gl.getUniformLocation(this.prog, 'lightDir');
        this.shininessUniform = gl.getUniformLocation(this.prog, 'shininess');

        // Buffers for vertex positions, texture coordinates, and normals
        this.posBuffer = gl.createBuffer();
        this.texBuffer = gl.createBuffer();
        this.normBuffer = gl.createBuffer(); // Add buffer for normals

        // Texture-related variables
        this.texture = null;
        this.textureSet = false;
        this.vertexCount = 0;

        // Initialize default shader values
        gl.useProgram(this.prog);
        gl.uniform1i(this.useTexUniform, false);
        gl.uniform1i(this.swapUniform, false);
    }

    // Set mesh geometry (positions, texture coordinates, and normals)
    setMesh(vertPos, texCoords, normals) {
        this.vertexCount = vertPos.length / 3;

        // Vertex positions buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

        // Texture coordinates buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

        // Normals buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
    }

    // Upload the texture to the GPU and set texture parameters
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

        // Enable texture usage
        gl.uniform1i(this.useTexUniform, true);
    }

    // Enable or disable the texture
    showTexture(show) {
        gl.useProgram(this.prog);
        gl.uniform1i(this.useTexUniform, show && this.textureSet);
    }

    // Swap Y and Z axes in the vertex shader
    swapYZ(swap) {
        gl.useProgram(this.prog);
        gl.uniform1i(this.swapUniform, swap);
    }

    // Set the light direction in camera space
    setLightDir(x, y, z) {
        gl.useProgram(this.prog);
        gl.uniform3fv(this.lightDirUniform, new Float32Array([x, y, z]));
    }

    // Set the shininess parameter for Blinn shading
    setShininess(shininess) {
        gl.useProgram(this.prog);
        gl.uniform1f(this.shininessUniform, shininess);
    }

    // Render the mesh with current settings and transformations
    draw(matrixMVP, matrixMV, matrixNormal) {
        gl.useProgram(this.prog);

        // Set MVP matrix
        gl.uniformMatrix4fv(this.mvpUniform, false, matrixMVP);

        // Set normal matrix
        gl.uniformMatrix3fv(gl.getUniformLocation(this.prog, 'normalMatrix'), false, matrixNormal);

        // Bind vertex positions
        gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuffer);
        gl.vertexAttribPointer(this.posAttr, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.posAttr);

        // Bind texture coordinates
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texBuffer);
        gl.vertexAttribPointer(this.texAttr, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.texAttr);

        // Bind normals
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normBuffer);
        gl.vertexAttribPointer(this.normAttr, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.normAttr);

        // Bind texture if set
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
attribute vec3 normal;

uniform mat4 mvp;
uniform mat3 normalMatrix;
uniform bool swap;

varying vec2 vTexCoord;
varying vec3 vNormal;
varying vec3 vFragPos;

void main() {
    vec3 finalPos = swap ? vec3(pos.x, pos.z, pos.y) : pos;
    gl_Position = mvp * vec4(finalPos, 1.0);

    vNormal = normalize(normalMatrix * normal);
    vFragPos = vec3(mvp * vec4(finalPos, 1.0)).xyz;
    vTexCoord = texCoord;
}
`;

// Fragment Shader
const meshFS = `
precision mediump float;

uniform sampler2D texture;
uniform bool useTexture;
uniform vec3 lightDir;
uniform float shininess;

varying vec2 vTexCoord;
varying vec3 vNormal;
varying vec3 vFragPos;

void main() {
    vec4 color = useTexture ? texture2D(texture, vTexCoord) : vec4(1.0, 1.0, 1.0, 1.0);

    vec3 normal = normalize(vNormal);
    vec3 light = normalize(lightDir);
    vec3 viewDir = normalize(-vFragPos);
    vec3 halfwayDir = normalize(light + viewDir);

    float diff = max(dot(normal, light), 0.0) + 0.1;
    float spec = pow(max(dot(normal, halfwayDir), 0.0), shininess);

    vec3 finalColor = color.rgb * diff + vec3(1.0) * spec;

    gl_FragColor = vec4(finalColor, color.a);
}
`;
