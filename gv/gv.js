const { extractInterfaces } = require('./interface-extractor.js');
const { generate } = require('./generator.js');
const fileSystem = require("fs");

/**
 * Saves data to file.
 * @param {*} fileInfos 
 */
function saveFileInfos(fileInfos) {
    fileInfos.forEach(fileInfo => {
        try {
            fileSystem.writeFileSync(`./${fileInfo.fileName}`, fileInfo.text);
        } catch (error) {
            console.error(`Error of writing to file ${fileName}.`, error);
        }
    });
}
/**
 * Find all .ts files in this folder and all subfolders.
 */
function findTypeScriptFilesRecursively() {
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
                } else if (fileName.endsWith('.ts')) {
                    tsFiles.push(fileNameAndPath);
                }
            });

            if (tsFiles.length > 1000 || folders.length > 1000) {
                throw new Error(`The project is too large. Found ${tsFiles.length} .ts files in ${folders.length} folders. Set --max_files option to large number (>>1000) to avoid this check.`);
            }
        } catch (error) {
            console.error('Error in reading structure of files of the project.');
            return [];
        }
    }
    
    return tsFiles;
}

/**
 * Reads all .ts files in current folder and subfolders, finds all exported interfaces and generates validators for them. 
 */
exports.generateValidators = function() {
    findTypeScriptFilesRecursively().forEach(fileName => {
        let rawText;
        try {
            rawText = fileSystem.readFileSync(`./${fileName}`, "utf8");
        } catch (error) {
            console.error(`Could not read file ${fileName}.`, error);
            return;
        }
    
        let interfaces;
        try {
            interfaces = extractInterfaces(rawText);
        } catch (error) {
            console.error(`Could not analyse file ${fileName}.`, error);
            return;
        }
    
        if (interfaces.length) {
            console.log(`Generation of validators for exported interfaces from file ${fileName}.`);
    
            const fileInfos = interfaces.map(interfaceInfo => { 
                try {
                    return generate(interfaceInfo, fileName); 
                } catch (error) {
                    console.error(`Error of generation of validators for ${fileName}.`, error, interfaceInfo);
                    return null;
                }
            });
            
            saveFileInfos(fileInfos.filter(fileInfos => !!fileInfos));
        } else {
            console.log(`File ${fileName} has no exported interfaces.`);
        }
    });
}