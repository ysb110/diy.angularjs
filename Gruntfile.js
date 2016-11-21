module.exports = function(grunt) {

	grunt.initConfig({
		jshint: {
			all: ['src/**/*.js', 'test/**/*.js'],
			options: {
				/*we will referencing two global varibales defined outside of our own code,
				  that should not raise errors when we do so
				  定义全局变量
				  */
				globals: {
					_: false,
					$: false,
					jasmine: false,
					describe: false,
					it: false,
					expect: false,
					beforeEach: false,
					afterEach: false,
					sinon: false
				},
				/*not raise errors when we refer to global variables commonly available in browsers
				预定义全局变量 document ， navigator ， FileReader 等*/
				browser: true,
				/*定义用于调试的全局变量： console ， alert*/
				devel: true
			}
		},
		testem: {
			unit: {
				options: {
					framework: 'jasmine2',
					launch_in_dev: ['phantomjs-prebuilt'],
					before_tests: 'grunt jshint',
					serve_files: [
						'node_modules/lodash/lodash.min.js',
						'node_modules/jquery/dist/jquery.js',
						'node_modules/sinon/pkg/sinon.js',
						'src/**/*.js',
						'test/scope_public_sepc.js'
					],
					watch_files: [
						'src/**/*.js',
						'test/**/*.js'
					]
				}
			}
		}
	});

	grunt.loadNpmTasks("grunt-contrib-jshint");
	grunt.loadNpmTasks("grunt-contrib-testem");
	grunt.registerTask('default', ['testem:run:unit']);
}