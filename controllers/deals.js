const fs = require("fs");
const path = require("path");

const dealsFilePath = "../data/deals.json";

async function getDealsFromFile() {
    const dataFilePath = path.join(__dirname, dealsFilePath);
    const data = fs.readFileSync(dataFilePath, 'utf8');
    return JSON.parse(data);
}

module.exports = { getDealsFromFile }