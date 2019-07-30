const { extractInterfaces } = require('./interface-extractor.js');
const { generate } = require('./generator.js');
const { findFilesRecursively } = require('../common');
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
 * Finds all .ts and .tsx files in this folder and all subfolders.
 */
function findTypeScriptFilesRecursively() {
    return findFilesRecursively(['.ts', '.tsx']);
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