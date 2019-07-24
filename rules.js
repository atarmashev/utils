/**
 * Правила проверки полей
 */
exports.RULES = {
    /**
     * Без ограничений
     */
    NO_RESTRICTIONS: 0,
    /**
     * Нельзя undefined
     */
    NOT_UNDEFINED: 1,
    /**
     * Нельзя null
     */
    NOT_NULL: 2,
    ALLOWED_TRUE: 3,
    ALLOWED_FALSE: 4,
    ALLOWED_NULL: 5,
    ALLOWED_UNDEFINED: 6,
    ALLOWED_NUMBER: 7,
    ALLOWED_OBJECT: 8,
    ALLOWED_STRING: 9,
    ALLOWED_ARRAY: 10,
    ALLOWED_FUNCTION: 11,
    ALLOWED_DATE: 12,
    ALLOWED_FILE: 13,
};