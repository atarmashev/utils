const { RULES } = require('./rules.js');
const { TYPES } = require('./types.js');
/**
 * Формирует множество правил на основе множества типов
 */
exports.processRules = function(setOfTypes, setOfRules) {
    if (setOfTypes.has(TYPES.BOOLEAN)) {
        setOfRules.add(RULES.NOT_UNDEFINED);
        setOfRules.add(RULES.NOT_NULL);
        setOfRules.add(RULES.ALLOWED_TRUE);
        setOfRules.add(RULES.ALLOWED_FALSE);
    }
    if (setOfTypes.has(TYPES.FALSE)) {
        setOfRules.add(RULES.NOT_UNDEFINED);
        setOfRules.add(RULES.NOT_NULL);
        setOfRules.add(RULES.ALLOWED_FALSE);
    }
    if (setOfTypes.has(TYPES.DATE)) {
        setOfRules.add(RULES.NOT_UNDEFINED);
        setOfRules.add(RULES.NOT_NULL);
        setOfRules.add(RULES.ALLOWED_DATE);
    }
    if (setOfTypes.has(TYPES.FILE)) {
        setOfRules.add(RULES.NOT_UNDEFINED);
        setOfRules.add(RULES.NOT_NULL);
        setOfRules.add(RULES.ALLOWED_FILE);
    }
    if (setOfTypes.has(TYPES.NOT_RECOGNIZED) || setOfTypes.has(TYPES.OBJECT)) {
        setOfRules.add(RULES.NOT_UNDEFINED);
        setOfRules.add(RULES.NOT_NULL);
        setOfRules.add(RULES.ALLOWED_OBJECT);
    }
    if (setOfTypes.has(TYPES.NULL)) {
        setOfRules.add(RULES.NOT_UNDEFINED);
        setOfRules.add(RULES.ALLOWED_NULL);
    }
    if (setOfTypes.has(TYPES.NUMBER)) {
        setOfRules.add(RULES.NOT_UNDEFINED);
        setOfRules.add(RULES.NOT_NULL);
        setOfRules.add(RULES.ALLOWED_NUMBER);
    }
    if (setOfTypes.has(TYPES.STRING)) {
        setOfRules.add(RULES.NOT_UNDEFINED);
        setOfRules.add(RULES.NOT_NULL);
        setOfRules.add(RULES.ALLOWED_STRING);
    }
    if (setOfTypes.has(TYPES.TRUE)) {
        setOfRules.add(RULES.NOT_UNDEFINED);
        setOfRules.add(RULES.NOT_NULL);
        setOfRules.add(RULES.ALLOWED_TRUE);
    }
    if (setOfTypes.has(TYPES.UNDEFINED)) {
        setOfRules.add(RULES.NOT_NULL);
        setOfRules.add(RULES.ALLOWED_UNDEFINED);
    }
    if (setOfTypes.has(TYPES.ARRAY)) {
        setOfRules.add(RULES.NOT_UNDEFINED);
        setOfRules.add(RULES.NOT_NULL);
        setOfRules.add(RULES.ALLOWED_ARRAY);
    }
    if (setOfTypes.has(TYPES.FUNCTION)) {
        setOfRules.add(RULES.NOT_UNDEFINED);
        setOfRules.add(RULES.NOT_NULL);
        setOfRules.add(RULES.ALLOWED_FUNCTION);
    }
}
/**
 * Убирает лишние элементы множества правил
 */
exports.postProcessRules = function(setOfRules) {
    if (setOfRules.has(RULES.ALLOWED_UNDEFINED) && setOfRules.has(RULES.NOT_UNDEFINED)) {
        setOfRules.delete(RULES.NOT_UNDEFINED);
    }
    if (setOfRules.has(RULES.ALLOWED_NULL) && setOfRules.has(RULES.NOT_NULL)) {
        setOfRules.delete(RULES.NOT_NULL);
    }
    // массив - всегда объект
    if (setOfRules.has(RULES.ALLOWED_OBJECT) && setOfRules.has(RULES.ALLOWED_ARRAY)) {
        setOfRules.delete(RULES.ALLOWED_ARRAY);
    }
    // дата - всегда объект
    if (setOfRules.has(RULES.ALLOWED_OBJECT) && setOfRules.has(RULES.ALLOWED_DATE)) {
        setOfRules.delete(RULES.ALLOWED_DATE);
    }
    // файл - всегда объект
    if (setOfRules.has(RULES.ALLOWED_OBJECT) && setOfRules.has(RULES.ALLOWED_FILE)) {
        setOfRules.delete(RULES.ALLOWED_FILE);
    }
}