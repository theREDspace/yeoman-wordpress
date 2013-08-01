'use strict';

// Dependencies
var util    = require('util');
var path    = require('path');
var fs      = require('fs');
var yeoman  = require('yeoman-generator');
var rimraf  = require('rimraf');
var mysql   = require('mysql');
var exec    = require('child_process').exec;
var spawn   = require('child_process').spawn;
var config  = require('./../config.js');
var colors  = require('colors');
var uuid    = require('node-uuid');
var request = require('request');

/**
 * A new Yeoman generator.
 * @constructor
 * @extends yeoman.generators.NamedBase
 */
var WordPressGenerator = module.exports = function Generator(args, options, config) {
  yeoman.generators.Base.apply(this, arguments);

  // Set the sorce root used with .read() and .template()
  this.sourceRoot(path.join(__dirname, 'templates'));
};

util.inherits(WordPressGenerator, yeoman.generators.NamedBase);

/**
 * Initalize our generator by adding some new methods to the log function.
 */
WordPressGenerator.prototype.initGenerator = function () {
  this.log.writeln('=> Intializing WordPress Generator'.bold);
};

/**
 * Extends the logger with a .update() and a .remove() method.
 */
WordPressGenerator.prototype.extendLogger = function () {
  // Add a new update() logging method
  this.log.update = function () {
    this.write('   update '.cyan);
    return this.writeln.apply(this, arguments);
  };

  // Add a new remove() logging method
  this.log.remove = function () {
    this.write('   remove '.red);
    return this.writeln.apply(this, arguments);
  };
};

/**
 * Get the latest version of WordPress from GitHub.
 */
WordPressGenerator.prototype.findLatestWordPressVersion = function () {
  var cb            = this.async();
  var self          = this;
  var latestVersion = '3.5.1';

  this.log.writeln('=> Looking up the latest version of WordPress'.bold);

  // Try to get the latest version using the GitHub tags API
  request('https://api.github.com/repos/WordPress/WordPress/git/refs/tags', function (err, response, body) {
    if (!err && response.statusCode == 200) {
      // Determine the newest tag
      var tags      = JSON.parse(body);
      latestVersion = tags[tags.length - 1].ref.match(/refs\/tags\/(.*)/)[1];

      // User feedback
      self.log.writeln('     - Latest version is ' + latestVersion);
    } else {
      self.log.writeln('     - Unable to determine latest version, using ' + latestVersion);
    }

    self.latestWordPressVersion = latestVersion;
    cb();
  });
};

/**
 * Get the latest stable version of Twitter Bootstrap.
 */
WordPressGenerator.prototype.findLatestBootstrapVersion = function () {
  var cb            = this.async();
  var self          = this;
  var latestVersion = '2.3.0';

  this.log.writeln('=> Looking up the latest version of Twitter Bootstrap'.bold);

  // Try to get the latest version using the GitHub tags API
  request('https://api.github.com/repos/twbs/bootstrap/git/refs/tags', function (err, response, body) {
    if (!err && response.statusCode == 200) {
      // Determine the newest tag
      var tags      = JSON.parse(body);
      latestVersion = tags[tags.length - 1].ref.match(/refs\/tags\/(.*)/)[1];

      // User feedback
      self.log.writeln('     - Latest version is ' + latestVersion);
    } else {
      self.log.writeln('     - Unable to determine latest version, using ' + latestVersion);
    }

    self.latestTwitterBootstrapVersion = latestVersion;
    cb();
  });
};

/**
 * Get the latest stable version of Font Awesome.
 */
WordPressGenerator.prototype.findLatestFontAwesomeVersion = function () {
  var cb            = this.async();
  var self          = this;
  var latestVersion = '3.2.0';

  this.log.writeln('=> Looking up the latest version of Font Awesome'.bold);

  // Try to get the latest version using the GitHub tags API
  request('https://api.github.com/repos/FortAwesome/Font-Awesome/git/refs/tags', function (err, response, body) {
    if (!err && response.statusCode == 200) {
      // Determine the newest tag
      var tags      = JSON.parse(body);
      latestVersion = tags[tags.length - 1].ref.match(/refs\/tags\/(.*)/)[1];

      // User feedback
      self.log.writeln('     - Latest version is ' + latestVersion);
    } else {
      self.log.writeln('     - Unable to determine latest version, using ' + latestVersion);
    }

    self.latestFontAwesomeVersion = latestVersion;
    cb();
  });
};

/**
 * Try to find the config file and read the infos to set the prompts default
 * values.
 */
WordPressGenerator.prototype.getConfig = function () {
  var cb   = this.async();
  var self = this;

  // Default configuration settings
  self.defaultAuthorName = 'theREDspace';
  self.defaultAuthorURI  = 'http://www.theredspace.com/';
  self.defaultTheme      = 'https://github.com/theREDspace/wp_starter';
  self.configExists      = false;

  // Attempt to load the config file
  config.getConfig(function (err, data) {
    if (!err) {
      self.defaultAuthorName = data.authorName || self.defaultAuthorName;
      self.defaultAuthorURI  = data.authorURI || self.defaultAuthorURI;
      self.defaultTheme      = data.theme || self.defaultTheme;

      if (data.authorName && data.authorURI && data.theme) {
        self.configExists = true;
      }
    }

    cb();
  });
};

/**
 * Ask the user for input regarding their WordPress installation.
 */
WordPressGenerator.prototype.askFor = function () {
  var cb   = this.async();
  var self = this;

  this.log.writeln('\nConfigure WordPress Installation:\n'.underline.bold);

  // Get the default values for our below prompts
  self.themeNameOriginal  = 'mytheme';
  self.themeName          = 'mytheme';
  self.themeOriginalURL   = self.defaultTheme;
  self.themeBoilerplate   = self.defaultTheme;
  self.wordpressVersion   = self.latestVersion;
  self.authorName         = self.defaultAuthorName;
  self.authorURI          = self.defaultAuthorURI;
  self.bootstrapVersion   = self.latestTwitterBootstrapVersion;
  self.fontAwesomeVersion = self.latestFontAwesomeVersion;

  var prompts = [
    {
      name    : 'themeName',
      message : 'Name your starter theme: ',
      default : 'mytheme'
    }, {
      name    : 'wordpressVersion',
      message : 'WordPress Version: ',
      default : self.latestWordPressVersion
    }, {
      name    : 'themeBoilerplate',
      message : 'Starter theme (please provide a GitHub link): ',
      default : self.defaultTheme
    }, {
      name    : 'authorName',
      message : 'Author Name: ',
      default : self.defaultAuthorName
    }, {
      name    : 'authorURI',
      message : 'Author URI: ',
      default : self.defaultAuthorURI
    }, {
      name    : 'siteUrl',
      message : '\nConfigure WordPress Settings:'.underline.bold + '\n\nSite URL: ',
      default : 'http://localhost'
    }, {
      name    : 'siteTitle',
      message : 'Site Title: ',
      default : 'WordPress'
    }, {
      name    : 'adminUser',
      message : 'Admin Username: ',
      default : 'admin'
    }, {
      name    : 'adminEmail',
      message : 'Admin Email: ',
      default : 'admin@localhost'
    }, {
        name    : 'adminPass',
        message : 'Admin Password: ',
        default : 'admin'
    }, {
      name    : 'dbtable',
      message : '\nConfigure WordPress Database Settings: '.underline.bold + '\n\nDatabase Name: ',
      default : 'wordpress'
    }, {
      name    : 'dbprefix',
      message : 'Database Prefix: ',
      default : 'wp_'
    }, {
      name    : 'dbuser',
      message : 'Database Username: ',
      default : 'wordpress'
    }, {
      name    : 'dbpass',
      message : 'Database Password: '
    }
  ];

  this.prompt(prompts, function (err, props) {
    if (err) {
      return self.emit('error', err);
    }

    // Set the property to parse the gruntfile
    self.themeNameOriginal = props.themeName;
    self.themeName         = props.themeName.replace(/\ /g, '').toLowerCase();
    self.themeOriginalURL  = props.themeBoilerplate;
    self.themeBoilerplate  = props.themeBoilerplate;
    self.wordpressVersion  = props.wordpressVersion;
    self.authorName        = props.authorName;
    self.authorURI         = props.authorURI;
    self.dbtable           = props.dbtable;
    self.dbuser            = props.dbuser;
    self.dbpass            = props.dbpass;
    self.dbprefix          = props.dbprefix;
    self.siteUrl           = props.siteUrl;
    self.siteTitle         = props.siteTitle;
    self.adminUser         = props.adminUser;
    self.adminPass         = props.adminPass;
    self.adminEmail        = props.adminEmail;

    // Just get the user & repository part of the link
    var repoParts = self.themeBoilerplate.match(/github\.com\/(.*?)\/([^/]+)/i);

    // Check for a branch name
    var branch = self.themeBoilerplate.match(/\/tree\/([^/]+)/i);
    branch = branch ? branch[1] : 'master';

    // Final GitHub link
    self.themeBoilerplate = 'https://github.com/' + repoParts[1] + '/' + repoParts[2] + '/archive/' + branch + '.tar.gz';

    // Create the config file it does not exist
    if (!self.configExists) {
      var values = {
        authorName : self.authorName,
        authorURI  : self.authorURI,
        themeUrl   : self.themeOriginalURL
      };

      config.createConfig(values, cb)
    } else {
      cb()
    }
  })
};

/**
 * Download the framework and unzip it in the project app/
 */
WordPressGenerator.prototype.startInstallProcess = function () {
  this.log.writeln('\nStarting installation process, this may take a while. Feel free to grab a coffee!\n'.bold);
};

/**
 * Download the framework and unzip it in the project app/
 */
WordPressGenerator.prototype.downloadWordPressTarball = function () {
  this.log.writeln('=> Downloading and extracting WordPress'.bold);
  this.tarball('https://github.com/WordPress/WordPress/archive/' + this.wordpressVersion + '.tar.gz', 'app', this.async());
};

/**
 * Remove all of the default themes that come with WordPress.
 */
WordPressGenerator.prototype.removeWordPressDefaultThemes = function () {
  var self = this;
  var cb   = this.async();

  this.log.writeln('=> Removing default WordPress themes'.bold);

  fs.readdir('app/wp-content/themes', function (err, files) {
    if (files !== undefined && files.length != 0) {
      files.forEach(function (theme) {
        // Only delete directories, mostly so we ignore index.php
        if (fs.statSync('app/wp-content/themes/' + theme).isDirectory()) {
          rimraf.sync('app/wp-content/themes/' + theme);
          self.log.writeln('    - Removing the theme: ' + theme);
        }
      });
    }

    cb();
  });
};

/**
 * Remove the default hello dolly WordPress plugin.
 */
WordPressGenerator.prototype.removeWordPressDefaultPlugins = function () {
  this.log.writeln('=> Removing hello dolly plugin '.bold);

  fs.unlinkSync('app/wp-content/plugins/hello.php');
};

/**
 * Install the chosen starter theme.
 */
WordPressGenerator.prototype.installStarterTheme = function () {
  this.log.writeln('=> Downloading & extracting your starter theme'.bold);

  // Download and extract the starter theme
  this.tarball(this.themeBoilerplate, 'app/wp-content/themes/' + this.themeName, this.async());
};

/**
 * Grab Twooter Bootstrap.
 */
WordPressGenerator.prototype.installTwitterBootstrap = function () {
  this.log.writeln('=> Downloading & extracting Twitter Bootstrap'.bold);

  // Download and extract Twitter Bootstrap
  this.tarball('https://github.com/twbs/bootstrap/archive/' + this.bootstrapVersion + '.tar.gz', 'src/bootstrap', this.async());
};

/**
 * Grab Font Awesome, the Twitter Bootstrap icon font.
 */
WordPressGenerator.prototype.installFontAwesome = function () {
  this.log.writeln('=> Downloading & extracting Font Awesome'.bold);

  // Download and extract FontAwesome
  this.tarball('https://github.com/FortAwesome/Font-Awesome/archive/' + this.fontAwesomeVersion + '.tar.gz', 'src/font-awesome', this.async());
};

/**
 * Grab LESS Elements, a set of useful mixins for LESS.
 */
WordPressGenerator.prototype.installLessElements = function () {
  this.log.writeln('=> Downloading & extracting LESS Elements'.bold);

  // Download and extract LESS Elements
  this.tarball('https://github.com/dmitryf/elements/archive/master.tar.gz', 'src/elements', this.async());
};

/**
 * Grab Twitter Bootstrap
 */
WordPressGenerator.prototype.configureTwitterBootstrap = function () {
  this.log.writeln('=> Configuring Twitter Bootstrap'.bold)

  // Source root
  var sourceRoot = this.sourceRoot();
  this.sourceRoot(this.destinationRoot());

  // Make some directories
  this.mkdir('src/less/includes')
  this.mkdir('app/wp-content/themes/' + this.themeName + '/js/bootstrap')
  this.mkdir('app/wp-content/themes/' + this.themeName + '/font')

  // LESS
  this.directory('src/bootstrap/less', 'src/less/includes')
  this.directory('src/font-awesome/less', 'src/less/includes')
  this.copy('src/elements/elements.less', 'src/less/includes/elements.less')

  // JavaScript
  this.directory('src/bootstrap/js', 'app/wp-content/themes/' + this.themeName + '/js/bootstrap')

  // Fonts
  this.directory('src/font-awesome/font', 'app/wp-content/themes/' + this.themeName + '/font')

  // Reset source root
  this.sourceRoot(sourceRoot)
};

/**
 * Remove the folders and files that are unneccesary.
 */
WordPressGenerator.prototype.cleanInstall = function () {
  var self = this

  self.log.writeln('');
  self.log.writeln('=> Removing unneccesary files'.bold);

  var dirs = [
    'src/bootstrap',
    'src/font-awesome',
    'src/elements',
  ];

  dirs.forEach(function (dir) {
    var pathFile  = fs.realpathSync(dir),
      isDirectory = fs.statSync(pathFile).isDirectory();

    if (isDirectory) {
      rimraf.sync(pathFile);
      self.log.remove(dir);
    }
  });
};

/**
 * Setup Twitter Bootstrap to use Font Awesome.
 */
WordPressGenerator.prototype.integrateFontAwesome = function () {
  var cb       = this.async();
  var self     = this;

  self.log.writeln('\n=> Integrating Font Awesome with Twitter Bootstrap'.bold);

  fs.readFile('src/less/includes/bootstrap.less', 'utf8', function (err, data) {
    if (err) {
      throw err;
    }

    // Use Font Awesome instead of the default icon sprites
    var result = data.replace('sprites.less', 'font-awesome.less');

    // Write the update files
    fs.writeFile('src/less/includes/bootstrap.less', result, 'utf8', function (werr) {
      if (werr) {
        self.log.error(werr);
      } else {
        self.log.update('src/less/includes/bootstrap.less');
        cb();
      }
    });
  });
};

/**
 * Create our style.less file in the source directory.
 */
WordPressGenerator.prototype.createThemeStyle = function () {
  this.log.writeln('\n=> Building base theme less file'.bold);
  this.log.create('style.less');

  // Copy the default style.less to our project
  this.template('style.less', 'src/less/style.less')
};

/**
 * Create the database for WordPress.
 */
WordPressGenerator.prototype.createDatabase = function () {
  var cb   = this.async();
  var self = this;

  self.log.writeln('\n=> Creating WordPress database'.bold)

  var connection  = mysql.createConnection({
    host     : 'localhost',
    user     : self.dbuser,
    password : self.dbpass,
  });

  connection.connect(function (err) {
    if (err) {
      self.log.error('Error connecting to MySQL, please create the database manually');
    } else {
      connection.query('CREATE DATABASE ' + self.dbtable, function (err, result) {
        self.log.create(self.dbtable);

        connection.end(function () {
          cb()
        });
      });
    }
  });
}

/**
 * Generate the files to use Yeoman and the git related files.
 */
WordPressGenerator.prototype.createYeomanFiles = function () {
  this.log.writeln('\n=> Building Yeoman Templates'.bold)
  this.log.info('     - Generating unique phrases')

  // Generate unique salts & keys
  this.authKey        = uuid.v4()
  this.secureAuthKey  = uuid.v4()
  this.loggedInKey    = uuid.v4()
  this.secureAuthKey  = uuid.v4()
  this.nonceKey       = uuid.v4()
  this.authSalt       = uuid.v4()
  this.secureAuthSalt = uuid.v4()
  this.loggedInSalt   = uuid.v4()
  this.nonceSalt      = uuid.v4()

  // Copy over templates
  this.template('Gruntfile.js')
  this.template('bowerrc', '.bowerrc')
  this.template('wp-config.php', 'app/wp-config.php')
  this.template('package.json', 'package.json')
  this.copy('gitignore', '.gitignore')
  this.copy('gitattributes', '.gitattributes')
};

/**
 * Use NPM to install project dependencies from our package.json file.
 */
WordPressGenerator.prototype.installNpmDependencies = function () {
  var cb  = this.async();
  var npm = spawn('npm', ['install'], { stdio: 'inherit' });

  this.log.writeln('\n=> Installing NPM dependencies'.bold)

  // Don't continue until NPM is done
  npm.on('close', function (data) {
    cb();
  });
};

/**
 * Run our grunt build process.
 */
WordPressGenerator.prototype.runGruntBuild = function () {
  var cb    = this.async();
  var grunt = spawn('grunt', ['less'], { stdio: 'inherit' });

  this.log.writeln('\n=> Running Grunt Build'.bold)

  // Don't continue until the grunt build is done
  grunt.on('close', function (data) {
    cb();
  });
}

/**
 * See if the wp-cli library is present on the user's system.
 */
WordPressGenerator.prototype.detectWordPressCli = function () {
  var cb    = this.async();
  var self = this;

  this.log.writeln('\n=> Checking for wp-cli'.bold)

  exec('wp help', function (err, stdout, stderr) {
    if (err) {
      self.log.error('Could not find wp-cli, skipping automated installation');
      self.hasCLI = false;
    } else {
      self.hasCLI = true;
      self.log.ok('Found wp-cli, proceeding with automated installation')
    }

    cb();
  });
};

/**
 * If the wp-cli library is present, automatically install and configure
 * WordPress.
 */
WordPressGenerator.prototype.installWordPress = function () {
  var cb   = this.async();
  var self = this;

  if (self.hasCLI) {
    this.log.writeln('\n=> Installing WordPress'.bold)

    // Spawn a wp-cli process to install WordPress
    var cli = spawn('wp', [
        'core',
        'install',
        '--url=' + self.siteUrl,
        '--title="' + escape(self.siteTitle) + '"',
        '--admin_name=' + self.adminUser,
        '--admin_email=' + self.adminEmail,
        '--admin_password=' + self.adminPass
      ], {
        stdio: 'inherit',
        cwd: 'app'
      }
    );

    // Don't continue until WordPress is done installing
    cli.on('close', function(data) {
      cb();
    });

  } else {
    cb();
  }
};

/**
 * We are done generating stuff.
 */
WordPressGenerator.prototype.endGenerator = function () {
  this.log.writeln('\n... and we\'re done!'.bold);

  if (!this.hasCLI) {
    this.log.writeln('\nNow you just need to install Wordpress the usual way,');
    this.log.writeln('if you installed wp-cli (wp-cli.org), this task could be automated for you');
  }

  this.log.writeln('');
  this.log.writeln('Don\'t forget to activate the new theme in the admin panel, and then you can start coding!');
};
