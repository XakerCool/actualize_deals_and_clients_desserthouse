const fs = require("fs");
const path = require("path");

const companiesFilePath = "../data/companies.json";

async function getCompaniesFromFile() {
    const dataFilePath = path.join(__dirname, companiesFilePath);
    const data = fs.readFileSync(dataFilePath, 'utf8');
    return JSON.parse(data);
}

module.exports = { getCompaniesFromFile }