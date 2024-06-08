const fs = require("fs");
const path = require("path");

const {Bitrix} = require("@2bad/bitrix")

const logger = require("../logger/logger");

const dealsFilePath = "../data/deals.json";
const clientsFilePath = "../data/clients.json";
const dataClientSummaryFilePath = "../data/deals_clients_summary.json";
async function readDataInfo() {
    // Читаем данные из файла deals_clients_summary.json
    const dataFilePath = path.join(__dirname, dataClientSummaryFilePath);
    try {
        const rawData = fs.readFileSync(dataFilePath, 'utf-8');
        const data = JSON.parse(rawData);
        return {
            DEALS_COUNT: data.DEALS_COUNT || 0,
            CLIENTS_COUNT: data.CLIENTS_COUNT || 0,
            LAST_DEAL_DATE: data.LAST_DEAL_DATE || 0,
        };
    } catch (error) {
        logger.logError("Helper, readDataInfo", error);
        return {
            DEALS_COUNT: 0,
            CLIENTS_COUNT: 0,
            LAST_DEAL_DATE: 0,
        };
    }
}

async function updateClientsData(newData, currentOverallData) {
    try {
        // Читаем существующие данные из файла
        const dataFilePath = path.join(__dirname, clientsFilePath);

        // Записываем обновленные данные обратно в файл
        await fs.writeFile(dataFilePath, JSON.stringify(newData, null, 4), 'utf8', () => {});

        const updatedDealsClientsSummaryData = {
            DEALS_COUNT: currentOverallData.DEALS_COUNT,
            CLIENTS_COUNT: newData.length,
            LAST_DEAL_DATE: currentOverallData.LAST_DEAL_DATE
        }

        await updateDealsClientsSummary(updatedDealsClientsSummaryData)

        return true;
    }  catch (error) {
        logger.logError("Helper, updateDealsData", error);
        return false;
    }
}

async function updateDealsData(newData, currentOverallData, link) {
    try {
        const dataFilePath = path.join(__dirname, dealsFilePath);
        const data = fs.readFileSync(dataFilePath, 'utf8');
        const existingData = JSON.parse(data);

        let updatedData = [...existingData];

        const paymentDateUserField = await getDealsUserFields(link);
        const fieldName = paymentDateUserField ? paymentDateUserField["FIELD_NAME"] : null;
        const fetchedDeals = await fetchDealsDetails(newData, link);

        fetchedDeals.forEach(deal => {
            if (deal && fieldName) {
                updatedData.push({
                    "ID": deal["ID"] || null,
                    "Дата создания": deal["DATE_CREATE"] || null,
                    "Дата оплаты": deal[fieldName] || null,
                    "Клиент: ID": deal["CONTACT_ID"] || null,
                    "Сумма": deal["OPPORTUNITY"] || null
                });
            }
        });

        // Update the deals file
        await fs.writeFile(dataFilePath, JSON.stringify(updatedData, null, 4), 'utf8', () => {});

        // Update the last deal date in summary
        let maxDate = new Date(0); // Start comparison with an old date
        updatedData.forEach(item => {
            const dealDate = new Date(item["Дата создания"]);
            if (!isNaN(dealDate.getTime()) && dealDate > maxDate) {
                maxDate = dealDate;
            }
        });

        const updatedDealsClientsSummaryData = {
            DEALS_COUNT: updatedData.length,
            CLIENTS_COUNT: currentOverallData.CLIENTS_COUNT,
            LAST_DEAL_DATE: maxDate.toISOString()
        };

        await updateDealsClientsSummary(updatedDealsClientsSummaryData);
        return true;
    } catch (error) {
        logger.logError("Helper, updateDealsData", error);
        return false;
    }
}


async function getDealsUserFields(link) {
    try {
        const bx = Bitrix(link);
        // Call the Bitrix API to get user fields for deals
        const response = await bx.call("crm.deal.userfield.list", {
            order: { "SORT": "ASC" },
            filter: { LANG: 'ru' }
        });

        // Assuming the response contains an array of user fields
        if (response && response.result) {
            const dateOfPaymentField = response.result.find(field => field.EDIT_FORM_LABEL === "Дата оплаты" || field.LIST_COLUMN_LABEL === "Дата оплаты" || field.LIST_FILTER_LABEL === "Дата оплаты");

            if (dateOfPaymentField) {
                return dateOfPaymentField; // Return the specific user field
            } else {
                return null; // Return null if the field "Дата оплаты" is not found
            }
        } else {
            logger.logError("Helper, getDealsUserFields", "No user fields found or invalid response structure.");
            console.log();
            return null;
        }
    } catch (error) {
        logger.logError("Helper, getDealsUserFields", error);
        return null;
    }
}

async function fetchDealsDetails(newData, link) {
    try {
        const bx = Bitrix(link)
        // Assuming 'newData' is an array of objects where each object has a 'deal_id'
        const fetchPromises = newData.map(deal => {
            return bx.deals.get(deal.ID)
                .then(data => {
                    return data.result;
                })
                .catch(err => {
                    return null;  // Return null or similar to indicate failure but keep Promise.all from rejecting
                });
        });
        // Execute all promises concurrently
        return await Promise.all(fetchPromises);
    } catch (error) {
        logger.logError("Helper, updateDealsData", error);
        return []; // Return an empty array in case of error
    }
}

async function updateDealsClientsSummary(newData) {
    try {
        // Читаем существующие данные из файла
        const dataFilePath = path.join(__dirname, dataClientSummaryFilePath);
        const data = fs.readFileSync(dataFilePath, 'utf8');
        const existingData = JSON.parse(data);

        // Обновляем дату последней сделки
        existingData.LAST_DEAL_DATE = newData.LAST_DEAL_DATE;
        existingData.CLIENTS_COUNT = newData.CLIENTS_COUNT;
        existingData.DEALS_COUNT = newData.DEALS_COUNT;

        // Записываем обновленные данные обратно в файл
        await fs.writeFile(dataFilePath, JSON.stringify(existingData, null, 4), 'utf8', () => {});
        return true;
    } catch (error) {
        console.error("Ошибка при обновлении общих данных:", error);
        logger.logError("Helper, updateDealsClientsSummary", error);
    }
}

module.exports = { readDataInfo, updateDealsData, updateClientsData }
