// This function takes the projection matrix, the translation, and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// The given projection matrix is also a 4x4 matrix stored as an array in column-major order.
// You can use the MatrixMult function defined in project4.html to multiply two 4x4 matrices in the same format.
function GetModelViewProjection( projectionMatrix, translationX, translationY, translationZ, rotationX, rotationY )
{
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

    // Applica le trasformazioni nell'ordine: Traslazione -> Rotazione Y -> Rotazione X
    var modelViewMatrix = MatrixMult(trans, MatrixMult(rotateX, rotateY));

    // Infine, moltiplica per la matrice di proiezione
    var mvp = MatrixMult(projectionMatrix, modelViewMatrix);

    return mvp;
}

// [TO-DO] Complete the implementation of the following class.
class MeshDrawer {
    constructor() {
        // Compilare e inizializzare il programma shader per la mesh
        this.prog = InitShaderProgram(meshVS, meshFS);

        // Ottenere i riferimenti per gli attributi e uniformi nel programma shader
        this.mvp = gl.getUniformLocation(this.prog, 'mvp');
        this.vertPos = gl.getAttribLocation(this.prog, 'pos');
        this.texCoord = gl.getAttribLocation(this.prog, 'texCoord');
        this.useTexture = gl.getUniformLocation(this.prog, 'useTexture');

        // Creare i buffer per la mesh
        this.positionBuffer = gl.createBuffer();
        this.texCoordBuffer = gl.createBuffer();

        // Inizializzare la texture a null
        this.texture = null;
    }

    // Funzione per impostare la mesh con i buffer di posizione dei vertici e le coordinate delle texture
    setMesh(vertPos, texCoords) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

        this.numTriangles = vertPos.length / 3; // Numero di triangoli
    }

    // Funzione per abilitare/disabilitare l'uso della texture
    showTexture(show) {
        gl.useProgram(this.prog);
        gl.uniform1i(this.useTexture, show ? 1 : 0);
    }

    // Funzione per disegnare la mesh nella scena
    draw(trans) {
        gl.useProgram(this.prog);
        gl.uniformMatrix4fv(this.mvp, false, trans);

        // Posizionare i vertici della mesh
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.vertexAttribPointer(this.vertPos, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.vertPos);

        // Posizionare le coordinate delle texture
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.vertexAttribPointer(this.texCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.texCoord);

        // Se c'è una texture, applicarla
        if (this.texture) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.uniform1i(this.useTexture, 1); // Attivare la texture
        }

        // Disegnare la mesh
        gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);
    }

    // Funzione per impostare la texture della mesh
    setTexture(img) {
        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);

        // Impostazioni per la texture
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }

    // Funzione per scambiare gli assi Y e Z per la mesh
    swapYZ(swap) {
        gl.useProgram(this.prog);
        gl.uniform1i(this.useTexture, swap ? 1 : 0);
    }
}
var meshVS = `
    attribute vec3 pos;
    attribute vec2 texCoord;
    uniform mat4 mvp;
    varying vec2 vTexCoord;
    void main() {
        gl_Position = mvp * vec4(pos, 1);
        vTexCoord = texCoord;
    }
`;
var meshFS = `
    precision mediump float;
    uniform sampler2D texture;
    uniform bool useTexture;
    varying vec2 vTexCoord;
    void main() {
        // Modifica del colore in base alla profondità (canale verde)
        if (useTexture) {
            // Usa la texture e modula il colore in base alla profondità (componente z di gl_FragCoord)
            gl_FragColor = texture2D(texture, vTexCoord);
            gl_FragColor.g = gl_FragCoord.z * gl_FragCoord.z; // Modula il verde in base alla profondità
        } else {
            // Colore di base con modulazione della profondità (inserire il verde in base alla profondità)
            gl_FragColor = vec4(1.0, gl_FragCoord.z * gl_FragCoord.z, 0.0, 1.0);
        }
    }
`;
