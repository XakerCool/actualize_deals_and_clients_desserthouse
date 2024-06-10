const dotenv = require('dotenv');
const express = require('express');
const bodyParser = require('body-parser');
const {router} = require('./routes/routes.js');
const path = require("path")
const cors = require("cors");

const envPath = path.join(__dirname, '.env');
dotenv.config({ path: envPath });

const app = express();
const PORT = 4400;

app.locals.link = process.env.AKRAHOLDING_LINK;

app.use(cors());

app.use('/activity/', router);

app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
