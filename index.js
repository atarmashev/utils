#!/usr/bin/env node

const { extractInterfaces } = require('./text-transformations.js');
const { generate } = require('./generator.js');
const fileSystem = require("fs");

/**
 * Выбираем ts файлы
 * @param {string[]} data 
 */
function chooseFiles(data) {
    let files = data.filter(fileName => fileName.endsWith('.ts'));

    if (files.length === 0) {
        console.log('В данной папке нет ts файлов.');
    } else if (files.length > 100) {
        console.log('В данной папке слишком много ts файлов. Обрабатываем первые 100.');
        files = files.slice(0, 100);
    }

    return files;
}
/**
 * Сохраняет данные в файл
 * @param {*} fileInfos 
 */
function saveFileInfos(fileInfos) {
    fileInfos.forEach(fileInfo => {
        try {
            fileSystem.writeFileSync(`./${fileInfo.fileName}`, fileInfo.text);
        } catch (error) {
            console.error(`Ошибка записи в файл ${fileName}.`, error);
        }
    });
}

fileSystem.readdir('./', (error, data) => {
    if (error) {
        console.error('Не удалось прочитать файл', error);
        return;
    }

    chooseFiles(data).forEach(fileName => {
        let rawText;
        try {
            rawText = fileSystem.readFileSync(`./${fileName}`, "utf8");
        } catch (error) {
            console.error(`Файл ${fileName} не удалось прочитать.`, error);
            return;
        }

        let interfaces;
        try {
            interfaces = extractInterfaces(rawText);
        } catch (error) {
            console.error(`Ошибка анализа файла ${fileName}.`, error);
            return;
        }

        if (interfaces.length) {
            console.log(`Генерация валидаторов для экспортированных интерфейсов из файла ${fileName}.`);

            const fileInfos = interfaces.map(interfaceInfo => { 
                try {
                    return generate(interfaceInfo, fileName); 
                } catch (error) {
                    console.error(`Ошибка генерации валидаторов для ${fileName} не удалось обработать.`, error, interfaceInfo);
                    return null;
                }
            });
            
            saveFileInfos(fileInfos.filter(fileInfos => !!fileInfos));
        } else {
            console.log(`В файле ${fileName} нет экспортированных интерфейсов.`);
        }
    });
});