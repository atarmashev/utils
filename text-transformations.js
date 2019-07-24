const TypesTransform = require('./types-transform.js');
const { RULES } = require('./rules.js');
const { TYPES } = require('./types.js');

/**
 * Преобразует информацию о типах в форме перечисления в массив правил валидации для этих типов
 * @param {Set<number>} types 
 */
function typesToRules(types) {
    if (types.has(TYPES.ANY)) {
        return new Set([RULES.NO_RESTRICTIONS]);
    }

    const result = new Set();
    // добавление
    TypesTransform.processRules(types, result);
    // взаимное влияние запретов и разрешений
    TypesTransform.postProcessRules(result);

    return result;
}
/**
 * Преобразует информацию о типах в форме строк в список правил валидации для этих типов
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

function findSeparatorsInTypeDeclaration(value) {
    const result = [];

    let isInsideAngularBrackets = 0;
    let isInsideCircularBrackets = 0;
    for (let a = 0; a < value.length; ++a) {
        const currentSymbol = value[a];
        // если угловая скобка открылась
        if (currentSymbol === '<') {
            isInsideAngularBrackets++;
        } 
        // если угловая скобка закрылась
        else if (currentSymbol === '>') {
            if (!(a > 0 && value[a - 1] === '=')) { // может встретится конструкция =>
                isInsideAngularBrackets--;
            }
        } 
        // если круглая скобка открылась
        else if (currentSymbol === '(') {
            isInsideCircularBrackets++;
        } 
        // если круглая скобка закрылась
        else if (currentSymbol === ')') {
            isInsideCircularBrackets--;
        }
        // если нашли разделитель
        else if (currentSymbol === '|' && isInsideAngularBrackets === 0 && isInsideCircularBrackets === 0) {
            result.push(a);
        }
        // ошибка угловых скобок - слишком много закрывающих
        else if (isInsideAngularBrackets < 0) {
            throw new Error('Ошибка синтаксиса ts файла. Неправильно расставлены <> скобки в выражении ' + value);
        } 
        // ошибка круглых скобок - слишком много закрывающих
        else if (isInsideCircularBrackets < 0) {
            throw new Error('Ошибка синтаксиса ts файла. Неправильно расставлены () скобки в выражении ' + value);
        }
    }
    // ошибка угловых скобок - слишком много открывающих
    if (isInsideAngularBrackets > 0) {
        throw new Error('Ошибка синтаксиса ts файла. Неправильно расставлены <> скобки в выражении ' + value);
    } 
    // ошибка круглых скобок - слишком много открывающих
    if (isInsideCircularBrackets > 0) {
        throw new Error('Ошибка синтаксиса ts файла. Неправильно расставлены () скобки в выражении ' + value);
    }

    return result;
}
/**
 * Разбивает строку типов
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
 * Разбирает строку, где указан тип или несколько.
 * @param {string} value 
 */
function parseTypeString(value) {
    const rawTypes = splitTypeString(value);

    return rawTypesToRules(rawTypes);
}
/**
 * В объявлении метода или поля интерфейса находит название поля/метода и его тип.
 * @param {string} part 
 */
function splitNameAndValue(part) {
    const index = part.indexOf(':');
    if (index === -1) {
        throw new Error('Ошибка синтаксиса ts файла. Неправильно указана часть интерфейса ' + part);
    }

    const name = part.substr(0, index);
    const value = part.substr(0);
    if (!name || !value) {
        throw new Error('Ошибка синтаксиса ts файла. Неправильно указана часть интерфейса ' + part);
    }

    return {
        name,
        value
    };
}
/**
 * Разбирает содержимое интерфейса по смыслу
 * @param {string} interfaceBody 
 */
function parseInterfaceBody(interfaceBody) {
    let text = interfaceBody.slice();
    // console.log('Было', text);
    text = text
        .trim()
        .replace(/^\{/, '')   // убираем открывающую {
        .replace(/\}$/, '')   // убираем закрывающую }
        .replace(/\,/g, ';')  // меняем все , на ;
        .replace(/\n/g, ';')  // меняем все символы перевода строки на ;
        .replace(/\s/g, '')   // убираем все пробельные символы
        .replace(/\};/g, '}') // убираем лишние ; после }
        .replace(/\{;/g, '{') // убираем лишние ; после {
        .replace(/;+/g, ';')  // убираем двойные ;
        .replace(/^;/, '')    // убираем ; в начале текста
        .replace(/\{.+?\};/g, 'Object;'); // заменяем все вложенные интерфейсы на Object
    // console.log('Стало', text);
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
 * Вытаскивает название интерфейса
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
 * Находит в строке text закрывающую скобку }, которая относится к открывающей скобке {,
 * которая находится на позиции indexOfStart
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
 * Удаляет комментарии из текста
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
 * Удаляем повторяющиеся пробельные символы
 * @param {string} rawText 
 */
function removeRepeatingSpaces(rawText) {
    return rawText.replace(/[ \t]+/g, ' ');
}
/**
 * Ищет первое встретившееся начало экспортированного интерфейса в тексте, начиная с position
 * @param {string} text 
 * @param {number} position 
 */
function findNextBeginningOfInterface(text, position) {
    return text.indexOf('export interface ', position);
}
/**
 * Находит все интерфейсы в тексте
 * @param {string} text 
 */
function findAllInterfaces(text) {
    const preparedText = text
        .replace(/\{.+?\};/g, '{}')
        .replace(/'.+?';/g, '\'\'')
        .replace(/".+?";/g, '\"\"')
        .replace(/`.+?`;/g, '\`\`');

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
            throw new Error('Ошибка синтаксиса ts файла. Объявление интерфейса ничем не заканчивается.');
        }
        const indexOfEnd = hasSpace ? 
            Math.min(indexOfSpace, indexOfBracket) : 
            indexOfBracket;

        const interfaceName = subText.substr(0, indexOfEnd);

        return interfaceName;
    });
}

function selectExportedInterfaces(text, interfaceNames) {
    
}
/**
 * Вытаскивает список экспортированных интерфейсов из текста. На вход подаётся уже обработанный текст.
 * @param {string} text 
 */
function extractInterfacesInternal(text) {
    const result = [];

    let currentPosition = 0;
    while (true) {
        const beginningOfInterface = findNextBeginningOfInterface(text, currentPosition);
        currentPosition = beginningOfInterface + 17;

        if (beginningOfInterface === -1) {
            return result;
        }

        const indexOfStart = text.indexOf('{', beginningOfInterface);
        const indexOfNextClosingBracket = text.indexOf('}', beginningOfInterface);

        if (indexOfStart === -1 || indexOfNextClosingBracket === -1) {
            return result;
        }
        if (indexOfStart > indexOfNextClosingBracket) {
            throw new Error('Обнаружены ошибки синтаксиса ts файла.');
        }

        const indexOfEnd = findClosingBracket(text, indexOfStart);
        const name = findInterfaceName(text, beginningOfInterface);
        const interfaceBody = text.substring(indexOfStart, indexOfEnd + 1);
        const parts = parseInterfaceBody(interfaceBody);

        result.push({
            parts,
            name,
        });
    }
}
/**
 * Вытаскивает список экспортированных интерфейсов из текста
 * @param {string} rawText 
 */
exports.extractInterfaces = function(rawText) {
    let halfPreparedText = removeComments(rawText);
    const text = removeRepeatingSpaces(halfPreparedText);
    
    return extractInterfacesInternal(text);
}