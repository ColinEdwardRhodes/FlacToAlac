var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;
var async = require('async');
var express = require('express');
var argv = require('yargs')
    .usage('Usage: $0 -s [src] -d [dest] -c concurrency')
    .demand(['s','d'])
    .argv;
var path = require('path');

var processingQueue = async.queue(function (task, callback) {
    console.log('Running ' + task.name);

    var cmd = 'C:\\ffmpeg-20151011-git-f05ff05-win64-static\\bin\\ffmpeg.exe -i '
        + '"' + task.name + '"'
        + ' -c:a alac '
        + argv.d + '\\' + generateUUID() + '.m4a';


    exec(cmd, function (error, stdout, stderr) {

        if (stderr !== null) {
            callback(stderr);
        } else if (error !== null) {
            callback(error);
        } else {
            callback();
        }
    });

}, 2);

// Windows?
var win32 = process.platform === 'win32';

// Normalize \\ paths to / paths.
function unixifyPath(filepath) {
  if (win32) {
    return filepath.replace(/\\/g, '/');
  } else {
    return filepath;
  }
};

function generateUUID() {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
};

// Recurse into a directory, executing callback for each file.
function walk(rootdir, callback, subdir) {
  var abspath = subdir ? path.join(rootdir, subdir) : rootdir;
  fs.readdirSync(abspath).forEach(function(filename) {
    var filepath = path.join(abspath, filename);
    if (fs.statSync(filepath).isDirectory()) {
      walk(rootdir, callback, unixifyPath(path.join(subdir || '', filename || '')));
    } else {
      callback(unixifyPath(filepath), rootdir, subdir, filename);
    }
  });
};

var matcher = /flac$/

walk(argv.s, function(filepath, rootdir, subdir, filename) {

        if (filepath.match(matcher)) {
            processingQueue.push({name: filepath}, function (err) {
                console.log('Failed on ', filepath);
            })
        }
    }
, '');

processingQueue.drain = function() {
    console.log('all items have been processed');
}