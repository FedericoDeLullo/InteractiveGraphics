// Function to create a 3x3 transformation matrix in column-major order
function GetTransform(positionX, positionY, rotation, scale) {
    let rad = (rotation * Math.PI) / 180;
    let cos = Math.cos(rad);
    let sin = Math.sin(rad);

    // Column-major order transformation matrix
    return [
        scale * cos, scale * sin, 0,  // First column
       -scale * sin, scale * cos, 0,  // Second column
        positionX, positionY, 1       // Third column
    ];
}

function ApplyTransform(trans1, trans2) {
    let result = new Array(9).fill(0);

    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
            for (let k = 0; k < 3; k++) {
                result[col * 3 + row] += trans2[k * 3 + row] * trans1[col * 3 + k];
            }
        }
    }
    return result;
}

