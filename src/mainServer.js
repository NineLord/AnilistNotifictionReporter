const { resolve } = require('path');
const express = require('express');
const { config } = require('dotenv');
config();

// Setting up the ROOT_PATH variable
process.env.ROOT_PATH = resolve(__dirname);
process.env.ROOT_PATH = process.env.ROOT_PATH.slice(0, process.env.ROOT_PATH.length - 4); // removing the '/src'

const { indexRouter } = require('./routes/index');
const { reportRouter } = require('./routes/report');
const FileSystemRequest = require('./utils/fileSystemRequest');
const { Logger, LoggerData } = require('./logger');
const reporter = require('./Reporter');

// Creating the server
const mainServer = express();

// Adding the routes
mainServer.use('/', indexRouter);
mainServer.use('/report', reportRouter);

// Init stuff before starting the server
FileSystemRequest.readAsync(process.env.QUERY_FORM_FILE_NAME, FileSystemRequest.FILE_TYPE.Text)
	.then(queryForm => { // Init the queryForm
		Logger.debug('mainServer', "reading the qeuryForm file is done", queryForm);
		process.env.QUERY_FORM = queryForm;
	})
	.then( () => { // Init the reporter
		Logger.debug('mainServer', "init process.env.QUERY_FORM is done", process.env.QUERY_FORM);
		return reporter.initialize();
	})
	.then( () => { // Start the server
		Logger.debug('mainServer', "init reporter is done", reporter.serialize());
		mainServer.listen(process.env.PORT, () => {
			Logger.info('mainServer', `Listening on port ${process.env.PORT}`);
		});
	})
	.catch(error => {
		Logger.error('mainServer', "Couldn't read the queryForm file", error);
	});