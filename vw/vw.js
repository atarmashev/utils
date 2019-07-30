const { findFilesRecursively } = require('../common');
const { replacePX } = require('./replacer');
const fileSystem = require("fs");

/**
 * Returns names of style files with path.
 */
function findStyleFiles() {
    return findFilesRecursively(['.css', '.sass', '.scss', '.less']);
}
/**
 * Converts px to vw in all .css, .scss, .sass and .less files.
 */
exports.convertPXToVW = function() {
    console.log('Enter width of the layout in pixels. Example: 1280');
    process.openStdin().addListener('data', (value) => {
        const command = value.toString().trim();

        if (isNaN(+command)) {
            console.log('Number required. Terminating.');
            process.exit();
        }
    
        console.log('Searching for .css, .scss, .sass, .less files.');
        const files = findStyleFiles();
        console.log('Found files: ' + files.length);
        console.log('Transforming:');

        files.forEach(fileName => {
            console.log(`\t${fileName}.`);
            try {
                const text = fileSystem.readFileSync(fileName).toString();
                const newText = replacePX(text, +command);
                fileSystem.writeFileSync(fileName, newText);
            } catch(error) {
                console.error('Could not replace px with vw. ', error);
            }
        });
    
        process.exit();
    });
    
}