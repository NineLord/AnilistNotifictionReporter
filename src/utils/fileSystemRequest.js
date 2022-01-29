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
	 * @param innerPath {string | undefined} the folder the file is at inside resource folder.
	 * @param data {object} Will be stringify before saving.
	 * @return {Promise<boolean>} True if successfully wrote the file. Always resolve.
	 */
	static async saveAsync(fileName, innerPath = undefined, data) {
		return fs.writeFile(`${PATH_TO_RESOURCES}/${innerPath ? `${innerPath}/` : ""}${fileName}`, JSON.stringify(data, null, 2)).
			then( _ => {
				return true;
		}).catch(error => {
				Logger.error('FileSystemRequest', `saveAsync failed to write with the following params {fileName=${fileName};innerPath=${innerPath};data=${JSON.stringify(data)}}`, error);
				return false;
		})
	}

	/**
	 * Check if the file exitst in resources folder.
	 * @param fileName {string} the file name.
	 * @param innerPath {string | undefined} the folder the file is at inside resource folder.
	 * @return {Promise<boolean>} Always resolve.
	 */
	static async existsAsync(fileName, innerPath = undefined) {
		return fs.access(`${PATH_TO_RESOURCES}/${innerPath ? `${innerPath}/` : ""}${fileName}`)
			.then( _ => {
				return true;
			}).catch(error => {
				Logger.warn('FileSystemRequest', `existsAsync failed to check with the following params {fileName=${fileName};innerPath=${innerPath}}`, error);
				return false;
		})
	}

	/**
	 * Read the file from resources folder.
	 * @param fileName {string} the file name.
	 * @param innerPath {string | undefined} the folder the file is at inside resource folder.
	 * @param fileType {string} the file extension.
	 * @return {Promise<Object | null>} Always resolve.
	 */
	static async readAsync(fileName, innerPath = undefined, fileType = FileSystemRequest.FILE_TYPE.JSON) {
		return fs.readFile(`${PATH_TO_RESOURCES}/${innerPath ? `${innerPath}/` : ""}${fileName}`)
			.then(data => {
				switch (fileType) {
					case FileSystemRequest.FILE_TYPE.JSON:
						return JSON.parse(data.toString());
					case FileSystemRequest.FILE_TYPE.Text:
						return data.toString();
					default:
						throw new LoggerData(LoggerData.LEVEL.Error, 'FileSystemRequest', `Wrong invalid file type {fileType=${fileType};innerPath=${innerPath}}`)
				}
			}).catch(error => {
				if (error instanceof LoggerData)
					Logger.logData(error);
				else
					Logger.error('FileSystemRequest', `saveAsync failed to read with the following params {fileName=${fileName};innerPath=${innerPath}}`, error);
				return null;
			});
	}

}

module.exports = FileSystemRequest;