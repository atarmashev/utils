const { parseInterface } = require('./ts-file-parsing');
const { EXPORT_TYPES } = require('./enums/export-types.js');

/**
 * Removes comments from text. Comments could be \/\/ or \/\* \*\/ or \/\*\* \*\/
 * @param {string} rawText 
 */
function removeComments(rawText) {
    let text = rawText.slice();

    let indexOfStart = text.indexOf('/*');
    let indexOfEnd = text.indexOf('*/');
    while (indexOfStart > -1 && indexOfEnd > -1 && indexOfStart < indexOfEnd) {
        text = text.substr(0, indexOfStart - 1) + text.substr(indexOfEnd + 2);

        indexOfStart = text.indexOf('/*');
        indexOfEnd = text.indexOf('*/');
    }

    text = text.split('\n').filter(aString => !aString.trim().startsWith('//')).join('\n');

    return text;
}
/**
 * Removes repeating space symbols.
 * @param {string} rawText 
 */
function removeRepeatingSpaces(rawText) {
    return rawText.replace(/[ \t]+/g, ' ');
}
/**
 * Prepares text for the search of interface names. Text is heavily cut and couldn`t be used for
 * analysis of content of interface.
 * @param {string} text 
 */
function prepareTextForSerachForInterfaces(text) {
    return text
        .replace(/\{.+?\};/g, '{}')
        .replace(/'.+?';/g, '\'\'')
        .replace(/".+?";/g, '\"\"')
        .replace(/`.+?`;/g, '\`\`');
}
/**
 * Finds all names of interfaces declared in text, including not exported.
 * @param {string} preparedText 
 */
function findAllInterfaces(preparedText) {
    const splitText = preparedText.split('interface ');

    if (splitText.length === 1) {
        return [];
    }

    return splitText.slice(1).map(subText => {
        const indexOfSpace = subText.indexOf(' ');
        const indexOfBracket = subText.indexOf('{');
        const hasSpace = indexOfSpace > -1;
        const hasBracket = indexOfBracket > -1;
        if (!hasBracket) {
            throw new Error('Found error of .ts file syntax. Declaration of interface ends with nothing.');
        }
        const indexOfEnd = hasSpace ? 
            Math.min(indexOfSpace, indexOfBracket) : 
            indexOfBracket;

        const interfaceName = subText.substr(0, indexOfEnd);

        return interfaceName;
    });
}
/**
 * Has list of names and text on enterance. Returns list of names of interfaces which are exported in text.
 * Doesn`t count interfaces exported not under their own names.
 * @param {string} preparedText 
 * @param {string[]} interfaceNames 
 */
function selectExportedInterfaces(preparedText, interfaceNames) {
    return interfaceNames
        .map(name => ({
            name,
            serachStrings: {
                defaultLong: `export default interface ${name}`,
                defaultShort: `export default ${name}`,
                normal: `export interface ${name}`,
                equality: `export = ${name}`,
            }
        }))
        .map(entry => {
            if (preparedText.includes(entry.serachStrings.defaultShort) || preparedText.includes(entry.serachStrings.defaultLong)) {
                return {
                    name: entry.name,
                    typeOfExport: EXPORT_TYPES.DEFAULT,
                };
            }

            if (preparedText.includes(entry.serachStrings.normal)) {
                return {
                    name: entry.name,
                    typeOfExport: EXPORT_TYPES.NORMAL,
                };
            }

            if (preparedText.includes(entry.serachStrings.equality)) {
                return {
                    name: entry.name,
                    typeOfExport: EXPORT_TYPES.EQUALITY,
                };
            }

            return null;
        })
        .filter(entry => !!entry);
}
/**
 * Extracts exported interfaces from text. Prepared text should be used as argument (
 * without comments and repeating spaces).
 * @param {string} text 
 */
function extractInterfacesInternal(text) {
    const preparedText = prepareTextForSerachForInterfaces(text);
    const interfaceNames = findAllInterfaces(preparedText);
    const exportedInterfaceNames = selectExportedInterfaces(preparedText, interfaceNames);
    const result = exportedInterfaceNames
        .map(
            ({ name, typeOfExport }) => {
                const parts = parseInterface(text, name);

                return {
                    name,
                    parts,
                    typeOfExport,
                };
            }
        );

    return result;
}
/**
 * Extracts exported interfaces from text.
 * @param {string} rawText 
 */
exports.extractInterfaces = function(rawText) {
    let halfPreparedText = removeComments(rawText);
    const text = removeRepeatingSpaces(halfPreparedText);
    
    return extractInterfacesInternal(text);
}