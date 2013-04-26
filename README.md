# REDspace Yeoman WordPress Generator

  Generator to use Yeoman on a WordPress project.

  For more informations about Yeoman, see [Yeoman.io](http://yeoman.io/)

  Forked from [https://github.com/romainberger/yeoman-wordpress](https://github.com/romainberger/yeoman-wordpress)

## Installation

  Install Yeoman before doing anything else.

  `$ npm install -g yo grunt-cli bower`

  Create a directory for your project, navigate to that directory in terminal and type:

  `$ npm install generator-yo-trs-wordpress`

## Documentation

### Init

  `$ yo yo-trs-wordpress` - Generates a new WordPress project with a starter theme and the files needed to use Yeoman. Once Yeoman is done, install your new WordPress project, and activate the theme in the admin panel.

  The customized generator is setup to do the following:
  
  + Download the most recent version of WordPress
  + Download the most recent version of the customized Underscores Theme for REDspace projects
  + Download the most recent version of the Twitter Bootstrap
  + Download the most recent version of Font Awesome
  + Download the most recent version of LESS Elements
  + Uncompress WordPress to the “app” directory
  + Uncompress the other projects to the “src” directory
  + Clean up the “src” directory so that only the files I want are set up nicely for me
  + Create a basic style.less for my WordPress project
  + Create the wp-config.php file
  + Create a Gruntfile that is setup to watch the LESS file and compiles it to the proper directory in the WordPress theme
  + Set up the database table that WordPress will be installed to

Yeoman will prompt you which version of WordPress you want to use (latest stable version by default), the starter theme and a few informations to make the theme ready be to used. You'll also be prompted for a database name, the database user name, and database password. **Please ensure your database server is running when the generator runs so your database will be created for you**. Most of the defaults informations can be changed in the [config file](#configuration).

### Plugin

  `$ yo yo-trs-wordpress:plugin` - Generates a plugin with [WordPress Plugin Boilerplate](https://github.com/tommcfarlin/WordPress-Plugin-Boilerplate/tree/master/plugin-boilerplate).

## Configuration

  Yeoman-WordPress stores some defaults values so you won't have to type the same things every time you start a project. The first time you will use the generator it will create a config file with the informations you gave. These informations will be used as default values so you can override them during the init tasks. If you want to change the default values you can do it by editing the config file located in `~/.yeoman-wordpress/config.json`.

## Plans

  I plan on getting a few more smaller items done in the near future, including better error catching (mainly around the MySQL database) and hopefully integrating with wp-cli to run the WordPress install.
