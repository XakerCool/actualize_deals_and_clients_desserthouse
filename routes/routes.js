const express = require("express");
const Handler = require("../handlers/handler.js");

const router = express.Router();

const handler = new Handler()

router.get('/deals/', (req, res) => {
    const link = req.app.locals.link;
    handler.updateDealsHandler(req, res, link).then(result => res.json(result));
});

router.get('/clients/', (req, res) => {
    const link = req.app.locals.link;
    handler.updateClientsHandler(req, res, link).then(result => res.json(result));
})

router.get('/get_current_data/', (req, res) => {
    const link = req.app.locals.link;
    handler.updateAndGetAllData(req, res, link).then(result => res.json(result));
})

module.exports = { router };