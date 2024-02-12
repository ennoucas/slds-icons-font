const fs = require('fs-extra');
const path = require('path');
const svgPathBbox = require('svg-path-bbox');

const inputDir = 'tmp'; // Update this path
const outputDir = 'tmp'; // Update this path

console.log(`Reading from: ${inputDir}`);
console.log(`Writing to: ${outputDir}`);

// Read and process each SVG file
fs.readdir(inputDir, (err, files) => {
    if (err) {
        console.error('Error reading the input directory:', err);
        return;
    }

    if (files.length === 0) {
        console.log('No files found in the input directory.');
        return;
    }

    const svgFiles = files.filter(file => path.extname(file).toLowerCase() === '.svg');
    if (svgFiles.length === 0) {
        console.log('No SVG files found in the input directory.');
        return;
    }

    console.log(`Found ${svgFiles.length} SVG file(s) to process.`);

    svgFiles.forEach(file => {
        const filePath = path.join(inputDir, file);
        const outputPath = path.join(outputDir, file);

        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                console.error(`Error reading ${file}:`, err);
                return;
            }
            const updatedSVG = updateViewBox(data);
            fs.writeFile(outputPath, updatedSVG, err => {
                if (err) {
                    console.error(`Error writing ${file}:`, err);
                    return;
                }
                console.log(`${file} has been processed and saved.`);
            });
        });
    });
});


function updateViewBox(svgData) {
    const pathRegex = /<path[^>]+d="([^"]+)"/g;
    let match;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    // Calculate bounding box for all paths
    while ((match = pathRegex.exec(svgData)) !== null) {
        const [x0, y0, x1, y1] = svgPathBbox(match[1]);
        if (x0 < minX) minX = x0;
        if (x1 > maxX) maxX = x1;
        if (y0 < minY) minY = y0;
        if (y1 > maxY) maxY = y1;
    }

    if (minX === Infinity) {
        console.error('No paths found in SVG.');
        return svgData; // Return original data if no paths found
    }

    const height = maxY - minY
    const width = maxX - minX
    // Correctly calculate new viewBox that fits all content
    const newViewBox = `viewBox="${minX} ${minY} ${width} ${height}" preserveAspectRatio="xMidYMid meet"`;

    // console.log("newViewBox", newViewBox)

    // Replace or add viewBox in the SVG tag
    const svgTagRegex = /<svg([^>]*)>/i;
    if (svgTagRegex.test(svgData)) {
        // If <svg> tag exists, replace or add viewBox
        return svgData.replace(svgTagRegex, match => {
            return match.replace(/width="[^"]*"/, `width="${width}"`).replace(/height="[^"]*"/, `height="${height}"`).replace(/viewBox="[^"]*"/, newViewBox)
        });
    } else {
        // If no <svg> tag found (unlikely), return original data
        return svgData;
    }
}