const { processRules, postProcessRules } = require('./types-transform.js');
const { RULES } = require('./rules.js');
const { TYPES } = require('./types.js');
const { EXPORT_TYPES } = require('./export-types.js');

/**
 * Converts information of types in form of enumeration to list of validation rules for this types.
 * @param {Set<number>} types 
 */
function typesToRules(types) {
    if (types.has(TYPES.ANY)) {
        return new Set([RULES.NO_RESTRICTIONS]);
    }

    // adding
    const result = processRules(types);
    // mutual influence of restrictions and permissions
    postProcessRules(result);

    return result;
}
/**
 * Converts information of types in form of strings to list of validation rules for this types.
 * @param {string[]} rawTypes 
 */
function rawTypesToRules(rawTypes) {
    const types = rawTypes.map(rawType => {
        if (rawType.includes('[]')) {
            return TYPES.ARRAY;
        }
        if (rawType.startsWith('Array<') && rawType.endsWith('>')) {
            return TYPES.ARRAY;
        }
        if (rawType.includes('=>')) {
            return TYPES.FUNCTION;
        }
        if (rawType.includes('<')) {
            return TYPES.OBJECT;
        }

        switch(rawType) {
            case 'any': return TYPES.ANY;
            case 'boolean': return TYPES.BOOLEAN;
            case 'Date': return TYPES.DATE;
            case 'false': return TYPES.FALSE;
            case 'Function': return TYPES.FUNCTION;
            case 'null': return TYPES.NULL;
            case 'number': return TYPES.NUMBER;
            case 'Object': return TYPES.OBJECT;
            case 'string': return TYPES.STRING;
            case 'true': return TYPES.TRUE;
            case 'undefined': return TYPES.UNDEFINED;
            default: return TYPES.NOT_RECOGNIZED;
        }
    });

    const setOfTypes = new Set(types);

    return Array.from(typesToRules(setOfTypes));
}
/**
 * Returns list of inexes of | separators in declaration of type of field.
 * @param {string} value 
 */
function findSeparatorsInTypeDeclaration(value) {
    const result = [];

    let isInsideAngularBrackets = 0;
    let isInsideCircularBrackets = 0;
    for (let a = 0; a < value.length; ++a) {
        const currentSymbol = value[a];
        // if angular bracket opened
        if (currentSymbol === '<') {
            isInsideAngularBrackets++;
        } 
        // if angular bracket closed
        else if (currentSymbol === '>') {
            if (!(a > 0 && value[a - 1] === '=')) { // could find =>
                isInsideAngularBrackets--;
            }
        } 
        // if circular bracket opened
        else if (currentSymbol === '(') {
            isInsideCircularBrackets++;
        } 
        // if circular bracket closed
        else if (currentSymbol === ')') {
            isInsideCircularBrackets--;
        }
        // if separator found
        else if (currentSymbol === '|' && isInsideAngularBrackets === 0 && isInsideCircularBrackets === 0) {
            result.push(a);
        }
        // error of angular brackets - too many closing
        else if (isInsideAngularBrackets < 0) {
            throw new Error('Found error of .ts file syntax. Wrong arrage of <> brackets in expression ' + value);
        } 
        // error of circular brackets - too many closing
        else if (isInsideCircularBrackets < 0) {
            throw new Error('Found error of .ts file syntax. Wrong arrage of () brackets in expression ' + value);
        }
    }
    // error of angular brackets - too many opening
    if (isInsideAngularBrackets > 0) {
        throw new Error('Found error of .ts file syntax. Wrong arrage of <> brackets in expression ' + value);
    } 
    // error of circular brackets - too many opening
    if (isInsideCircularBrackets > 0) {
        throw new Error('Found error of .ts file syntax. Wrong arrage of () brackets in expression ' + value);
    }

    return result;
}
/**
 * Parses string with declaration of field`s type.
 * @param {string} value 
 */
function splitTypeString(value) {
    const separatorsIndexes = findSeparatorsInTypeDeclaration(value);

    const result = [];

    let start = 0;
    for (let a = 0; a < separatorsIndexes.length; ++a) {
        const end = separatorsIndexes[a];
        const substr = value.substring(start, end);
        result.push(substr);
        start = end + 1;
    }
    result.push(value.substr(start));
    
    return result;
}
/**
 * Parses string with declaration of field`s type and returns corresponding array of rules.
 * @param {string} value 
 */
function parseTypeString(value) {
    const rawTypes = splitTypeString(value);

    return rawTypesToRules(rawTypes);
}
/**
 * Splits name of field and the declaration of its type.
 * @param {string} part 
 */
function splitNameAndValue(part) {
    const index = part.indexOf(':');
    if (index === -1) {
        throw new Error('Found error of .ts file syntax. Wrong part of interface: ' + part);
    }

    const name = part.substr(0, index);
    const value = part.substr(0);
    if (!name || !value) {
        throw new Error('Found error of .ts file syntax. Wrong part of interface: ' + part);
    }

    return {
        name,
        value
    };
}
/**
 * Analysis body of the interface. Body should be started from { and be ended with }.
 * @param {string} interfaceBody 
 */
function parseInterfaceBody(interfaceBody) {
    let text = interfaceBody.slice();
    
    text = text
        .trim()
        .replace(/^\{/, '')   // removes {
        .replace(/\}$/, '')   // removes }
        .replace(/\,/g, ';')  // changes all , on ;
        .replace(/\n/g, ';')  // changes all \n on ;
        .replace(/\s/g, '')   // removes all space symbols
        .replace(/\};/g, '}') // removes unnecessary ; after }
        .replace(/\{;/g, '{') // removes unnecessary ; after {
        .replace(/;+/g, ';')  // removes double ;
        .replace(/^;/, '')    // removes ; in the beginning of the text
        .replace(/\{.+?\};/g, 'Object;'); // removes all inlined interfaces on Object
    
    const parts = text.split(';').filter(part => part.trim().length > 0).map(part => {
        const { name, value } = splitNameAndValue(part);
        const rules = parseTypeString(value);

        return {
            name,
            rules,
        };
    });

    return parts;
}
/**
 * 
 * @param {string} text 
 * @param {number} indexOfStart 
 */
function findInterfaceName(text, indexOfStart) {
    const indexOfBracket = text.indexOf('{', indexOfStart);
    const indexOfSpace = text.indexOf(' ', indexOfStart + 18);

    if (indexOfBracket === -1) {
        throw Error('Обнаружены ошибки синтаксиса ts файла при попытке извлечь название интерфейса.');
    }

    const indexOfEnd = indexOfSpace > -1 ? Math.min(indexOfBracket, indexOfSpace) : indexOfBracket;

    return text.substring(indexOfStart + 17, indexOfEnd).trim();
}
/**
 * Finds next closing bracket } that pairs opening bracket { that is on position indexOfStart.
 * @param {string} text 
 * @param {number} indexOfStart 
 */
function findClosingBracket(text, indexOfStart) {
    let counter = 1;
    for (let a = indexOfStart + 1; a < text.length; ++a) {
        const currentSymbol = text[a];
        if (currentSymbol === '{') {
            counter++;
        } else if (currentSymbol === '}') {
            counter--;
            if (counter === 0) {
                return a;
            }
        }
    }

    throw new Error('Не удалось найти закрывающую скобку для интерфейса, что означает наличие ошибок синтаксиса ts файла.');
}
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
 * 
 * @param {string} text 
 * @param {number} position 
 */
function findNextBeginningOfInterface(text, position) {
    return text.indexOf('export interface ', position);
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
 * Finds body of interface with given name.
 * @param {string} interfacename 
 */
function findInterfaceBody(text, interfacename) {
    const entry = 'interface ' + interfacename;

    const indexOfEntry = text.indexOf(entry);
    if (indexOfEntry === -1) {
        throw new Error(`Could not extract body of interface ${text}.`);
    }
    const indexOfStart = text.indexOf('{', indexOfEntry);
    const indexOfEnd = findClosingBracket(text, indexOfStart);

    return text.substring(indexOfStart, indexOfEnd + 1);
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
                const body = findInterfaceBody(text, name);
                const parts = parseInterfaceBody(body);

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