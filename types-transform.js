const { RULES } = require('./rules.js');
const { TYPES } = require('./types.js');
/**
 * Formulates set of rules on the base of the set of types
 */
exports.processRules = function(setOfTypes) {
    const result = new Set();

    if (setOfTypes.has(TYPES.BOOLEAN)) {
        result.add(RULES.NOT_UNDEFINED);
        result.add(RULES.NOT_NULL);
        result.add(RULES.ALLOWED_TRUE);
        result.add(RULES.ALLOWED_FALSE);
    }
    if (setOfTypes.has(TYPES.FALSE)) {
        result.add(RULES.NOT_UNDEFINED);
        result.add(RULES.NOT_NULL);
        result.add(RULES.ALLOWED_FALSE);
    }
    if (setOfTypes.has(TYPES.DATE)) {
        result.add(RULES.NOT_UNDEFINED);
        result.add(RULES.NOT_NULL);
        result.add(RULES.ALLOWED_DATE);
    }
    if (setOfTypes.has(TYPES.FILE)) {
        result.add(RULES.NOT_UNDEFINED);
        result.add(RULES.NOT_NULL);
        result.add(RULES.ALLOWED_FILE);
    }
    if (setOfTypes.has(TYPES.NOT_RECOGNIZED) || setOfTypes.has(TYPES.OBJECT)) {
        result.add(RULES.NOT_UNDEFINED);
        result.add(RULES.NOT_NULL);
        result.add(RULES.ALLOWED_OBJECT);
    }
    if (setOfTypes.has(TYPES.NULL)) {
        result.add(RULES.NOT_UNDEFINED);
        result.add(RULES.ALLOWED_NULL);
    }
    if (setOfTypes.has(TYPES.NUMBER)) {
        result.add(RULES.NOT_UNDEFINED);
        result.add(RULES.NOT_NULL);
        result.add(RULES.ALLOWED_NUMBER);
    }
    if (setOfTypes.has(TYPES.STRING)) {
        result.add(RULES.NOT_UNDEFINED);
        result.add(RULES.NOT_NULL);
        result.add(RULES.ALLOWED_STRING);
    }
    if (setOfTypes.has(TYPES.TRUE)) {
        result.add(RULES.NOT_UNDEFINED);
        result.add(RULES.NOT_NULL);
        result.add(RULES.ALLOWED_TRUE);
    }
    if (setOfTypes.has(TYPES.UNDEFINED)) {
        result.add(RULES.NOT_NULL);
        result.add(RULES.ALLOWED_UNDEFINED);
    }
    if (setOfTypes.has(TYPES.ARRAY)) {
        result.add(RULES.NOT_UNDEFINED);
        result.add(RULES.NOT_NULL);
        result.add(RULES.ALLOWED_ARRAY);
    }
    if (setOfTypes.has(TYPES.FUNCTION)) {
        result.add(RULES.NOT_UNDEFINED);
        result.add(RULES.NOT_NULL);
        result.add(RULES.ALLOWED_FUNCTION);
    }

    return result;
}
/**
 * Removes unnecessary elements from set of rules
 */
exports.postProcessRules = function(setOfRules) {
    if (setOfRules.has(RULES.ALLOWED_UNDEFINED) && setOfRules.has(RULES.NOT_UNDEFINED)) {
        setOfRules.delete(RULES.NOT_UNDEFINED);
    }
    if (setOfRules.has(RULES.ALLOWED_NULL) && setOfRules.has(RULES.NOT_NULL)) {
        setOfRules.delete(RULES.NOT_NULL);
    }
    // array is always object
    if (setOfRules.has(RULES.ALLOWED_OBJECT) && setOfRules.has(RULES.ALLOWED_ARRAY)) {
        setOfRules.delete(RULES.ALLOWED_ARRAY);
    }
    // date is always object
    if (setOfRules.has(RULES.ALLOWED_OBJECT) && setOfRules.has(RULES.ALLOWED_DATE)) {
        setOfRules.delete(RULES.ALLOWED_DATE);
    }
    // file is always object
    if (setOfRules.has(RULES.ALLOWED_OBJECT) && setOfRules.has(RULES.ALLOWED_FILE)) {
        setOfRules.delete(RULES.ALLOWED_FILE);
    }
}