
const fileSystem = require("fs");

/**
 * Returns if the file has any of given resolutions.
 * @param {string} fileName 
 * @param {string[]} resolutions 
 */
function endWithAnyOf(fileName, resolutions) {
    return resolutions.some(resolution => fileName.endsWith(resolution));
}
/**
 * Finds all files with given resolution in this folder and all subfolders.
 * @param {string[]} resolutions 
 */
exports.findFilesRecursively = function(resolutions) {
    const tsFiles = [];
    const folders = ['.'];

    while (folders.length > 0) {
        const currentFolder = folders.pop();

        try {
            const allFilesInCurrentFolder = fileSystem.readdirSync(currentFolder);

            allFilesInCurrentFolder.forEach(fileName => {
                const fileNameAndPath = currentFolder === '.' ? 
                    `${fileName}` : 
                    `${currentFolder}/${fileName}`;
                
                if (!fileName.includes('.') && fileName !== 'node_modules') { // we should not search in node_modules
                    folders.push(fileNameAndPath);
                } else if (endWithAnyOf(fileName, resolutions)) {
                    tsFiles.push(fileNameAndPath);
                }
            });

            if (tsFiles.length > 1000 || folders.length > 1000) {
                console.error(`The project is too large. Found ${tsFiles.length} .ts files in ${folders.length} folders. Set --max_files option to large number (>>1000) to avoid this check.`);
                return [];
            }
        } catch (error) {
            // we simply continue if we can`t open folder or it was not a folder
            continue;
        }
    }
    
    return tsFiles;
}