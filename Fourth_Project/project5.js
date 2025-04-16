// Funzione per calcolare la matrice ModelView (MVP)
function GetModelViewMatrix(translationX, translationY, translationZ, rotationX, rotationY) {
    // Matrice di traslazione
    var trans = [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        translationX, translationY, translationZ, 1
    ];

    // Matrice di rotazione attorno all'asse X
    var rotateX = [
        1, 0, 0, 0,
        0, Math.cos(rotationX), Math.sin(rotationX), 0,
        0, -Math.sin(rotationX), Math.cos(rotationX), 0,
        0, 0, 0, 1
    ];

    // Matrice di rotazione attorno all'asse Y
    var rotateY = [
        Math.cos(rotationY), 0, -Math.sin(rotationY), 0,
        0, 1, 0, 0,
        Math.sin(rotationY), 0, Math.cos(rotationY), 0,
        0, 0, 0, 1
    ];

    // Applica le trasformazioni: Traslazione -> Rotazione X -> Rotazione Y
    var modelViewMatrix = MatrixMult(trans, MatrixMult(rotateX, rotateY));

    // Ritorna la matrice ModelView
    return modelViewMatrix;
}

// Classe responsabile per disegnare una mesh 3D con texture
class MeshDrawer {
    constructor() {
        this.prog = InitShaderProgram(meshVS, meshFS); // Compila gli shader e linka il programma

        // Posizioni degli attributi per posizione, coordinate della texture e normali
        this.posAttr = gl.getAttribLocation(this.prog, 'pos');
        this.texAttr = gl.getAttribLocation(this.prog, 'texCoord');
        this.normAttr = gl.getAttribLocation(this.prog, 'normal'); // Aggiungi attributo normale

        // Posizioni degli uniform per MVP, swap, texture, luce e shininess
        this.mvpUniform = gl.getUniformLocation(this.prog, 'mvp');
        this.swapUniform = gl.getUniformLocation(this.prog, 'swap');
        this.useTexUniform = gl.getUniformLocation(this.prog, 'useTexture');
        this.texSamplerUniform = gl.getUniformLocation(this.prog, 'texture');
        this.lightDirUniform = gl.getUniformLocation(this.prog, 'lightDir');
        this.shininessUniform = gl.getUniformLocation(this.prog, 'shininess');

        // Buffer per posizioni dei vertici, coordinate della texture e normali
        this.posBuffer = gl.createBuffer();
        this.texBuffer = gl.createBuffer();
        this.normBuffer = gl.createBuffer(); // Aggiungi buffer per le normali

        // Variabili per la texture
        this.texture = null;
        this.textureSet = false;
        this.vertexCount = 0;

        // Inizializza i valori di default per gli shader
        gl.useProgram(this.prog);
        gl.uniform1i(this.useTexUniform, false);
        gl.uniform1i(this.swapUniform, false);
    }

    // Imposta la geometria della mesh (posizioni, coordinate texture e normali)
    setMesh(vertPos, texCoords, normals) {
        this.vertexCount = vertPos.length / 3;

        // Buffer delle posizioni dei vertici
        gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

        // Buffer delle coordinate della texture
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

        // Buffer delle normali
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
    }

    // Carica la texture nella GPU e imposta i parametri della texture
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

        // Attiva la texture
        gl.uniform1i(this.useTexUniform, true);
    }

    // Mostra o nasconde la texture
    showTexture(show) {
        gl.useProgram(this.prog);
        gl.uniform1i(this.useTexUniform, show && this.textureSet);
    }

    // Swap tra Y e Z nel vertex shader
    swapYZ(swap) {
        gl.useProgram(this.prog);
        gl.uniform1i(this.swapUniform, swap);
    }

    // Imposta la direzione della luce nello spazio della camera
    setLightDir(x, y, z) {
        gl.useProgram(this.prog);
        gl.uniform3fv(this.lightDirUniform, new Float32Array([x, y, z]));
    }

    // Imposta il parametro di shininess per il modello Blinn
    setShininess(shininess) {
        gl.useProgram(this.prog);
        gl.uniform1f(this.shininessUniform, shininess);
    }

    // Renderizza la mesh con le impostazioni e trasformazioni correnti
    draw(matrixMVP, matrixMV, matrixNormal) {
        gl.useProgram(this.prog);

        // Imposta la matrice MVP
        gl.uniformMatrix4fv(this.mvpUniform, false, matrixMVP);

        // Imposta la matrice delle normali
        gl.uniformMatrix3fv(gl.getUniformLocation(this.prog, 'normalMatrix'), false, matrixNormal);

        // Associa le posizioni dei vertici
        gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuffer);
        gl.vertexAttribPointer(this.posAttr, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.posAttr);

        // Associa le coordinate della texture
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texBuffer);
        gl.vertexAttribPointer(this.texAttr, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.texAttr);

        // Associa le normali
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normBuffer);
        gl.vertexAttribPointer(this.normAttr, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.normAttr);

        // Se la texture è settata, associala
        if (this.textureSet) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.uniform1i(this.texSamplerUniform, 0);
        }

        // Disegna la mesh
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
