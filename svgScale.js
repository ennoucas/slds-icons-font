import fs from 'fs-extra';
import path from 'path';
import { createSVGWindow } from 'svgdom'
import { SVG, registerWindow } from '@svgdotjs/svg.js'

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
    const window = createSVGWindow()
    const document = window.document
    registerWindow(window, document)
    const canvas = SVG(document.documentElement)
    canvas.svg(svgData)
    let svg = document.querySelector('svg');
    const { xMin, xMax, yMin, yMax } = [...svg.children].reduce((acc, el) => {
        const { x, y, width, height } = el.getBBox();
        if (!acc.xMin || x < acc.xMin) acc.xMin = x;
        if (!acc.xMax || x + width > acc.xMax) acc.xMax = x + width;
        if (!acc.yMin || y < acc.yMin) acc.yMin = y;
        if (!acc.yMax || y + height > acc.yMax) acc.yMax = y + height;
        return acc;
      }, {});
    // Correctly calculate new viewBox that fits all content
    const newViewBox = `viewBox="${xMin} ${yMin} ${xMax - xMin} ${yMax - yMin}"`;

    // console.log("newViewBox", newViewBox)

    // Replace or add viewBox in the SVG tag
    const svgTagRegex = /<svg([^>]*)>/i;
    if (svgTagRegex.test(svgData)) {
        // If <svg> tag exists, replace or add viewBox
        return svgData.replace(svgTagRegex, match => {
            return match.replace(/width="[^"]*"/, `width="${xMax - xMin}"`).replace(/height="[^"]*"/, `height="${yMax - yMin}"`).replace(/viewBox="[^"]*"/, newViewBox)
        });
    } else {
        // If no <svg> tag found (unlikely), return original data
        return svgData;
    }
}