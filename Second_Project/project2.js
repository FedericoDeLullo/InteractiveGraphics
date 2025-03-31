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
    // Initialize the result array with 9 zeros (3x3 matrix)
    let result = new Array(9).fill(0);

    // Loop over rows (0 to 2) of the resulting matrix
    for (let row = 0; row < 3; row++) {
        // Loop over columns (0 to 2) of the resulting matrix
        for (let col = 0; col < 3; col++) {
            // Loop over the elements to compute the matrix multiplication
            for (let k = 0; k < 3; k++) {
                // Multiply corresponding elements from trans1 and trans2 and accumulate the result
                result[col * 3 + row] += trans2[k * 3 + row] * trans1[col * 3 + k];
            }
        }
    }

    // Return the resulting transformed matrix
    return result;
}


