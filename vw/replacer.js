
/**
 * Return next value in 'px'.
 * @param {string} text 
 * @param {number} fromIndex 
 */
function findNextPX(text, fromIndex) {
    const index = text.indexOf('px', fromIndex);

    if (index === -1) {
        return null;
    }

    for (let a = index - 1; a > 0; --a) {
        const currentSymbol = text[a];
        if (!'0123456789.'.includes(currentSymbol)) {
            const indexOfStart = a + 1;
            const indexOfEnd = index + 2;
            const number = text.substring(indexOfStart, index);
            if (isNaN(+number)) {
                throw new Error('Error in syntax of style file. Value is not a number: ' + number);
            }
            
            return {
                indexOfEnd,
                number,
            };
        }
    }

    throw new Error('Error in syntax of style file.');
}
/**
 * Return all values in 'px'.
 * @param {string} text 
 */
function findAllPX(text) {
    const result = [];
    let currentIndex = 0;

    while (true) {
        const entry = findNextPX(text, currentIndex);

        if (!entry) {
            break;
        }

        currentIndex = entry.indexOfEnd;
        result.push({ 
            number: entry.number, 
            string: entry.number + 'px' 
        });
    }

    return result;
}
/**
 * Converts number in 'px' to number in 'vw' using width of layout.
 * @param {number} number 
 * @param {number} base 
 */
function convert(number, base) {
    const convertedNumber = 100 * number / base;
    if (convertedNumber === 0) {
        return '0';
    }

    let rawResult = convertedNumber.toFixed(4);

    rawResult = rawResult.replace(/[123456789\.]0$/g, '');

    return rawResult;
}
/**
 * Replaces all PX with VW.
 * @param {string} text 
 * @param {number} base 
 */
exports.replacePX = function(text, base) {
    let tempText = text;
    const entries = findAllPX(tempText).sort((x, y) => y.length - x.length);

    entries.forEach(({ number, string }) => {
        const replaceRegex = new RegExp(string, 'g');
        const convertedNumber = convert(number, base);
        const convertedEntry = convertedNumber !== '0' ? convertedNumber + 'vw' : '0';

        tempText = tempText.replace(replaceRegex, convertedEntry);
    });

    return tempText;
}