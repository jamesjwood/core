module.exports = function(grunt) {
  "use strict";
  // Project configuration.
  grunt.initConfig({
    watch: {
      options: {
        interrupt: true,
      files: ['index.js', 'test.js'],
      tasks: ['test']
      }
    },
    jshint: {
      options: {
        browser: true,
        node: true
      },
      all: ['index.js', 'test.js']
    },
    simplemocha: {
      options: {
        ui: 'bdd',
        reporter: 'tap'
      },
      all: { src: ['test.js'] }
    },
    karma: {
      local: {
        configFile: 'karma.conf.js',
        singleRun: true,
        browsers: ['Safari']
      }
    },
    shell: {
      makeStage: {
        command: 'rm -rf stage; mkdir stage',
        stdout: true,
        stderr: true,
        failOnError: true
      }
      ,
      makeLib: {
        command: 'rm -rf lib; mkdir lib',
        stdout: true,
        stderr: true,
        failOnError: true
      },
      browserify:{
        command: 'node ./node_modules/browserify/bin/cmd.js  --debug -o ./stage/test.js -i domain -e ./test.js;',
        stdout: true,
        stderr: true,
        failOnError: true
      }
    }
  });

grunt.loadNpmTasks('grunt-contrib-watch');
grunt.loadNpmTasks('grunt-contrib-jshint');
grunt.loadNpmTasks('grunt-shell');
grunt.loadNpmTasks('grunt-simple-mocha');

grunt.loadNpmTasks('grunt-karma');

grunt.registerTask('default', ['jshint']);
grunt.registerTask('test', ['default', 'simplemocha', 'shell:makeStage','shell:browserify', 'karma']);

};