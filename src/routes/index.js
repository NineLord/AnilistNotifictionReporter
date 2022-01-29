const express = require('express');
const router = express.Router();
const { config } = require('dotenv');
config();

const { Logger, LoggerData } = require('../logger');
const FileSystemRequest = require('../utils/fileSystemRequest');

router.get('/', async (request, response) => {

	function respond(response, requestNewToken) {
		let linkForward;
		if (requestNewToken)
			linkForward = `${process.env.ISSUER_BASE_URL}?client_id=${process.env.CLIENT_ID}&redirect_uri=${process.env.CALLBACK_URL}&response_type=code`;
		else
			linkForward = `${process.env.CALLBACK_URL}`;

		const title = `<h1>Welcome to Notification Report</h1>`;
		const button = `<a href="${linkForward}">Get the report</a>`;

		response.send(
			`${title}<br>
					${button}`);
	}

	FileSystemRequest.existsAsync(process.env.ACCESS_TOKEN_FILE_NAME, "output")
		.then(exits => {
			if (exits)
				return FileSystemRequest.readAsync(process.env.ACCESS_TOKEN_FILE_NAME, "output")
					.then(data => {
						if (!FileSystemRequest.isValidAccessTokenFile(data))
							throw new LoggerData(LoggerData.LEVEL.Error, '/', `existsAsync return true but readAsync returned invalid token`, data);

						const futureDate = new Date(data['created_at']);
						futureDate.setSeconds(futureDate.getSeconds() + data['expires_in']);
						if ((futureDate - new Date()) / 1000 / 60 > 10) // If its at least 10 minutes into the future, then we continue to use the token.
							respond(response, false);
						else
							respond(response, true);
					});
			else
				respond(response, true);
		})
		.catch(error => {
			if (error instanceof LoggerData)
				Logger.logData(error);
			else
				Logger.error('/', "Caught unknown error", error);
			respond(response, true);
		});
});

module.exports = {
	indexRouter: router
};