// Vertex Shader
const meshVS = `
precision mediump float; // Set medium precision for floats

// Vertex attributes provided by the mesh
attribute vec3 pos;       // Vertex position
attribute vec2 texCoord;  // Texture coordinate
attribute vec3 normal;    // Vertex normal

// Uniform matrices for transformations
uniform mat4 mvp;         // Model-View-Projection matrix
uniform mat4 mv;          // Model-View matrix
uniform mat3 normalMatrix; // Matrix to transform normals
uniform bool swap;        // Flag to optionally swap Y and Z axes

// Outputs to the fragment shader
varying vec2 vTexCoord;   // Pass texture coordinate
varying vec3 vNormal;     // Pass transformed normal
varying vec3 vFragPos;    // Pass fragment position in view space

void main() {
    vec3 finalPos = pos;
    vec3 finalNormal = normal;

    // If swap is enabled, exchange Y and Z values (for coordinate system adjustment)
    if (swap) {
        finalPos = vec3(pos.x, pos.z, pos.y);
        finalNormal = vec3(normal.x, normal.z, normal.y);
    }

    // Compute the position in view space for lighting
    vFragPos = vec3(mv * vec4(finalPos, 1.0));
    // Transform and normalize the normal vector
    vNormal = normalize(normalMatrix * finalNormal);
    // Pass texture coordinate unchanged
    vTexCoord = texCoord;

    // Compute final position in clip space
    gl_Position = mvp * vec4(finalPos, 1.0);
}
`;
// Fragment Shader
const meshFS = `
precision mediump float; // Medium precision for floats

// Uniforms
uniform bool useTexture;         // Enable or disable texture usage
uniform sampler2D texture;       // Texture sampler
uniform vec3 lightDir;           // Direction of the light source
uniform float shininess;         // Shininess for specular highlight

// Inputs from the vertex shader
varying vec2 vTexCoord;          // Interpolated texture coordinate
varying vec3 vNormal;            // Interpolated and transformed normal
varying vec3 vFragPos;           // Interpolated position in view space

void main() {
    vec3 n = normalize(vNormal);          // Normal vector
    vec3 l = normalize(lightDir);         // Light direction
    vec3 v = normalize(-vFragPos);        // View direction (camera is at origin)
    vec3 halfDir = normalize(l + v);      // Halfway vector for Blinn-Phong

    // Diffuse and specular components
    float diff = max(dot(n, l), 0.0);     // Diffuse lighting
    float spec = pow(max(dot(n, halfDir), 0.0), shininess); // Specular highlight

    // Get diffuse color from texture or use white
    vec3 k_d = useTexture ? texture2D(texture, vTexCoord).rgb : vec3(1.0);
    vec3 k_s = vec3(1.0);                 // Specular color (white)
    vec3 ambient = 0.1 * k_d;             // Ambient component

    // Combine lighting components
    vec3 color = k_d * diff + k_s * spec + ambient;
    gl_FragColor = vec4(color, 1.0);      // Final fragment color
}
`;
// Function to compute ModelView matrix given translation and rotation
function GetModelViewMatrix(translationX, translationY, translationZ, rotationX, rotationY) {
    var trans = [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        translationX, translationY, translationZ, 1
    ];

    var rotateX = [
        1, 0, 0, 0,
        0, Math.cos(rotationX), Math.sin(rotationX), 0,
        0, -Math.sin(rotationX), Math.cos(rotationX), 0,
        0, 0, 0, 1
    ];

    var rotateY = [
        Math.cos(rotationY), 0, -Math.sin(rotationY), 0,
        0, 1, 0, 0,
        Math.sin(rotationY), 0, Math.cos(rotationY), 0,
        0, 0, 0, 1
    ];

    // Multiply: Translation * RotationX * RotationY
    var modelViewMatrix = MatrixMult(trans, MatrixMult(rotateX, rotateY));
    return modelViewMatrix;
}
// Class responsible for rendering a 3D mesh with optional texture and lighting
class MeshDrawer {
    constructor() {
        // Compile shaders and create shader program
        this.prog = InitShaderProgram(meshVS, meshFS);

        // Get attribute and uniform locations
        this.posAttr = gl.getAttribLocation(this.prog, 'pos');
        this.texAttr = gl.getAttribLocation(this.prog, 'texCoord');
        this.normAttr = gl.getAttribLocation(this.prog, 'normal');

        this.mvpUniform = gl.getUniformLocation(this.prog, 'mvp');
        this.mvUniform = gl.getUniformLocation(this.prog, 'mv');
        this.swapUniform = gl.getUniformLocation(this.prog, 'swap');
        this.useTexUniform = gl.getUniformLocation(this.prog, 'useTexture');
        this.texSamplerUniform = gl.getUniformLocation(this.prog, 'texture');
        this.lightDirUniform = gl.getUniformLocation(this.prog, 'lightDir');
        this.shininessUniform = gl.getUniformLocation(this.prog, 'shininess');

        // Create GPU buffers for positions, textures, and normals
        this.posBuffer = gl.createBuffer();
        this.texBuffer = gl.createBuffer();
        this.normBuffer = gl.createBuffer();

        // Texture tracking
        this.texture = null;
        this.textureSet = false;
        this.vertexCount = 0;

        // Set initial state
        gl.useProgram(this.prog);
        gl.uniform1i(this.useTexUniform, false);
        gl.uniform1i(this.swapUniform, false);
    }

    // Upload mesh data to GPU buffers
    setMesh(vertPos, texCoords, normals) {
        this.vertexCount = vertPos.length / 3;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.texBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.normBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
    }

    // Load texture image and send it to GPU
    setTexture(img) {
        gl.useProgram(this.prog);

        this.texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);

        // Upload the image to the texture
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
        gl.generateMipmap(gl.TEXTURE_2D);

        // Set texture filtering
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        // Tell the shader to use this texture
        gl.uniform1i(this.texSamplerUniform, 0);

        this.textureSet = true;
        gl.uniform1i(this.useTexUniform, true);
    }

    // Enable or disable texture usage
    showTexture(show) {
        gl.useProgram(this.prog);
        gl.uniform1i(this.useTexUniform, show && this.textureSet);
    }

    // Enable or disable Y-Z coordinate swapping
    swapYZ(swap) {
        gl.useProgram(this.prog);
        gl.uniform1i(this.swapUniform, swap);
    }

    // Set the direction of the light source
    setLightDir(x, y, z) {
        gl.useProgram(this.prog);
        gl.uniform3fv(this.lightDirUniform, new Float32Array([x, y, z]));
    }

    // Set the shininess value for specular highlights
    setShininess(shininess) {
        gl.useProgram(this.prog);
        gl.uniform1f(this.shininessUniform, shininess);
    }

    // Draw the mesh using current buffers and uniforms
    draw(matrixMVP, matrixMV, matrixNormal) {
        gl.useProgram(this.prog);

        // Set transformation matrices
        gl.uniformMatrix4fv(this.mvpUniform, false, matrixMVP);
        gl.uniformMatrix4fv(this.mvUniform, false, matrixMV);
        gl.uniformMatrix3fv(gl.getUniformLocation(this.prog, 'normalMatrix'), false, matrixNormal);

        // Bind vertex position buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuffer);
        gl.vertexAttribPointer(this.posAttr, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.posAttr);

        // Bind texture coordinate buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texBuffer);
        gl.vertexAttribPointer(this.texAttr, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.texAttr);

        // Bind normal buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normBuffer);
        gl.vertexAttribPointer(this.normAttr, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.normAttr);

        // Bind texture if it is set
        if (this.textureSet) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.uniform1i(this.texSamplerUniform, 0);
        }

        // Issue the draw call
        gl.drawArrays(gl.TRIANGLES, 0, this.vertexCount);
    }
}
