
'use strict'

var util   = require('util')
  , path   = require('path')
  , fs     = require('fs')
  , yeoman = require('yeoman-generator')
  , rimraf = require('rimraf')
  , mysql = require('mysql')
  , exec   = require('child_process').exec
  , spawn = require('child_process').spawn
  , config = require('./../config.js')
  , automaton = require('automaton').create()


module.exports = Generator

function Generator() {
  yeoman.generators.Base.apply(this, arguments)

  this.sourceRoot(path.join(__dirname, 'templates'))
}

util.inherits(Generator, yeoman.generators.NamedBase)

// get the latest stable version of Wordpress
Generator.prototype.getVersion = function getVersion() {
  var cb = this.async()
    , self = this
    , latestVersion = '3.5.1' // we still store the latest version to avoid throwing error

  this.log.writeln('')
  this.log.writeln('Trying to get the latest stable version of Wordpress')

  // try to get the latest version using the git tags
  try {
    var version = exec('git ls-remote --tags git://github.com/WordPress/WordPress.git | tail -n 1', function(err, stdout, stderr) {
                    if (err) {
                      self.latestVersion = latestVersion
                    }
                    else {
                      var pattern = /\d\.\d[\.\d]*/ig
                        , match = pattern.exec(stdout)

                      if (match !== null) {
                        self.latestVersion = match[0]
                        self.log.writeln('Latest version: '+self.latestVersion)
                      }
                      else {
                        self.latestVersion = latestVersion
                      }
                    }

                    cb()
                  })
  }
  catch(e) {
    self.latestVersion = latestVersion
    cb()
  }
}

// get the latest stable version of Bootstrap
Generator.prototype.getBootstrapVersion = function getBootstrapVersion() {
  var cb = this.async()
    , self = this
    , latestBootstrapVersion = '2.3.1' // we still store the latest version to avoid throwing error

  this.log.writeln('')
  this.log.writeln('Trying to get the latest stable version of Twitter Bootstrap')

  // try to get the latest version using the git tags
  try {
    var version = exec('git ls-remote --tags git://github.com/twitter/bootstrap.git | tail -n 1', function(err, stdout, stderr) {
                    if (err) {
                      self.latestBootstrapVersion = latestBootstrapVersion
                    }
                    else {
                      var pattern = /\d\.\d[\.\d]*/ig
                        , match = pattern.exec(stdout)

                      if (match !== null) {
                        self.latestBootstrapVersion = match[0]
                        self.log.writeln('Latest version: '+self.latestBootstrapVersion)
                      }
                      else {
                        self.latestBootstrapVersion = latestBootstrapVersion
                      }
                    }

                    cb()
                  })
  }
  catch(e) {
    self.latestBootstrapVersion = latestBootstrapVersion
    cb()
  }
}

// get the latest stable version of Font Awesome
Generator.prototype.getFAVersion = function getFAVersion() {
  var cb = this.async()
    , self = this
    , latestFAVersion = '3.0.2' // we still store the latest version to avoid throwing error

  this.log.writeln('')
  this.log.writeln('Trying to get the latest stable version of Font Awesome')

  // try to get the latest version using the git tags
  try {
    var version = exec('git ls-remote --tags git://github.com/FortAwesome/Font-Awesome.git | tail -n 1', function(err, stdout, stderr) {
                    if (err) {
                      self.latestFAVersion = latestFAVersion
                    }
                    else {
                      var pattern = /\d\.\d[\.\d]*/ig
                        , match = pattern.exec(stdout)

                      if (match !== null) {
                        self.latestFAVersion = match[0]
                        self.log.writeln('Latest version: '+self.latestFAVersion)
                      }
                      else {
                        self.latestFAVersion = latestFAVersion
                      }
                    }

                    cb()
                  })
  }
  catch(e) {
    self.latestFAVersion = latestFAVersion
    cb()
  }
}

// try to find the config file and read the infos to set the prompts default values
Generator.prototype.getConfig = function getConfig() {
  var cb   = this.async()
    , self = this

  self.defaultAuthorName = ''
  self.defaultAuthorURI = ''
  self.defaultTheme = 'https://github.com/theREDspace/wp_starter'
  self.configExists = false

  config.getConfig(function(err, data) {
    if (!err) {
      self.defaultAuthorName = data.authorName || self.defaultAuthorName
      self.defaultAuthorURI = data.authorURI || self.defaultAuthorURI
      self.defaultTheme = data.theme || self.defaultTheme

      if (data.authorName && data.authorURI && data.theme) {
        self.configExists = true
      }
    }

    cb()
  })
}

Generator.prototype.askFor = function askFor() {
  var cb   = this.async()
    , self = this

    self.themeNameOriginal = 'mytheme'
    self.themeName = 'mytheme'
    self.themeOriginalURL = self.defaultTheme
    self.themeBoilerplate = self.defaultTheme
    self.wordpressVersion = self.latestVersion
    //self.usejQuery = props.usejQuery
    self.authorName = self.defaultAuthorName
    self.authorURI = self.defaultAuthorURI
    
    self.bootstrapVersion = self.latestBootstrapVersion
    self.fontAwesomeVersion = self.latestFAVersion

    var prompts = [{
          name: 'themeName',
          message: 'Name of the theme you want to use: ',
          default: 'mytheme'
      },
      {
          name: 'wordpressVersion',
          message: 'Which version of Wordpress do you want?',
          default: self.latestVersion
      },
      // {
      //     name: 'usejQuery',
      //     message: 'Would you like to use jQuery?',
      //     default: 'Y/n'
      // },
      
      // Removed by LD -- not enough of our projects are using require at the moment,
      // so I have removed this for now.

      // {
      //     name: 'includeRequireJS',
      //     message: 'Would you like to include RequireJS (for AMD support)?',
      //     default: 'Y/n',
      //     warning: 'Yes: RequireJS will be placed into the JavaScript vendor directory.'
      // },
      {
          name: 'themeBoilerplate',
          message: 'Starter theme (please provide a github link): ',
          default: self.defaultTheme
      },
      /*{
          name: 'themeNamespace',
          message: 'Theme Namespace: ',
          default: self.defaultTheme
      },*/
      {
          name: 'authorName',
          message: 'Author name: ',
          default: self.defaultAuthorName
      },
      {
          name: 'authorURI',
          message: 'Author URI: ',
          default: self.defaultAuthorURI
      },
      {
          name: 'dbtable',
          message: '\n\nSet up your WP Database\nDatabase Name: ',
          default: 'wordpress'
      },
      {
          name: 'dbuser',
          message: 'Database Username: '
      },
      {
          name: 'dbpass',
          message: 'Database Password: '
      },
      ]
      

  this.prompt(prompts, function(e, props) {
    if(e) { return self.emit('error', e) }

    // set the property to parse the gruntfile
    self.themeNameOriginal = props.themeName
    self.themeName = props.themeName.replace(/\ /g, '').toLowerCase()
    self.themeOriginalURL = props.themeBoilerplate
    self.themeBoilerplate = props.themeBoilerplate
    self.wordpressVersion = props.wordpressVersion
    //self.includeRequireJS = (/y/i).test(props.includeRequireJS)
    self.authorName = props.authorName
    self.authorURI = props.authorURI
    self.dbtable = props.dbtable
    self.dbuser = props.dbuser
    self.dbpass = props.dbpass

    // check if the user only gave the repo url or the entire url with /tarball/{branch}
    var tarballLink = (/[.]*tarball\/[.]*/).test(self.themeBoilerplate)
    if (!tarballLink) {
      // if the user gave the repo url we add the end of the url. we assume he wants the master branch
      var lastChar = self.themeBoilerplate.substring(self.themeBoilerplate.length - 1)
      if (lastChar === '/') {
        self.themeBoilerplate = self.themeBoilerplate+'tarball/master'
      }
      else {
        self.themeBoilerplate = self.themeBoilerplate+'/tarball/master'
      }
    }
    
    // create the config file it does not exist
    if (!self.configExists) {
      var values = {
        authorName: self.authorName
      , authorURI:  self.authorURI
      , themeUrl:   self.themeOriginalURL
      }
      config.createConfig(values, cb)
    }
    else {
      cb()
    }
  })
}

// download the framework and unzip it in the project app/
Generator.prototype.createApp = function createApp(cb) {
  var cb   = this.async()
    , self = this 

  this.log.writeln('');
  this.log.writeln('Downloading Wordpress version ' + self.wordpressVersion)
  this.tarball('https://github.com/WordPress/WordPress/tarball/' + self.wordpressVersion, 'app', cb)
}

// remove the basic theme and create a new one
Generator.prototype.createTheme = function createTheme() {
  var cb   = this.async()
    , self = this

  this.log.writeln('Removing default themes')
  // remove the existing themes
  fs.readdir('app/wp-content/themes', function(err, files) {
    if (typeof files != 'undefined' && files.length != 0) {
      files.forEach(function(file) {
        var pathFile = fs.realpathSync('app/wp-content/themes/'+file)
          , isDirectory = fs.statSync(pathFile).isDirectory()

        if (isDirectory) {
          rimraf.sync(pathFile)
          self.log.writeln('Removing ' + pathFile)
        }
      })
    }

    self.log.writeln('')
    self.log.writeln('Downloading the starter theme')

    // create the theme
    self.tarball(self.themeBoilerplate, 'app/wp-content/themes/'+self.themeName, cb)
  })
}

// grab bootstrap
Generator.prototype.createBootstrap = function createBootstrap() {
  var cb   = this.async()
    , self = this

  this.log.writeln('Downloading Twitter Bootstrap ' + self.bootstrapVersion)
  this.tarball('https://github.com/twitter/bootstrap/tarball/v' + self.bootstrapVersion, 'src/bootstrap', cb)
}

// grab fontawesome
Generator.prototype.createFontAwesome = function createFontAwesome() {
  var cb   = this.async()
    , self = this

  this.log.writeln('Downloading Font Awesome ' + self.fontAwesomeVersion)
  this.tarball('https://github.com/FortAwesome/Font-Awesome/tarball/v' + self.fontAwesomeVersion, 'src/font-awesome', cb)
}

// grab less elements
Generator.prototype.createLessElements = function createLessElements() {
  var cb   = this.async()
    , self = this

  this.log.writeln('Downloading LESS Elements')
  this.tarball('https://github.com/dmitryf/elements/tarball/master', 'src/elements', cb)
}

Generator.prototype.configureBootstrap = function configureBootstrap() {
  var cb   = this.async()
    , self = this
    , cleanTask = {
      name: 'Clean Bootstrap',
      tasks: [
        {
          task: 'mkdir',
          options: {
            dirs: [
            'src/less/includes', 
            'src/js',
            'src/font'
            ]
          }
        },
        {
          task: 'mv',
          options: {
            files: {
              'src/bootstrap/js': 'src/',
              'src/bootstrap/less/*': 'src/less/includes',
              'src/font-awesome/less/*': 'src/less/includes',
              'src/font-awesome/font': 'src',
              'src/elements/*.less': 'src/less/includes'
            }
          }
        },
        {
          task: 'rm',
          options: {
            files: [
              'src/less/includes/sprites.less'
            ]
          }
        },
        {
          task: function(o, c, next) {
            
            self.log.writeln('Cleaning unneccessary files')
            var dirs = [
              'src/bootstrap',
              'src/font-awesome',
              'src/elements',
            ]

            dirs.forEach(function(dir) {
              var pathFile = fs.realpathSync(dir)
                , isDirectory = fs.statSync(pathFile).isDirectory()

              if (isDirectory) {
                rimraf.sync(pathFile)
                self.log.writeln('Removing ' + dir)
              }
            })
            
            self.log.writeln('')
            next()
          }
        },
        {
          task: function(o, c, next) {

            self.log.writeln('Updating Bootstrap to use Font Awesome')
            var pathFile = 'src/less/includes/bootstrap.less'
            fs.readFile(pathFile, 'utf8', function(err, data) {
              if (err) throw err
              
              // replace sprites with font-awesome
              var result = data.replace('sprites.less', 'font-awesome.less')

              fs.writeFile(pathFile, result, 'utf8', function(err) {
                if (err) {
                  self.log.writeln('Error')
                  self.log.writeln(err)
                } else {
                  next()
                }
              })
            })
          }
        }, 
        {
          task: function(o, c, next) {
            self.log.writeln('Building base theme less file')
            self.template('style.less', 'src/less/style.less')
            next();
          }
        },
      ]
    }

  self.log.writeln('Configuring Bootstrap')
  
  automaton.run(cleanTask, {}, function(err) {
    if (!err) {
      cb()
    } else {
      self.log.writeln('Error')
      self.log.writeln(err)
    }
  });
}

// build database
Generator.prototype.createDatabase = function createDatabase() {
  var cb = this.async()
    , self = this

  self.log.writeln('Creating database: ' + self.dbtable)
  // db.auth('root', 'root')
  var connection  = mysql.createConnection({
    host     : 'localhost',
    user     : self.dbuser,
    password : self.dbpass,
  });

  connection.connect(function(err) {
    if (err) {
      self.log.writeln('Error connecting to database, please create the table manually')
      cb()
    }

    self.log.writeln('')
    self.log.writeln('Connected to MySQL')
    connection.query('CREATE DATABASE ' + self.dbtable, function(err, result) {
      if (err) {
        self.log.writeln('Could not create database')
        cb()
      }

      self.log.writeln('Databse created')
      self.log.writeln('')
      connection.end()
      cb()
    })
  });
}

// generate the files to use Yeoman and the git related files
Generator.prototype.createYeomanFiles = function createYeomanFiles() {
  this.template('Gruntfile.js')
  this.template('bowerrc', '.bowerrc')
  this.copy('package.json', 'package.json')
  this.copy('gitignore', '.gitignore')
  this.copy('gitattributes', '.gitattributes')
}

Generator.prototype.endGenerator = function endGenerator() {
  this.log.writeln('')
  this.log.writeln('... and we\'re done!')
  //this.log.writeln('Now you just need to install Wordpress the usual way')
  //this.log.writeln('Don\'t forget to activate the new theme in the admin panel, and then you can start coding!')
  this.log.writeln('')
}

Generator.prototype.configureGrunt = function configureGrunt() {
  var self = this

  self.log.writeln('')
  self.log.writeln('Configuring Grunt')
    
  spawn('npm', ['install'], { stdio: 'inherit' });
  /*try {
    var version = exec('npm install', { stdio: 'inherit' }, function(err, stdout, stderr) {
                    if (err) {
                      self.log.writeln('Could not configure Grunt')
                      self.log.writeln(err)
                    } else {
                      self.log.writeln('')
                      self.log.writeln(stdout)
                    }
                    
                    cb()
                  })
  }
  catch(e) {
    self.log.writeln('Error: Could not configure Grunt')
    self.log.writeln(e)
    cb()
  }*/
}
