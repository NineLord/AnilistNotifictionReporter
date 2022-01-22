const { config } = require('dotenv');
config();

class Logger {

	static #log(level, path, myMessage, thrownMessage = undefined) {
		let consoleThrownMessage, htmlThrownMessage;

		if (thrownMessage) {
			consoleThrownMessage = `:: ${JSON.stringify(thrownMessage, null, 2)}`;
			htmlThrownMessage = `:: ${consoleThrownMessage.replace("\n", "<br>")}`;
		} else {
			consoleThrownMessage = "";
			htmlThrownMessage = "";
		}

		const consoleResult = `${new Date().toLocaleString()} :: ${level} :: ${path} :: ${myMessage} ${consoleThrownMessage}`;
		const htmlResult = `${new Date().toLocaleString()} :: ${level} :: ${path} :: ${myMessage} ${htmlThrownMessage}`;

		if (level !== LoggerData.LEVEL.Debug || process.env.DEBUG === "true")
			console.error(consoleResult);

		return htmlResult;
	}

	static logData(loggerData) {
		return this.#log(loggerData.level, loggerData.path, loggerData.myMessage, loggerData.thrownMessage);
	}

	static error(path, myMessage, thrownMessage) {
		return this.#log('Error', path, myMessage, thrownMessage);
	}

	static warn(path, myMessage, thrownMessage) {
		return this.#log('Warn', path, myMessage, thrownMessage);
	}

	static debug(path, myMessage, thrownMessage) {
		return this.#log('Debug', path, myMessage, thrownMessage);
	}

	static info(path, myMessage, thrownMessage) {
		return this.#log('info', path, myMessage, thrownMessage);
	}

}

class LoggerData {

	#level;
	#path;
	#myMessage;
	#thrownMessage;

	static LEVEL = {
		Error: "Error",
		Warn: "Warn",
		Debug: "Debug",
		Info: "info"
	}

	constructor(level, path, myMessage, thrownMessage) {
		this.#level = level;
		this.#path = path;
		this.#myMessage = myMessage;
		this.#thrownMessage = thrownMessage;
	}

	get level() {
		return this.#level;
	}

	get path() {
		return this.#path;
	}

	get myMessage() {
		return this.#myMessage;
	}

	get thrownMessage() {
		return this.#thrownMessage;
	}
}

module.exports = {
	Logger,
	LoggerData
};