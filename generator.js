const { RULES } = require('./rules.js');
const { EXPORT_TYPES } = require('./export-types.js');

/**
 * Creates section of imports
 * @param {string} name 
 * @param {string} nameOfFileWithInterface 
 * @param {number} typeOfExport 
 */
function generateImports(name, nameOfFileWithInterface, typeOfExport) {
    if (typeOfExport === EXPORT_TYPES.DEFAULT) {
        return `import ${name} from './${nameOfFileWithInterface}';\n`;
    } else if (typeOfExport === EXPORT_TYPES.NORMAL) {
        return `import { ${name} } from './${nameOfFileWithInterface}';\n`;
    } else if (typeOfExport === EXPORT_TYPES.EQUALITY) {
        return `import ${name} = require('./${nameOfFileWithInterface}');\n`;
    }
    
    throw new Error(`Unpredicted type of export ${typeOfExport} for interface ${name} from file ${nameOfFileWithInterface}.`);
}
/**
 * Wrapps innerText into function declaration using it as body of the function
 * @param {string} functionName 
 * @param {string} innerText 
 */
function coverWithFunctionDeclaration(functionName, innerText, interfaceName) {
    return `export function ${functionName}(obj: ${interfaceName}) {\n${innerText}\n}\n`;
}
/**
 * Generates string - condition for negative rule positiveRule
 * @param {string} name 
 * @param {number} negativeRule 
 */
function generateNegativeCondition(name, negativeRule) {
    if (negativeRule === RULES.NOT_NULL) {
        return `obj.${name} === null`;
    }
    if (negativeRule === RULES.NOT_UNDEFINED) {
        return `obj.${name} === undefined`;
    }

    return 'false';
}
/**
 * Generates string - condition for positive rule positiveRule
 * @param {string} name 
 * @param {number} positiveRule 
 */
function generatePositiveCondition(name, positiveRule) {
    if (positiveRule === RULES.ALLOWED_ARRAY) {
        return `obj.${name} instanceof Array`;
    }
    if (positiveRule === RULES.ALLOWED_DATE) {
        return `obj.${name} instanceof Date`;
    }
    if (positiveRule === RULES.ALLOWED_FALSE) {
        return `obj.${name} === false`;
    }
    if (positiveRule === RULES.ALLOWED_FUNCTION) {
        return `obj.${name} instanceof Function`;
    }
    if (positiveRule === RULES.ALLOWED_NULL) {
        return `obj.${name} === null`;
    }
    if (positiveRule === RULES.ALLOWED_NUMBER) {
        return `typeof obj.${name} === 'number'`;
    }
    if (positiveRule === RULES.ALLOWED_OBJECT) {
        return `typeof obj.${name} === 'object'`;
    }
    if (positiveRule === RULES.ALLOWED_STRING) {
        return `typeof obj.${name} === 'string'`;
    }
    if (positiveRule === RULES.ALLOWED_TRUE) {
        return `obj.${name} === true`;
    }
    if (positiveRule === RULES.ALLOWED_UNDEFINED) {
        return `obj.${name} === undefined`;
    }

    return 'true';
}
/**
 * Condition that could be spelled like: 'if the object does not match any of this positively formulated rules'
 * @param {string} name 
 * @param {number[]} positiveRules 
 */
function generateSetOfPositiveConditions(name, positiveRules) {
    const conditions = positiveRules.map(positiveRule => generatePositiveCondition(name, positiveRule));
    const joinedConditions = conditions.join(' || ');

    return `!(${joinedConditions})`;
}
/**
 * Message if null
 * @param {string} name 
 * @param {string} interfaceName 
 */
function generateMessageForNull(name, interfaceName) {
    return `console.error('Ошибка при проверке объекта ${interfaceName}. Поле ${name} равно null.');`;
}
/**
 * Message if undefined
 * @param {string} name 
 * @param {string} interfaceName 
 */
function generateMessageForUndefined(name, interfaceName) {
    return `console.error('Ошибка при проверке объекта ${interfaceName}. Поле ${name} отсутствует, т.е. оно равно undefined.');`;
}
/**
 * Creates string - list of types based on array of rules separating them with 'или'
 * @param {number[]} rules 
 */
function rulesToString(rules) {
    const result = [];

    if (rules.includes(RULES.ALLOWED_ARRAY)) {
        result.push('Array');
    }
    if (rules.includes(RULES.ALLOWED_DATE)) {
        result.push('Date');
    }
    if (rules.includes(RULES.ALLOWED_FALSE)) {
        result.push('false');
    }
    if (rules.includes(RULES.ALLOWED_FILE)) {
        result.push('File');
    }
    if (rules.includes(RULES.ALLOWED_FUNCTION)) {
        result.push('Function');
    }
    if (rules.includes(RULES.ALLOWED_NULL)) {
        result.push('null');
    }
    if (rules.includes(RULES.ALLOWED_NUMBER)) {
        result.push('number');
    }
    if (rules.includes(RULES.ALLOWED_OBJECT)) {
        result.push('Object');
    }
    if (rules.includes(RULES.ALLOWED_STRING)) {
        result.push('string');
    }
    if (rules.includes(RULES.ALLOWED_TRUE)) {
        result.push('true');
    }
    if (rules.includes(RULES.ALLOWED_UNDEFINED)) {
        result.push('undefined');
    }

    return result.join(' или ');
}
/**
 * Genearates message for set of positive rules
 * @param {string} name 
 * @param {string} interfaceName 
 * @param {string[]} positiveRules 
 */
function generateMessageForPositiveRules(name, interfaceName, positiveRules) {
    const normalValues = rulesToString(positiveRules);

    return `console.error('Ошибка при проверке объекта ${interfaceName}. Поле ${name} должно иметь значение ${normalValues}. Вместо этого оно равно\', obj.${name});`;
}
/**
 * Generates block that checks 1 variable
 * @param {*} part 
 */
function generateSectionForPart(part, interfaceName) {
    const { name, rules } = part;

    if (rules.length === 0) {
        return '';
    }
    if (rules.includes(RULES.NO_RESTRICTIONS)) {
        return `\t// На значения поля ${name} не наложены никакие ограничения. В большинстве случаев лучше не использовать тип any.\n`;
    }

    let result = '';

    if (rules.includes(RULES.NOT_NULL)) {
        const condition = generateNegativeCondition(name, RULES.NOT_NULL);
        const message = generateMessageForNull(name, interfaceName);

        result += `\tif (${condition}) {\n\t\t${message}\n\t}\n`;
    }
    if (rules.includes(RULES.NOT_UNDEFINED)) {
        const condition = generateNegativeCondition(name, RULES.NOT_UNDEFINED);
        const message = generateMessageForUndefined(name, interfaceName);

        result += `\tif (${condition}) {\n\t\t${message}\n\t}\n`;
    }

    const positiveRules = rules.filter(rule => rule !== RULES.NOT_NULL && rule !== RULES.NOT_UNDEFINED);
    if (positiveRules.length) {
        const condition = generateSetOfPositiveConditions(name, positiveRules);
        const message = generateMessageForPositiveRules(name, interfaceName, positiveRules);

        result += `\tif (${condition}) {\n\t\t${message}\n\t}\n`;
    }

    return result;
}
/**
 * Genearates check if the argument is object.
 * @param {string} interfaceName 
 */
function generateExistanceCheck(interfaceName) {
    return `    if (!(typeof obj === 'object')) {
        console.error('Ошибка при проверке объекта ${interfaceName}. Вместо объекта передано', obj);
        return;
    }\n\t\n`;
}
/**
 * Generates check on unnessesary parameters.
 * @param {string} interfaceName 
 * @param {string[]} keys 
 */
function generateUnnessesaryParametersCheck(interfaceName, keys) {
    const keysAsString = keys.length > 5 ?
        '[\n' + keys.map(key => '\t\t\'' + key + '\'').join(',\n') + '\n\t]':
        '[' + keys.map(key => '\'' + key + '\'').join(', ') + ']';

    return `\t
    const allowedKeys = ${keysAsString};
    Object.keys(obj).forEach(key => {
        if (!allowedKeys.includes(key)) {
            console.error(\`Ошибка при проверке объекта ${interfaceName}. В нём есть не предусмотренное поле \${key} со значением\`, obj[key]);
        }
    });`
}
/**
 * Generates content and name for the file with test.
 */
exports.generate = function(interfaceInfo, nameOfFileWithInterface) {
    const { name, parts, typeOfExport } = interfaceInfo;
    const functionName = 'validate' + name;
    const fileName = functionName + '.ts';

    const sections = parts.map(part => generateSectionForPart(part, name));

    let innerText = sections.join('\t\n');
    innerText = generateExistanceCheck(name) + innerText;
    innerText += generateUnnessesaryParametersCheck(name, parts.map(part => part.name));
    const text = generateImports(name, nameOfFileWithInterface.split('.')[0], typeOfExport) +
        `\n\/**\n * Валидатор для объекта, принадлежащего интерфейсу ${name}.\n * @param obj объект, который нужно проверить на целостность\n *\/\n` + 
        coverWithFunctionDeclaration(functionName, innerText, name);

    return {
        fileName,
        text,
    };
}