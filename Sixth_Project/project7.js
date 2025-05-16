// Vertex Shader
const meshVS = `
precision mediump float; // Use medium precision floats for better performance and compatibility

// Vertex attributes from mesh
attribute vec3 pos;       // Vertex position in model space
attribute vec2 texCoord;  // Texture coordinate for sampling
attribute vec3 normal;    // Normal vector for lighting calculations

// Transformation uniforms
uniform mat4 mvp;         // Combined Model-View-Projection matrix
uniform mat4 mv;          // Model-View matrix for transforming to view space
uniform mat3 normalMatrix; // Normal transformation matrix (for correct light calculations)
uniform bool swap;        // Flag to swap Y and Z axes if needed

// Varyings to pass data to fragment shader
varying vec2 vTexCoord;   // Pass through texture coordinate
varying vec3 vNormal;     // Transformed normal in view space
varying vec3 vFragPos;    // Fragment position in view space

void main() {
    vec3 finalPos = pos;          // Default vertex position
    vec3 finalNormal = normal;    // Default normal

    // Swap Y and Z if coordinate system differs
    if (swap) {
        finalPos = vec3(pos.x, pos.z, pos.y);
        finalNormal = vec3(normal.x, normal.z, normal.y);
    }

    // Compute position in view space for lighting computations
    vFragPos = vec3(mv * vec4(finalPos, 1.0));
    // Transform and normalize the normal
    vNormal = normalize(normalMatrix * finalNormal);
    // Pass along the texture coordinate
    vTexCoord = texCoord;
    // Compute final clip-space position
    gl_Position = mvp * vec4(finalPos, 1.0);
}
`;

// Fragment Shader
const meshFS = `
precision mediump float; // Medium precision floats

// Uniforms controlling texture usage and lighting
uniform bool useTexture;       // Toggle sampling from texture
uniform sampler2D texture;     // Texture sampler
uniform vec3 lightDir;         // Directional light vector (in view space)
uniform float shininess;       // Specular shininess exponent

// Inputs interpolated from vertex shader
varying vec2 vTexCoord;        // Texture coordinate
varying vec3 vNormal;          // Normal at fragment
varying vec3 vFragPos;         // Fragment position in view space

void main() {
    vec3 n = normalize(vNormal);               // Normalize the normal
    vec3 l = normalize(lightDir);              // Normalize light direction
    vec3 v = normalize(-vFragPos);             // View vector (camera at origin)
    vec3 h = normalize(l + v);                 // Halfway vector for Blinn-Phong

    float diff = max(dot(n, l), 0.0);          // Diffuse term: lambertian
    float spec = pow(max(dot(n, h), 0.0), shininess); // Specular term: Blinn-Phong

    // Base color: either sampled from texture or white
    vec3 k_d = useTexture ? texture2D(texture, vTexCoord).rgb : vec3(1.0);
    vec3 ambient = 0.1 * k_d;                  // Simple ambient term

    // Final color composition: ambient + diffuse + specular
    vec3 color = ambient + k_d * diff + vec3(1.0) * spec;
    gl_FragColor = vec4(color, 1.0);            // Output RGBA color
}
`;

/**
 * Computes a model-view matrix given translations and rotations.
 * @param {number} tx Translation in X
 * @param {number} ty Translation in Y
 * @param {number} tz Translation in Z
 * @param {number} rx Rotation around X axis (radians)
 * @param {number} ry Rotation around Y axis (radians)
 * @returns {Float32Array} Combined Model-View matrix
 */
function GetModelViewMatrix(tx, ty, tz, rx, ry) {
    // Build translation matrix
    const trans = [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        tx, ty, tz, 1
    ];
    // Rotation around X-axis
    const rotX = [
        1, 0, 0, 0,
        0, Math.cos(rx), Math.sin(rx), 0,
        0, -Math.sin(rx), Math.cos(rx), 0,
        0, 0, 0, 1
    ];
    // Rotation around Y-axis
    const rotY = [
        Math.cos(ry), 0, -Math.sin(ry), 0,
        0, 1, 0, 0,
        Math.sin(ry), 0, Math.cos(ry), 0,
        0, 0, 0, 1
    ];
    // Return combined: Translation * rotX * rotY
    return MatrixMult(trans, MatrixMult(rotX, rotY));
}

/**
 * MeshDrawer encapsulates setup and rendering of a 3D mesh with optional texture.
 */
class MeshDrawer {
    constructor() {
        // Compile and link shader program
        this.prog = InitShaderProgram(meshVS, meshFS);
        // Attribute locations
        this.posAttr = gl.getAttribLocation(this.prog, 'pos');
        this.texAttr = gl.getAttribLocation(this.prog, 'texCoord');
        this.normAttr = gl.getAttribLocation(this.prog, 'normal');
        // Uniform locations
        this.mvpUnif = gl.getUniformLocation(this.prog, 'mvp');
        this.mvUnif = gl.getUniformLocation(this.prog, 'mv');
        this.normMatUnif = gl.getUniformLocation(this.prog, 'normalMatrix');
        this.swapUnif = gl.getUniformLocation(this.prog, 'swap');
        this.useTexUnif = gl.getUniformLocation(this.prog, 'useTexture');
        this.texUnif = gl.getUniformLocation(this.prog, 'texture');
        this.lightDirUnif = gl.getUniformLocation(this.prog, 'lightDir');
        this.shineUnif = gl.getUniformLocation(this.prog, 'shininess');
        // GPU buffers
        this.posBuf = gl.createBuffer();
        this.texBuf = gl.createBuffer();
        this.normBuf = gl.createBuffer();
        // Texture state
        this.texture = null;
        this.textureSet = false;
        this.vertexCount = 0;
        // Initialize default uniforms
        gl.useProgram(this.prog);
        gl.uniform1i(this.useTexUnif, false);
        gl.uniform1i(this.swapUnif, false);
    }

    /**
     * Uploads vertex data to GPU buffers.
     * @param {number[]} verts Flat array of XYZ positions
     * @param {number[]} texs Flat array of UV coords
     * @param {number[]} norms Flat array of normals
     */
    setMesh(verts, texs, norms) {
        this.vertexCount = verts.length / 3;
        // Positions
        gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
        // Texture coords
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texBuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texs), gl.STATIC_DRAW);
        // Normals
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normBuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(norms), gl.STATIC_DRAW);
    }

    /**
     * Sets and initializes a texture from an image element.
     */
    setTexture(img) {
        gl.useProgram(this.prog);
        this.texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        // Upload image to GPU
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
        gl.generateMipmap(gl.TEXTURE_2D);
        // Texture filtering
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        // Bind sampler to texture unit 0
        gl.uniform1i(this.texUnif, 0);
        this.textureSet = true;
        gl.uniform1i(this.useTexUnif, true);
    }

    /** Enables or disables texture sampling. */
    showTexture(on) {
        gl.useProgram(this.prog);
        gl.uniform1i(this.useTexUnif, on && this.textureSet);
    }

    /** Toggles swapping Y/Z axes in shader. */
    swapYZ(flag) {
        gl.useProgram(this.prog);
        gl.uniform1i(this.swapUnif, flag);
    }

    /** Sets directional light vector. */
    setLightDir(x, y, z) {
        gl.useProgram(this.prog);
        gl.uniform3fv(this.lightDirUnif, [x, y, z]);
    }

    /** Sets shininess exponent for specular highlight. */
    setShininess(s) {
        gl.useProgram(this.prog);
        gl.uniform1f(this.shineUnif, s);
    }

    /** Renders the mesh using current buffers and uniforms. */
    draw(mvp, mv, normMat) {
        gl.useProgram(this.prog);
        // Upload transform matrices
        gl.uniformMatrix4fv(this.mvpUnif, false, mvp);
        gl.uniformMatrix4fv(this.mvUnif, false, mv);
        gl.uniformMatrix3fv(this.normMatUnif, false, normMat);
        // Bind and enable position buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuf);
        gl.vertexAttribPointer(this.posAttr, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.posAttr);
        // Bind and enable texture coord buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texBuf);
        gl.vertexAttribPointer(this.texAttr, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.texAttr);
        // Bind and enable normal buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normBuf);
        gl.vertexAttribPointer(this.normAttr, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.normAttr);
        // Bind texture if available
        if (this.textureSet) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.uniform1i(this.texUnif, 0);
        }
        // Draw triangles
        gl.drawArrays(gl.TRIANGLES, 0, this.vertexCount);
    }
}

/**
 * Advances the physics simulation by a time step dt.
 * Implements a mass-spring system with damping, gravity, and box collisions.
 * @param {number} dt Time step duration
 * @param {Vec3[]} positions Array of particle positions
 * @param {Vec3[]} velocities Array of particle velocities
 * @param {Object[]} springs Array of springs (with p0, p1, rest)
 * @param {number} stiffness Spring constant k
 * @param {number} damping Damping coefficient c
 * @param {number} particleMass Mass of each particle
 * @param {Vec3} gravity Gravitational acceleration vector
 * @param {number} restitution Coefficient of restitution for collisions
 */
function SimTimeStep(dt, positions, velocities, springs, stiffness, damping, particleMass, gravity, restitution) {
    // 1) Initialize forces to gravity for each particle
    const forces = new Array(positions.length);
    for (let i = 0; i < positions.length; i++) {
        forces[i] = gravity.mul(particleMass);
    }

    // 2) Compute spring (Hooke's law) and damping forces
    for (const s of springs) {
        const i0 = s.p0, i1 = s.p1;
        const x0 = positions[i0], x1 = positions[i1];
        const v0 = velocities[i0], v1 = velocities[i1];
        const delta = x1.sub(x0);            // Vector from p0 to p1
        const dist = delta.len();            // Current length of spring
        if (dist === 0) continue;            // Skip degenerate case
        const dir = delta.div(dist);        // Normalized direction
        const Fs = dir.mul(stiffness * (dist - s.rest));             // Hooke's force
        const Fd = dir.mul(damping * v1.sub(v0).dot(dir));          // Damping along spring
        const F = Fs.add(Fd);                // Total spring force
        // Accumulate forces on both endpoints
        forces[i0] = forces[i0].add(F);
        forces[i1] = forces[i1].sub(F);
    }

    // 3) Integrate using semi-implicit Euler
    for (let i = 0; i < positions.length; i++) {
        const accel = forces[i].div(particleMass);  // a = F/m
        velocities[i].inc(accel.mul(dt));          // v += a * dt
        positions[i].inc(velocities[i].mul(dt));   // x += v * dt
    }

    // 4) Handle collisions against the axis-aligned box [-1,1]^3
    for (let i = 0; i < positions.length; i++) {
        // Check each coordinate axis
        for (const axis of ['x', 'y', 'z']) {
            if (positions[i][axis] < -1) {
                positions[i][axis] = -1;                      // Push inside
                if (velocities[i][axis] < 0) velocities[i][axis] *= -restitution; // Reflect
            } else if (positions[i][axis] > 1) {
                positions[i][axis] = 1;
                if (velocities[i][axis] > 0) velocities[i][axis] *= -restitution;
            }
        }
    }
}
