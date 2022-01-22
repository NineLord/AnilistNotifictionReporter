const https = require('https');

class Request {

	static isValidAccessToken(data) {
		return (
			data !== null &&
			data.hasOwnProperty('token_type') && data['token_type'] === "Bearer" &&
			data.hasOwnProperty('expires_in') &&
			data.hasOwnProperty('access_token')
		);
	}

	static isValidAuthCode(request) {
		return (
			request.hasOwnProperty('query') &&
			request.query.hasOwnProperty('code')
		);
	}

	static isValidPageActivity(data) {
		return (
			data !== null &&
				data.hasOwnProperty('data') &&
				data.data.hasOwnProperty('Page') &&
				data.data.Page.hasOwnProperty('notifications') &&
				Array.isArray(data.data.Page.notifications)
		);
	}

	/**
	 * Convert the createdAt field from Anilist's queries
	 * to actual time stamp.
	 * @param createdAt {number}
	 * @return {string} readable timestamp.
	 */
	static convertCreatedAtToString(createdAt) {
		return new Date(createdAt * 1000).toLocaleString();
	}

	static optionsHttpsPOSTgetToken(contentLength) {
		return {
			hostname: 'anilist.co',
			path: '/api/v2/oauth/token',
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Content-Length': contentLength,
				'Accept': 'application/json'
			}
		};
	}

	static optionsHttpsPOSTquery(accessToken, contentLength) {
		return {
			hostname: 'graphql.anilist.co',
			path: '/',
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
				'Content-Length': contentLength,
				'Accept': 'application/json'
			}
		};
	}

	static async postAsync(httpsRequestOptions, rawData) {
		return new Promise((resolve, reject) => {
			const innerReq = https.request(httpsRequestOptions, (response) => {
				let responseData = '';
				response.on('data', chunk => responseData += chunk );
				response.on('error', error => reject(error) );
				response.on('end', () => {
					const jsonData = JSON.parse(responseData);
					resolve(jsonData);
				});
			});

			innerReq.on('error', error => reject(error) );
			innerReq.write(rawData);
			innerReq.end();
		});
	}

}

module.exports = Request;
