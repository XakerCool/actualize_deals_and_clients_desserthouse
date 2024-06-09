const { Bitrix } = require("@2bad/bitrix");
const { readDataInfo, updateDealsData, getLastDealDate } = require('../controllers/helper.js');
const logger = require("../logger/logger");
const { updateClientsData } = require("../controllers/helper");
const { getDealsFromFile } = require("../controllers/deals");
const { getClientsFromFile } = require("../controllers/clients");

class Handler {
    constructor() {
        this.currentOverallData = {};
    }

    async readInfo() {
        try {
            this.currentOverallData = await readDataInfo();
            return this.currentOverallData;
        } catch (error) {
            logger.logError("HANDLER readInfo", error);
            return null;
        }
    }

    async getDealsListAfterLastDealDate(link) {
        try {
            const currentInfo = await this.readInfo();
            const lastDealDate = currentInfo.LAST_DEAL_DATE;
            const bx = Bitrix(link);
            const result = await bx.deals.list({ filter: { ">DATE_CREATE": lastDealDate } });
            return result.result;
        } catch (error) {
            logger.logError("HANDLER getDealsListAfterLastDealDate", error);
            return null;
        }
    }

    async getAllClientsFromBx(link) {
        try {
            const currentInfo = await this.readInfo();
            const currentClientsCount = currentInfo.CLIENTS_COUNT;
            const bx = Bitrix(link);
            const result = await bx.contacts.list({ SELECT: ["ID", "NAME", "SECOND_NAME", "LAST_NAME"] });
            if (result.result.length > currentClientsCount) {
                return result.result;
            } else {
                return null;
            }
        } catch (error) {
            logger.logError("HANDLER getAllClientsFromBx", error);
            return null;
        }
    }

    async updateDealsHandler(link) {
        try {
            const deals = await this.getDealsListAfterLastDealDate(link);
            const result = await updateDealsData(deals, this.currentOverallData, link);
            return result;
        } catch (error) {
            logger.logError("HANDLER updateDealsHandler", error);
            return false;
        }
    }

    async updateClientsHandler(link) {
        try {
            const clients = await this.getAllClientsFromBx(link);
            if (clients) {
                const response = await updateClientsData(clients, this.currentOverallData);
                return response;
            } else {
                return false;
            }
        } catch (error) {
            logger.logError("HANDLER updateClientsHandler", error);
            return false;
        }
    }

    async getDeals() {
        try {
            const data = await getDealsFromFile();
            return data || null;
        } catch (error) {
            logger.logError("HANDLER getDeals", error);
            return null;
        }
    }

    async getClients() {
        try {
            const data = await getClientsFromFile();
            return data || null;
        } catch (error) {
            logger.logError("HANDLER getClients", error);
            return null;
        }
    }

    async updateAndGetAllData(link) {
        try {
            await this.updateDealsHandler(link);
            await this.updateClientsHandler(link);

            const deals = await this.getDeals();
            const clients = await this.getClients();
            const overallData = await this.readInfo();

            if (!deals || !clients || !overallData) {
                logger.logError("HANDLER updateAndGetAllData", "data is missing");
                return null;
            }

            return {
                deals,
                clients,
                overall_data: overallData
            };
        } catch (error) {
            logger.logError("HANDLER updateAndGetAllData", error);
            return null;
        }
    }
}

module.exports = Handler;
