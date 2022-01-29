const express = require('express');
const router = express.Router();
const { config } = require('dotenv');
config();

const { Logger, LoggerData } = require('../logger');
const Request = require('../utils/httpsRequest');
const FileSystemRequest = require('../utils/fileSystemRequest');
const reporter = require('../Reporter');

function bodyGetToken(authCode) {
	const dataToPost = {
		"grant_type": 'authorization_code',
		"client_id": `${process.env.CLIENT_ID}`,
		"client_secret": `${process.env.SECRET}`,
		"redirect_uri": `${process.env.CALLBACK_URL}`,
		"code": `${authCode}`
	};
	return JSON.stringify(dataToPost);
}

async function updateTheReport(token) {
	const query = {
		query: process.env.QUERY_FORM,
		variables: {
			page: 0
		}
	};

	let foundFirstActivity = false;
	let page = 0;
	while (!foundFirstActivity) {
		page++;
		query.variables.page = page;
		Logger.debug('updateTheReport', "page value", query.variables.page);
		const rawQuery = JSON.stringify(query);

		const header = Request.optionsHttpsPOSTquery(token, rawQuery.length);
		foundFirstActivity = await Request.postAsync(header, rawQuery)
			.then(pageJson => {
				if (Request.isValidPageActivity(pageJson))
					return reporter.addPage(pageJson['data']['Page']['notifications']);
				else
					throw new LoggerData(LoggerData.LEVEL.Error, 'updateTheReport', "Got Invalid pageJson", pageJson);
			})
			.catch(error => {
				return error;
			});

		if (typeof foundFirstActivity !== 'boolean')
			throw foundFirstActivity; // Passing forward the error, the catch in the 'get' method will handle it.
	}

	return token;
}

async function updateLastActivity(token) {
	const query = {
		query: process.env.QUERY_FORM,
		variables: {
			page: 1
		}
	};
	const rawQuery = JSON.stringify(query);

	const header = Request.optionsHttpsPOSTquery(token, rawQuery.length);
	return Request.postAsync(header, rawQuery)
		.then(pageJson => {
			if (Request.isValidPageActivity(pageJson))
				reporter.updateLastActivity(pageJson['data']['Page']['notifications']);
			else
				throw new LoggerData(LoggerData.LEVEL.Error, 'updateLastActivity', "Got Invalid pageJson", pageJson);
		});
}

async function reportToJson() {
	return reporter.serialize();
}

async function saveTheReport(jsonReport) {
	return FileSystemRequest.saveAsync(process.env.REPORTER_FILE_NAME, "output", jsonReport)
		.then(isSaved => {
			if (!isSaved)
				throw new LoggerData(LoggerData.LEVEL.Error, '/report', "saveAsync failed at saveTheReport");
			return jsonReport;
		});
}

async function reportToPrettyJson() {
	return reporter.serializePretty();
}

async function saveThePrettyReport(jsonPrettyReport) {
	return FileSystemRequest.saveAsync(process.env.REPORTER_PRETTY_FILE_NAME, "output", jsonPrettyReport)
		.then(isSaved => {
			if (!isSaved)
				throw new LoggerData(LoggerData.LEVEL.Error, '/report', "saveAsync failed at saveThePrettyReport");
			return jsonPrettyReport;
		});
}

async function reportToHTML(jsonPrettyReport) {
	return `<pre>${JSON.stringify(jsonPrettyReport, null, 2)}</pre>`;
}

router.get('/', (request, response) => {
	let prePromise; // Resolve with the actual access token string.
	if (Request.isValidAuthCode(request)) { // We got authCode, need to convert it to token and save it
		const postBodyGetToken = bodyGetToken(request.query.code);

		let token;
		prePromise = Request.postAsync(Request.optionsHttpsPOSTgetToken(postBodyGetToken.length), postBodyGetToken)
			.then(jsonToken => {
				if (Request.isValidAccessToken(jsonToken)) {
					jsonToken['created_at'] = new Date().toLocaleString();
					token = jsonToken['access_token'];
					return jsonToken;
				} else {
					throw new LoggerData(LoggerData.LEVEL.Error, '/report', "Anilist Responded with invalid token", jsonToken);
				}
			})
			.then(jsonToken => {
				return FileSystemRequest.saveAsync(process.env.ACCESS_TOKEN_FILE_NAME, "output", jsonToken);
			})
			.then(isSaved => {
				if (isSaved)
					return token;
				else
					throw new LoggerData(LoggerData.LEVEL.Error, '/report', "saveAsync failed");
			});
	} else // We already have a valid token, read it from file system.
		prePromise = FileSystemRequest.readAsync(process.env.ACCESS_TOKEN_FILE_NAME, "output")
			.then(jsonToken => {
				return jsonToken['access_token'];
			});

	prePromise
		.then(updateTheReport)
		.then(updateLastActivity)
		.then(reportToJson)
		.then(saveTheReport)
		.then(reportToPrettyJson)
		.then(saveThePrettyReport)
		.then(reportToHTML)
		.then(htmlReport => {
			response.send(htmlReport);
		})
		.then( () => {
			process.exit(0);
		})
		.catch(error => {
			if (error instanceof LoggerData)
				response.send(Logger.logData(error));
			else
				response.send(Logger.error('/report', "Caught some error in 'GET'", error));
		});
});

module.exports = {
	reportRouter: router
};