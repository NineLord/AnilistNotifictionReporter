const fs = require('fs').promises;
const { config } = require('dotenv');
config();

const { Logger, LoggerData } = require('../logger');
const Request = require('./httpsRequest');

const PATH_TO_RESOURCES = `${process.env.ROOT_PATH}/resources`;

class FileSystemRequest {

	static FILE_TYPE = {
		JSON: "json",
		Text: "txt"
	}

	static isValidAccessTokenFile(data) {
		return Request.isValidAccessToken(data) && data.hasOwnProperty('created_at');
	}

	/**
	 * Saving a file to the resources folder to be persistent.
	 * If the file exists already, will be overwritten completely.
	 * @param fileName {string} Must include the extension.
	 * @param data {object} Will be stringify before saving.
	 * @return {Promise<boolean>} True if successfully wrote the file. Always resolve.
	 */
	static async saveAsync(fileName, data) {
		return fs.writeFile(`${PATH_TO_RESOURCES}/${fileName}`, JSON.stringify(data, null, 2)).
			then( _ => {
				return true;
		}).catch(error => {
				Logger.error('FileSystemRequest', `saveAsync failed to write with the following params {fileName=${fileName};data=${JSON.stringify(data)}`, error);
				return false;
		})
	}

	/**
	 * Check if the file exitst in resources folder.
	 * @param fileName {string} the file name.
	 * @return {Promise<boolean>} Always resolve.
	 */
	static async existsAsync(fileName) {
		return fs.access(`${PATH_TO_RESOURCES}/${fileName}`)
			.then( _ => {
				return true;
			}).catch(error => {
				Logger.warn('FileSystemRequest', `existsAsync failed to check with the following params {fileName=${fileName}}`, error);
				return false;
		})
	}

	/**
	 * Read the file from resources folder.
	 * @param fileName the file name.
	 * @param fileType the file extension.
	 * @return {Promise<Object | null>} Always resolve.
	 */
	static async readAsync(fileName, fileType = FileSystemRequest.FILE_TYPE.JSON) {
		return fs.readFile(`${PATH_TO_RESOURCES}/${fileName}`)
			.then(data => {
				switch (fileType) {
					case FileSystemRequest.FILE_TYPE.JSON:
						return JSON.parse(data.toString());
					case FileSystemRequest.FILE_TYPE.Text:
						return data.toString();
					default:
						throw new LoggerData(LoggerData.LEVEL.Error, 'FileSystemRequest', `Wrong invalid file type {fileType=${fileType}}`)
				}
			}).catch(error => {
				if (error instanceof LoggerData)
					Logger.logData(error);
				else
					Logger.error('FileSystemRequest', `saveAsync failed to read with the following params {fileName=${fileName}}`, error);
				return null;
			});
	}

}

module.exports = FileSystemRequest;