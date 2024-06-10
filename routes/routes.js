const express = require("express");
const Handler = require("../handlers/handler.js");

const router = express.Router();

const handler = new Handler()

router.get("/", (req, res) => {
    console.log("hello world")
    res.status(200).json("hello world");
})

router.get('/deals/', (req, res) => {
    const link = req.app.locals.link;
    handler.updateDealsHandler(req, res, link).then(result => res.json(result));
});

router.get('/clients/', (req, res) => {
    const link = req.app.locals.link;
    handler.updateClientsHandler(req, res, link).then(result => res.json(result));
})

router.get('/get_current_data/', async (req, res) => {
    const link = req.app.locals.link;
    const handler = new Handler();

    console.log("Before calling updateAndGetAllData");

    try {
        const data = await handler.updateAndGetAllData(link);

        console.log("After calling updateAndGetAllData");

        if (!data) {
            console.error("No data returned from updateAndGetAllData");
            return res.status(500).json({ error: 'Failed to retrieve data' });
        }

        res.status(200).json(data);
    } catch (error) {
        console.error("Error in /get_current_data/ route:", error);
        res.status(500).json({ error: 'An error occurred while fetching data' });
    }
});


module.exports = { router };