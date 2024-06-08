const fs = require('fs');
const path = require('path');

function logError(source, error) {
    // Форматируем текущую дату и время
    const currentTime = new Date().toLocaleString();

    // Создаем сообщение для записи в файл
    const errorMessage = `${currentTime} - Source: ${source}\nError: ${error.stack}\n\n`;

    // Путь к директории logs (находящейся в той же директории, что и файл logger.js)
    const logsDir = path.join(__dirname, 'logs');

    // Проверяем, существует ли директория logs, и если нет - создаем ее
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir);
    }

    // Путь к файлу, куда будем записывать ошибки
    const logFilePath = path.join(logsDir, 'error.log');

    // Добавляем сообщение об ошибке в файл
    fs.appendFile(logFilePath, errorMessage, (err) => {
        if (err) {
            console.error('Ошибка записи в файл:', err);
        } else {
            console.log('Ошибка успешно записана в файл.');
        }
    });
}

module.exports = { logError }