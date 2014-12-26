#!/usr/bin/env node

/**
 * Module dependencies.
 */

var program = require('commander');
var package = require('./package.json');
var fs = require('fs');
var walk = require('fs-walk');
var path = require('path');
var _ = require('lodash');

/**
 * Global variables
 */

var directoryList = [];

/**
 * Functions
 */

var saveStringToFile = function (stringValue, filepath) {
    fs.writeFile(filepath, stringValue, function (err) {
        if (err) throw err;
        console.log('It\'s saved to ' + filepath + ' !');
    });
};

var saveVariableToJSON = function (variable, filepath) {
    var variableString = JSON.stringify(variable);
    saveStringToFile(variableString || "{}", filepath);
};

var filenameFromDirectory = function (directory) {
    var dirname = directory.split('/').slice(-1)[0];
    return directory.substr(0, directory.lastIndexOf('/')) + '/' + dirname + '.json';
}

var combineFiles = function (directory, output, exclude) {
    exclude = typeof exclude !== 'undefined' ? exclude : [".gitignore", "node_modules", ".git"];
    var completeJSON = {};
    var addFile = function (basedir, filename) {
        if (filename.split('.').slice(-1)[0].toLowerCase() == "json") {
            try {
                completeJSON[filename.substr(0, filename.lastIndexOf('.'))] = require(path.resolve(basedir + '/' + filename));
            } catch (ex) {
                completeJSON[filename.substr(0, filename.lastIndexOf('.'))] = {};
            }
        }
    };
    walk.walkSync(directory, function (basedir, filename, stat) {
        var allow = true;
        var dirPath = basedir.split(path.sep);
        allow = (_.intersection(dirPath, exclude).length === 0) && (_.indexOf(exclude, filename) === -1);
        if (allow) {
            if (!stat.isDirectory()) {
                if (basedir == directory) {
                    addFile(basedir, filename);
                }
            } else {
                if (program.recursive) {
                    var directoryName = path.resolve(basedir + '/' + filename)
                    var fileName = filenameFromDirectory(directoryName);
                    combineFiles(directoryName, fileName);
                    addFile(basedir, filename);
                }
            }
        }
    });
    saveVariableToJSON(completeJSON, output);
    return completeJSON;
};

/**
 * Initialising
 */

walk.walkSync('.', function (basedir, filename, stat) {
    if (stat.isDirectory()) {
        if (filename[0] != '.') {
            directoryList.push(basedir + '/' + filename);
        }
    } else {
        if (basedir == path.resolve('.')) {
            console.log(filename + ": " + stat);
        }
    }
});

/**
 * CLI commands
 */

program
    .version(package.version)
    .usage('[options]')
    .option('-d, --directory [directory]', 'Directory Path to be followed [' + directoryList[0] + ']', directoryList[0])
    .option('-R, --recursive', 'Combine JSON files recursively')
    .parse(process.argv);

/**
 * Code execution
 */

var variable = combineFiles(program.directory, filenameFromDirectory(path.resolve(program.directory)));