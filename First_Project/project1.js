function composite(bgImg, fgImg, fgOpac, fgPos) {
    // Get the data of the background and foreground images
    const bgData = bgImg.data;  // RGBA data array for the background image
    const fgData = fgImg.data;  // RGBA data array for the foreground image

    const bgWidth = bgImg.width;  // Width of the background image
    const bgHeight = bgImg.height; // Height of the background image

    const fgWidth = fgImg.width;  // Width of the foreground image
    const fgHeight = fgImg.height; // Height of the foreground image

    // Calculate the limits of the foreground image
    const fgLeft = fgPos.x;
    const fgTop = fgPos.y;

    // Iterate over all pixels of the foreground image
    for (let y = 0; y < fgHeight; y++) {
        for (let x = 0; x < fgWidth; x++) {
            // Calculate the position in the background based on the foreground position
            const bgX = fgLeft + x;
            const bgY = fgTop + y;

            // Check if the foreground pixel is within the boundaries of the background
            if (bgX >= 0 && bgX < bgWidth && bgY >= 0 && bgY < bgHeight) {
                // Index in the background (data is RGBA, so 4 values per pixel)
                const bgIndex = (bgY * bgWidth + bgX) * 4;
                // Index in the foreground
                const fgIndex = (y * fgWidth + x) * 4;

                // Get RGBA values for the foreground and background
                const fgR = fgData[fgIndex];       // Red of the foreground
                const fgG = fgData[fgIndex + 1];   // Green of the foreground
                const fgB = fgData[fgIndex + 2];   // Blue of the foreground
                const fgA = fgData[fgIndex + 3];   // Alpha of the foreground

                const bgR = bgData[bgIndex];       // Red of the background
                const bgG = bgData[bgIndex + 1];   // Green of the background
                const bgB = bgData[bgIndex + 2];   // Blue of the background
                const bgA = bgData[bgIndex + 3];   // Alpha of the background (usually 255 for the background)

                // Calculate alpha blending between the foreground and the background
                const alphaFg = fgA / 255 * fgOpac;
                const alphaBg = 1 - alphaFg;

                // Compute the new pixel values
                const blendedR = alphaFg * fgR + alphaBg * bgR;
                const blendedG = alphaFg * fgG + alphaBg * bgG;
                const blendedB = alphaFg * fgB + alphaBg * bgB;
                const blendedA = Math.max(alphaFg * 255, bgA); // Keep the foreground alpha if it is higher

                // Write the blended values into the background
                bgData[bgIndex] = blendedR;
                bgData[bgIndex + 1] = blendedG;
                bgData[bgIndex + 2] = blendedB;
                bgData[bgIndex + 3] = blendedA;
            }
        }
    }
}
