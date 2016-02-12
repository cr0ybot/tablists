module.exports = function(grunt) {
    'use strict';

    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        sass: {
            dev: {
                options:{
                    outputStyle:'expanded',
                    sourceMap: true
                },
                files: [{
                    expand: true,
                    cwd: 'scss',
                    src: ['**/*.scss'],
                    dest: 'css',
                    ext: '.css'
                }]
            },
            dist: {
                options: {
                    outputStyle:'compressed',
                    sourceMap: false
                },
                files: [{
                    expand: true,
                    cwd: 'scss',
                    src: ['**/*.scss'],
                    dest: 'css',
                    ext: '.min.css'
                }]
            }
        },

        postcss: {
            options: {
                remove: false,
                processors: [
                    require('autoprefixer')({
                        browsers: ['> 1%', 'last 2 versions']
                    })
                ]
            },
            dev: {
                options: {
                    map: true
                },
                src: 'css/*.css'
            },
            dist: {
                options: {
                    map: false
                },
                src: 'css/*.css'
            }
        },

        uglify: {
            options: {
                files: [{
                    expand: true,
                    cwd: 'js',
                    src: ['**/*.js', '!**/*.min.js'],
                    dest: 'js',
                    ext: '.min.js'
                }]
            },
            dev: {
                sourceMap: true
            },
            dist: {
                sourceMap: false
            }
        },

        watch: {
            options: {
                livereload: false
            },
            html: {
                files: '**/*.html'
            },
            css: {
                files: 'scss/**/*.scss',
                tasks: ['sass:dev', 'postcss:dev']
            },
            js: {
                files: '**/*.js',
                tasks: ['uglify:dev']
            }
        }
    });

    grunt.registerTask('default',['sass:dev','postcss:dev','watch']);
    grunt.registerTask('build',['sass:dist','postcss:dist','uglify:dist']);
};
