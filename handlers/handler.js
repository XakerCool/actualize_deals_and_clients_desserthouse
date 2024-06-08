const {Bitrix} = require("@2bad/bitrix");

const {readDataInfo, updateDealsData, getLastDealDate} = require('../controllers/helper.js');
const logger = require("../logger/logger");
const {updateClientsData} = require("../controllers/helper");
const {getDealsFromFile} = require("../controllers/deals")
const {getClientsFromFile} = require("../controllers/clients")

class Handler {
    currentOverallData = {}
    async readInfo() {
        try {
            this.currentOverallData = await readDataInfo()
            return this.currentOverallData;
        } catch (error) {
            logger.logError("HANDLER readInfo", error)
            return null;
        }
    }

    async getDealsListAfterLastDealDate(link) {
        try {
            const currentInfo = await this.readInfo();
            const lastDealDate = currentInfo.LAST_DEAL_DATE;
            const bx = Bitrix(link);
            const result = await bx.deals.list({ filter: {">DATE_CREATE": lastDealDate} });
            return result.result;
        } catch (error) {
            logger.logError("HANDLER getDealsList", error);
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
                return null
            }
        } catch (error) {
            logger.logError("HANDLER getDealsList", error);
        }
    }

    async updateDealsHandler(req, res, link) {
        try {
            const deals = await this.getDealsListAfterLastDealDate(link);
            return !!(await updateDealsData(deals, this.currentOverallData, link));
        } catch (error) {
            logger.logError("HANDLER getDealsList", error);
        }
    }

    async updateClientsHandler(req, res, link) {
        try {
            const clients = await this.getAllClientsFromBx(link);
            if (clients) {
                return !!(await updateClientsData(clients, this.currentOverallData));
            } else {
                return false;
            }
        } catch (error) {
            logger.logError("HANDLER getDealsList", error);
        }
    }

    async getDeals() {
        try {
            const data = await getDealsFromFile();
            if (data) {
                return data
            } else {
                return null;
            }
        } catch (error) {
            logger.logError("HANDLER getDeals", error);
        }
    }

    async getClients() {
        try {
            const data = await getClientsFromFile();
            if (data) {
                return data
            } else {
                return null;
            }
        } catch (error) {
            logger.logError("HANDLER getClnts", error);
        }
    }

    async updateAndGetAllData(req, res, link) {
        try {
            await this.updateDealsHandler(req, res, link).then(() => {}).catch(error => logger.logError("HANDLER updateAndGetAllData: error updating deals data", error))
            await this.updateClientsHandler(req, res, link).then(() => {}).catch(error => logger.logError("HANDLER updateAndGetAllData: error updating clients data", error))

            const deals = await this.getDeals();
            const clients = await this.getClients();
            const overallData = await this.readInfo();

            if (!deals) {
                logger.logError("HANDLER updateAndGetAllData", "Deals is null");
                res.status(500).json("Ошибка при получении данных");
            }
            if(!clients) {
                logger.logError("HANDLER updateAndGetAllData", "Clients is null");
                res.status(500).json("Ошибка при получении данных");
            }
            if(!overallData) {
                logger.logError("HANDLER updateAndGetAllData", "Overall data is null");
                res.status(500).json("Ошибка при получении данных");
            }

            res.status(200).json({
                "deals": deals,
                "clients": clients,
                "overall_data": overallData
            })
        } catch (error) {
            logger.logError("HANDLER updateAndGetAllData", error);
        }
    }
}



module.exports = Handler