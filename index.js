#!/usr/bin/env node
var simpleGit = require('simple-git')(process.cwd());
var config = require('./package.json').config;
var exec = require('child_process').exec;
var fs = require('fs');
var directoryName;
var projectPath;

var deleteFolderRecursive = function(path) {
  if( fs.existsSync(path) ) {
    fs.readdirSync(path).forEach(function(file,index){
      var curPath = path + "/" + file;
      if(fs.lstatSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};

function getLastArgument() {
  return process.argv.slice(-1)[0];
}

function cloneRepository(callback) {
  console.log('Cloning repository...');
  return new Promise((resolve) => {
    simpleGit.clone(config['boilerplate-repository'], projectPath, {}, resolve);
  });
}

function removeFile(file) {
  return new Promise(function(resolve) {
    fs.unlink(file, function(err) {
      if (err && err.code !== 'ENOENT') {
        throw err;
      }
      resolve();
    });
  });
}

function updatePackageJson(packageJSON) {
  return new Promise(function(resolve) {
    removeFile(projectPath + '/package.json').then(function() {
      fs.writeFile(projectPath + '/package.json', JSON.stringify(packageJSON, null, 2),
        function(err) {
          if(err) {
              throw err;
          }
          resolve();
      });
    });
  });
}

directoryName = getLastArgument();
projectPath = process.cwd() + '/' + directoryName;

if (directoryName.indexOf('/') !== -1) {
  console.error('Invalid directory name');
  return;
}

cloneRepository().then(function() {
  var packageJSON = require(projectPath + '/package.json');
  var newPackageJSON = Object.assign(packageJSON, { name: directoryName });
  console.log('Repository downloaded');

  updatePackageJson(newPackageJSON).then(function() {
    console.log('Project updated');
    deleteFolderRecursive(projectPath + '.git');
    console.log('Running npm install...');

    try {
      process.chdir(projectPath);
    }
    catch (err) {
      throw err;
    }

    exec('npm install', function(err, stdout, stderr) {
      if (err) {
        throw err;
      }

      console.log('Project created successfully!');
      console.log('=============================');
      console.log(' ');
      console.log('Run the following commands:');
      console.log('cd ' + directoryName);
      console.log('npm start');
    });
  });
});
