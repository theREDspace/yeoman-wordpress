
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
  , colors = require('colors')
  , uuid = require('node-uuid')


// custom statuses that aren't in colors just yet
function pad(status) {
  var max = 'identical'.length;
  var delta = max - status.length;
  return delta ? new Array(delta + 1).join(' ') + status : status;
}

var statuses = {
  update   : 'cyan',
  remove   : 'red'
}

var WPGenerator = module.exports = function Generator() {
  yeoman.generators.Base.apply(this, arguments)

  this.sourceRoot(path.join(__dirname, 'templates'))
}

util.inherits(WPGenerator, yeoman.generators.NamedBase)

// initialize generator
WPGenerator.prototype.initGenerator = function initGenerator() {
  var self = this

  self.log.writeln('')
  self.log.writeln('Intializing WP Generator'.bold)

  Object.keys(statuses).forEach(function (status) {
    self.log[status] = function() {
      var color = statuses[status]

      self.log.write(pad(status)[color]).write(' ')
      self.log.write(util.format.apply(util, arguments) + '\n')
      return self.log
    }
  })
}

// get the latest stable version of Wordpress
WPGenerator.prototype.getVersion = function getVersion() {
  var cb = this.async()
    , self = this
    , latestVersion = '3.5.1' // we still store the latest version to avoid throwing error

  this.log.writeln('')
  this.log.writeln('Trying to get the latest stable version of Wordpress'.bold)

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
WPGenerator.prototype.getBootstrapVersion = function getBootstrapVersion() {
  var cb = this.async()
    , self = this
    , latestBootstrapVersion = '2.3.1' // we still store the latest version to avoid throwing error

  this.log.writeln('')
  this.log.writeln('Trying to get the latest stable version of Twitter Bootstrap'.bold)

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
WPGenerator.prototype.getFAVersion = function getFAVersion() {
  var cb = this.async()
    , self = this
    , latestFAVersion = '3.0.2' // we still store the latest version to avoid throwing error

  this.log.writeln('')
  this.log.writeln('Trying to get the latest stable version of Font Awesome'.bold)

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
WPGenerator.prototype.getConfig = function getConfig() {
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

WPGenerator.prototype.askFor = function askFor() {
  var cb   = this.async()
    , self = this

    this.log.writeln('')
    this.log.writeln('Customize your WP instance'.bold)

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
          name: 'siteUrl',
          message: '\r\nSet up your WP Instance'.underline + '\r\nSite URL: ',
          default: ''
      },
      {
          name: 'siteTitle',
          message: 'Site Title: ',
          default: ''
      },
      {
          name: 'adminUser',
          message: 'Admin Username: '
      },
      {
          name: 'adminEmail',
          message: 'Admin Email: '
      },
      {
          name: 'adminPass',
          message: 'Admin Password: '
      },
      {
          name: 'dbtable',
          message: '\r\nSet up your WP Database'.underline + '\r\nDatabase Name: ',
          default: 'wordpress'
      },
      {
          name: 'dbprefix',
          message: 'Database Prefix: ',
          default: 'wp_'
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
    self.dbprefix = props.dbprefix
    self.siteUrl = props.siteUrl
    self.siteTitle = props.siteTitle
    self.adminUser = props.adminUser
    self.adminPass = props.adminPass
    self.adminEmail = props.adminEmail

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
WPGenerator.prototype.createApp = function createApp(cb) {
  var cb   = this.async()
    , self = this 

  this.log.writeln('');
  this.log.writeln('Downloading Wordpress version ' + self.wordpressVersion)
  this.tarball('https://github.com/WordPress/WordPress/tarball/' + self.wordpressVersion, 'app', cb)
}

// remove the basic theme and create a new one
WPGenerator.prototype.createTheme = function createTheme() {
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
WPGenerator.prototype.createBootstrap = function createBootstrap() {
  var cb   = this.async()
    , self = this

  this.log.writeln('Downloading Twitter Bootstrap ' + self.bootstrapVersion)
  this.tarball('https://github.com/twitter/bootstrap/tarball/v' + self.bootstrapVersion, 'src/bootstrap', cb)
}

// grab fontawesome
WPGenerator.prototype.createFontAwesome = function createFontAwesome() {
  var cb   = this.async()
    , self = this

  this.log.writeln('Downloading Font Awesome ' + self.fontAwesomeVersion)
  this.tarball('https://github.com/FortAwesome/Font-Awesome/tarball/v' + self.fontAwesomeVersion, 'src/font-awesome', cb)
}

// grab less elements
WPGenerator.prototype.createLessElements = function createLessElements() {
  var cb   = this.async()
    , self = this

  this.log.writeln('Downloading LESS Elements')
  this.tarball('https://github.com/dmitryf/elements/tarball/master', 'src/elements', cb)
}

WPGenerator.prototype.configureBootstrap = function configureBootstrap() {
  var self = this
    , sourceRoot = this.sourceRoot()

  self.sourceRoot(self.destinationRoot());

  self.log.writeln('Configuring Bootstrap')
  
  this.mkdir('src/less/includes')
  this.mkdir('app/wp-content/themes/' + self.themeName + '/js/bootstrap')
  this.mkdir('app/wp-content/themes/' + self.themeName + '/font')

  // less
  self.directory('src/bootstrap/less', 'src/less/includes')
  self.directory('src/font-awesome/less', 'src/less/includes')
  self.copy('src/elements/elements.less', 'src/less/includes/elements.less')

  // js
  self.directory('src/bootstrap/js', 'app/wp-content/themes/' + self.themeName + '/js/bootstrap')
  
  // fonts
  self.directory('src/font-awesome/font', 'app/wp-content/themes/' + self.themeName + '/font')

  // reset source root
  self.sourceRoot(sourceRoot)
}

// clean up the bad folders
WPGenerator.prototype.cleanInstall = function cleanInstall() {
  var self = this

  self.log.writeln('')
  self.log.writeln('Cleaning unneccessary files'.bold)
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
      self.log.remove(dir)
    }
  })
}

// // replace bootstrap sprites with font-awesome
WPGenerator.prototype.bootAwesome = function bootAwesome() {
  var cb = this.async()
    , self = this

  self.log.writeln('')
  self.log.writeln('Updating Bootstrap to use Font Awesome'.bold)
  
  //function bootUp() {
    var pathFile = 'src/less/includes/bootstrap.less'
    fs.readFile(pathFile, 'utf8', function(err, data) {
      if (err) throw err
      
      var result = data.replace('sprites.less', 'font-awesome.less')

      fs.writeFile(pathFile, result, 'utf8', function(werr) {
        if (werr) {
          self.log.writeln('Error')
          self.log.writeln(werr)
        } else {
          self.log.update(pathFile)
          cb()
        }
      })
    })
  //}

  //bootUp()
}

// build the CSS file for the theme
WPGenerator.prototype.createThemeStyle = function createThemeStyle() {
  this.log.writeln('')
  this.log.writeln('Building base theme less file'.bold)
  this.template('style.less', 'src/less/style.less')
  this.log.create('style.less')
}

// build database
WPGenerator.prototype.createDatabase = function createDatabase() {

  var cb = this.async()
    , self = this

  self.log.writeln('')  
  self.log.writeln('Creating database'.bold)

  function buildDB() {
    var connection  = mysql.createConnection({
      host     : 'localhost',
      user     : self.dbuser,
      password : self.dbpass,
    });

    connection.connect(function(err) {
      if (err) {
        self.log.error('Error connecting to database, please create the table manually')
      }

      self.log.info('Connected to MySQL')
      connection.query('CREATE DATABASE ' + self.dbtable, function(err, result) {
        if (err) {
          self.log.error('Could not create database')
        }

        self.log.create(self.dbtable + 'table')
        connection.end(function() {
          cb()
        })
      })
    })
  }

  buildDB()
}

// TODO: Improve database error checking

// // generate the files to use Yeoman and the git related files
 WPGenerator.prototype.createYeomanFiles = function createYeomanFiles() {
  this.log.writeln('')
  this.log.writeln('Building Yeoman Templates'.bold)

  this.log.info('Generating unique phrases')

  this.authKey = uuid.v4()
  this.secureAuthKey = uuid.v4()
  this.loggedInKey = uuid.v4()
  this.secureAuthKey = uuid.v4()
  this.nonceKey = uuid.v4()
  this.authSalt = uuid.v4()
  this.secureAuthSalt = uuid.v4()
  this.loggedInSalt = uuid.v4()
  this.nonceSalt = uuid.v4()
  
  this.template('Gruntfile.js')
  this.template('bowerrc', '.bowerrc')
  this.template('wp-config.php', 'app/wp-config.php')
  this.copy('package.json', 'package.json')
  this.copy('gitignore', '.gitignore')
  this.copy('gitattributes', '.gitattributes')
}

// configure grunt
WPGenerator.prototype.installGrunt = function installGrunt() {
  var cb = this.async()
    , self = this

  self.log.writeln('')
  self.log.writeln('Installing Grunt'.bold)
    
  var npm = spawn('npm', ['install'], { stdio: 'inherit' });

  npm.on('close', function(data) {
    cb();
  })
}

// run grunt build (so we have a .css file)
WPGenerator.prototype.buildStylesheet = function buildStylesheet() {
  var cb = this.async()
    , self = this

  self.log.writeln('')
  self.log.writeln('Building Stylesheet'.bold)
    
  var grunt = spawn('grunt', ['less'], { stdio: 'inherit' });

  grunt.on('close', function(data) {
    cb();
  })
}

WPGenerator.prototype.checkWPCLI = function checkWPCLI() {
  var cb = this.async()
    , self = this

  this.log.writeln('')
  this.log.writeln('Checking for WP-CLI'.bold)

  try {
    var version = exec(
      'wp help', 
      function(err, stdout, stderr) {
        if (err) {
          self.log.error('could not find wp-cli, skipping automatedcd  wp install')
          self.hasCLI = false;
        }
        else {
          self.hasCLI = true;
          self.log.ok('found instance of wp-cli')
        }

        cb()
      })
  }
  catch(e) {
    self.log.error('could not find wp-cli, skipping automated wp install')
    cb()
  }
}

WPGenerator.prototype.installWP = function installWP() {
  var cb = this.async()
    , self = this

  if (self.hasCLI) {
    this.log.writeln('')
    this.log.writeln('Installing WordPress'.bold)

    /**
      wp core install 
      --url=<url> 
      --title=<site-title> 
      [--admin_name=<username>] 
      --admin_email=<email> 
      --admin_password=<password>
    **/

    var cli = spawn(
      'wp', 
      [
        'core',
        'install',
        '--url=' + self.siteUrl,
        '--title="' + escape(self.siteTitle) + '"',
        '--admin_name=' + self.adminUser,
        '--admin_email=' + self.adminEmail,
        '--admin_password=' + self.adminPass
      ],
      {
        stdio: 'inherit',
        cwd: 'app'
      }
    )

    cli.on('close', function(data) {
      cb()
    })

  } else {
    cb()
  }
}

WPGenerator.prototype.endGenerator = function endGenerator() {
  this.log.writeln('')
  this.log.writeln('... and we\'re done!'.bold)

  if (!this.hasCLI) {
    this.log.writeln('')
    this.log.writeln('Now you just need to install Wordpress the usual way,')
    this.log.writeln('if you installed wp-cli (wp-cli.org), this task could be automated for you')
  }

  this.log.writeln('')
  this.log.writeln('Don\'t forget to activate the new theme in the admin panel, and then you can start coding!')
  

  this.log.writeln('')
}