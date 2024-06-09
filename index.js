const dotenv = require('dotenv');
const express = require('express');
const bodyParser = require('body-parser');
const {router} = require('./routes/routes.js');
const path = require("path")

const envPath = path.join(__dirname, '.env');
dotenv.config({ path: envPath });

const app = express();
const PORT = 4400;

app.locals.link = process.env.DESSERTHOUSE_LINK;

app.use('/', router);

app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});