
'use strict'

var util   = require('util')
	, path   = require('path')
  	, fs     = require('fs')
  	, yeoman = require('yeoman-generator')
  	, rimraf = require('rimraf')
  	, config = require('./../config.js')

module.exports = Generator

function Generator() {
  yeoman.generators.Base.apply(this, arguments)

  this.sourceRoot(path.join(__dirname, 'templates'))
}

util.inherits(Generator, yeoman.generators.NamedBase)

// cleaning what we don't need -- speeding up dev
Generator.prototype.cleanMe = function cleanMe() {
  var cb   = this.async()
    , self = this
    , cfiles = []

  this.log.writeln('Cleaning Files...')
  // remove the existing themes
  fs.readdir('.', function(err, files) {
  	self.log.writeln(files)
    if (typeof files != 'undefined' && files.length != 0) {
    	files.forEach(function(file) {
    		var pathFile = fs.realpathSync(file)
    		, isDirectory = fs.statSync(pathFile).isDirectory()

    		if (isDirectory) {
    			if (pathFile.indexOf('node_modules') === -1) {
    				rimraf.sync(pathFile)
    	       	}
    		} else {
    			cfiles.push(pathFile)
    		}
    	})
    }

    var cleanTask = {
      name: 'Clean Directory',
      tasks: [
        	{
          	task: 'rm',
          	options: {
        	    files: cfiles
          	}
          }
    	]
    }
  })
}


Generator.prototype.endGenerator = function endGenerator() {
  this.log.writeln('')
  this.log.writeln('... and we\'re done!')
  //this.log.writeln('Now you just need to install Wordpress the usual way')
  //this.log.writeln('Don\'t forget to activate the new theme in the admin panel, and then you can start coding!')
  this.log.writeln('')
}