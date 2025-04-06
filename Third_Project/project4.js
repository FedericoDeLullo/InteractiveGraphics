// Funzione per ottenere la matrice di ModelViewProjection
function GetModelViewProjection(projectionMatrix, translationX, translationY, translationZ, rotationX, rotationY) {
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

// Classe MeshDrawer per disegnare e gestire il modello 3D
class MeshDrawer {
    constructor() {
        this.prog = InitShaderProgram(meshVS, meshFS);
        this.mvp = gl.getUniformLocation(this.prog, 'mvp');
        this.vertPos = gl.getAttribLocation(this.prog, 'pos');
        this.texCoord = gl.getAttribLocation(this.prog, 'texCoord');
        this.useTexture = gl.getUniformLocation(this.prog, 'useTexture');

        this.positionBuffer = gl.createBuffer();
        this.texCoordBuffer = gl.createBuffer();
        this.normalBuffer = gl.createBuffer();

        this.texture = null;
        this.numTriangles = 0; // Inizializza a 0
        this.vertexCount = 0; // Tieni traccia del numero di vertici
    }

    // Imposta la mesh con i vertici e le coordinate delle texture
    setMesh(vertPos, texCoords) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

        let normalizedTexCoords = [];
        if (texCoords) {
            for (let i = 0; i < texCoords.length; i += 2) {
                // Normalizzazione delle coordinate UV
                normalizedTexCoords.push(texCoords[i]); // U
                normalizedTexCoords.push(texCoords[i + 1]); // V
            }
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalizedTexCoords), gl.STATIC_DRAW);

        this.vertexCount = vertPos.length / 3;
    }

    // Mostra o nasconde la texture

// Funzione per mostrare o nascondere la texture
showTexture(show) {
    gl.useProgram(this.prog); // Assicurati di usare il programma shader corretto

    // Se il flag è true, la texture deve essere visibile
    if (show && this.texture) {
        gl.uniform1i(this.useTexture, 1);  // Attivare la texture
    } else {
        gl.uniform1i(this.useTexture, 0);  // Disattivare la texture
    }
}

    // Disegna il modello 3D usando la trasformazione passata
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
        if (this.texture && this.useTexture !== undefined) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.uniform1i(this.useTexture, 1); // Attivare la texture
        }

        // Disegna la mesh usando il numero di vertici
        gl.drawArrays(gl.TRIANGLES, 0, this.vertexCount);
    }

    setTexture(img) {
        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    }

    // Funzione per lo scambio degli assi Y e Z
    // Funzione per lo scambio degli assi Y e Z
    swapYZ(swap) {
        gl.useProgram(this.prog); // Assicurati di usare il programma shader corretto

        // Se swap è true, invertiamo gli assi Y e Z
        if (swap) {
            let newVertPos = [];
            for (let i = 0; i < this.vertexCount * 3; i += 3) {
                newVertPos.push(this.vertPos[i]);     // x
                newVertPos.push(this.vertPos[i + 2]); // z (diventa y)
                newVertPos.push(this.vertPos[i + 1]); // y (diventa z)
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(newVertPos), gl.STATIC_DRAW);
            this.vertPos = newVertPos;  // Aggiorna i vertici memorizzati
        } else {
            // Se non vogliamo fare lo swap, ripristiniamo le coordinate originali
            gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertPos), gl.STATIC_DRAW);
        }
    }

}

// Vertex Shader
var meshVS = `
attribute vec3 pos;         // Posizione del vertice
attribute vec2 texCoord;    // Coordinate UV del vertice
uniform mat4 mvp;           // Matrice di modello, visualizzazione e proiezione
varying vec2 vTexCoord;     // Variabile per passare le coordinate UV al fragment shader

void main() {
    // Calcola la posizione finale del vertice
    gl_Position = mvp * vec4(pos, 1.0);

    // Passa le coordinate UV al fragment shader
    vTexCoord = texCoord;
}
`;

// Fragment Shader
var meshFS = `
precision mediump float;

uniform sampler2D texture;   // Sampler per la texture
uniform bool useTexture;     // Variabile per decidere se usare la texture o meno
varying vec2 vTexCoord;      // Coordinate UV passate dal vertex shader

void main() {
    if (useTexture) {
        // Applica la texture utilizzando le coordinate UV
        vec4 texColor = texture2D(texture, vTexCoord);

        // Imposta il colore finale solo con la texture
        gl_FragColor = texColor;
    } else {
        // Se non c'è texture, usa un colore base con modulazione della profondità
        gl_FragColor = vec4(1.0, gl_FragCoord.z * gl_FragCoord.z, 0.0, 1.0);
    }
}


`;
