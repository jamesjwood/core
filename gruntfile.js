module.exports = function(grunt) {
  "use strict";
  // Project configuration.
  grunt.initConfig({
    watch: {
      options: {
        interrupt: true,
      files: ['src/*.js', 'test/*.js'],
      tasks: ['test']
      }
    },
    jshint: {
      options: {
        browser: true,
        node: true
      },
      all: ['src/*.js', 'test/*.js']
    },
    simplemocha: {
      options: {
        ui: 'bdd',
        reporter: 'tap'
      },
      all: { src: ['test.js'] }
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
      }
    }
  });

grunt.loadNpmTasks('grunt-contrib');
grunt.loadNpmTasks('grunt-shell');
grunt.loadNpmTasks('grunt-simple-mocha');

grunt.registerTask('test', ['jshint', 'simplemocha']);

};