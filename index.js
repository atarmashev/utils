#!/usr/bin/env node

const { extractInterfaces } = require('./text-transformations.js');
const { generate } = require('./generator.js');
const fileSystem = require("fs");

/**
 * Choosing .ts files
 * @param {string[]} data 
 */
function chooseFiles(data) {
    let files = data.filter(fileName => fileName.endsWith('.ts'));

    if (files.length === 0) {
        console.log('No .ts files in this folder.');
    } else if (files.length > 100) {
        console.log('Too many .ts files in this folder. Working with first 100.');
        files = files.slice(0, 100);
    }

    return files;
}
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

fileSystem.readdir('./', (error, data) => {
    if (error) {
        console.error('Error of reading of file', error);
        return;
    }

    chooseFiles(data).forEach(fileName => {
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
});