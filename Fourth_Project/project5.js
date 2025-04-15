function GetModelViewMatrix(translationX, translationY, translationZ, rotationX, rotationY) {
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

    // Translation matrix
    var trans = [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        translationX, translationY, translationZ, 1
    ];

    // Final MV matrix: trans * (rotateX * rotateY)
    var mv = MatrixMult(trans, MatrixMult(rotateX, rotateY));

    return mv;
}

class MeshDrawer {
    constructor() {
        // Inizializza shader program
        this.prog = InitShaderProgram(meshVS, meshFS);

        // Attributi e uniform location
        this.mvp = gl.getUniformLocation(this.prog, 'mvp');
        this.mv = gl.getUniformLocation(this.prog, 'mv');
        this.normMat = gl.getUniformLocation(this.prog, 'normalMatrix');
        this.useTextureUniform = gl.getUniformLocation(this.prog, 'useTexture');
        this.lightDirUniform = gl.getUniformLocation(this.prog, 'lightDir');
        this.shininessUniform = gl.getUniformLocation(this.prog, 'shininess');
        this.swapYZUniform = gl.getUniformLocation(this.prog, 'swapYZ');

        this.posAttrib = gl.getAttribLocation(this.prog, 'pos');
        this.texAttrib = gl.getAttribLocation(this.prog, 'texCoord');
        this.normAttrib = gl.getAttribLocation(this.prog, 'normal');

        // Buffer
        this.positionBuffer = gl.createBuffer();
        this.texCoordBuffer = gl.createBuffer();
        this.normalBuffer = gl.createBuffer();

        // Altri stati
        this.texture = null;
        this.textureEnabled = false;
        this.numTriangles = 0;
        this.meshVertices = [];
    }

    setMesh(vertPos, texCoords, normals) {
        this.numTriangles = vertPos.length / 3;
        this.meshVertices = vertPos.slice(); // per swapYZ

        gl.useProgram(this.prog);

        // Position buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

        // Texture coordinates
        if (texCoords) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
        }

        // Normals
        if (normals) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
        }
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

    draw(matrixMVP, matrixMV, matrixNormal) {
        gl.useProgram(this.prog);

        // Uniform matrices
        gl.uniformMatrix4fv(this.mvp, false, matrixMVP);
        gl.uniformMatrix4fv(this.mv, false, matrixMV);
        gl.uniformMatrix3fv(this.normMat, false, matrixNormal);

        // Vertex positions
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.vertexAttribPointer(this.posAttrib, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.posAttrib);

        // Texture coordinates
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.vertexAttribPointer(this.texAttrib, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.texAttrib);

        // Normals
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.vertexAttribPointer(this.normAttrib, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.normAttrib);

        // Texture
        if (this.texture && this.textureEnabled) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.uniform1i(this.useTextureUniform, 1);
        } else {
            gl.uniform1i(this.useTextureUniform, 0);
        }

        gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);
    }

    setTexture(img) {
        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        this.textureEnabled = true;

        gl.useProgram(this.prog);
        gl.uniform1i(this.useTextureUniform, 1);
    }

    showTexture(show) {
        this.textureEnabled = show;
        gl.useProgram(this.prog);
        gl.uniform1i(this.useTextureUniform, show ? 1 : 0);
    }

    setLightDir(x, y, z) {
        gl.useProgram(this.prog);
        gl.uniform3f(this.lightDirUniform, x, y, z);
    }

    setShininess(shininess) {
        gl.useProgram(this.prog);
        gl.uniform1f(this.shininessUniform, shininess);
    }
}
// Vertex Shader
var meshVS = `
attribute vec3 pos;
attribute vec2 texCoord;
attribute vec3 normal;

uniform mat4 mvp;
uniform mat4 mv;
uniform mat3 normalMatrix;

uniform bool swapYZ;

varying vec2 vTexCoord;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
    vec3 posWorld = pos;
    if (swapYZ) {
        posWorld = vec3(pos.x, pos.z, pos.y);
    }

    vPosition = vec3(mv * vec4(posWorld, 1.0));
    vNormal = normalize(normalMatrix * normal);
    vTexCoord = texCoord;
    gl_Position = mvp * vec4(posWorld, 1.0);
}
`;

// Fragment Shader
var meshFS = `
precision mediump float;

uniform bool useTexture;
uniform sampler2D texture;
uniform vec3 lightDir;
uniform float shininess;

varying vec2 vTexCoord;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
    vec3 norm = normalize(vNormal);
    vec3 L = normalize(lightDir);
    vec3 V = normalize(-vPosition);
    vec3 H = normalize(L + V);

    float NdotL = max(dot(norm, L), 0.0);
    float NdotH = max(dot(norm, H), 0.0);

    vec3 Kd = useTexture ? texture2D(texture, vTexCoord).rgb : vec3(1.0);
    vec3 Ks = vec3(1.0);

    vec3 diffuse = Kd * NdotL;
    vec3 specular = Ks * pow(NdotH, shininess);

    vec3 color = diffuse + specular;
    gl_FragColor = vec4(color, 1.0);
}
`;
