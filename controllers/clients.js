const fs = require("fs");
const path = require("path");

const clientsFilePath = "../data/clients.json";

async function getClientsFromFile() {
    const dataFilePath = path.join(__dirname, clientsFilePath);
    const data = fs.readFileSync(dataFilePath, 'utf8');
    return JSON.parse(data);
}

module.exports = { getClientsFromFile }