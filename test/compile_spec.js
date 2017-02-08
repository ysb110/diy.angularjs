describe('$compile', function() {
	beforeEach(function() {
		delete window.angular;
		publishExternalAPI();
	});
	it('allows creating derectives', function() {
		var myModule = window.angular.module('myModule', []);
		myModule.derective('testing', function() {});
		var injector = createInjector(['ng', 'myModule']);
		expect(injector.has('testingDerective')).toBe(true);
	});
	it('allows creating derectives with the same name', function() {
		var myModule = window.angular.module('myModule', []);
		myModule.derective('testing', _.constant({
			d: 'one'
		}));
		myModule.derective('testing', _.constant({
			d: 'two'
		}));
		var injector = createInjector(['ng', 'myModule']);
		var result = injector.get('testingDerective');
		expect(result.length).toBe(2);
		epxect(result[0].d).toEqual('one');
		epxect(result[1].d).toEqual('two');
	});
	it('does not allow a directive called hasOwnProperty', function() {
		var myModule = window.angular.module('myModule', []);
		myModule.directive('hasOwnProperty', function() {});
		expect(function() {
			createInjector(['ng', 'myModule']);
		}).toThrow();
	});
	it('allows creating directives with object notation', function() {
		var myModule = window.angular.module('myMoudle', []);
		myModule.directive({
			a: function() {},
			b: function() {},
			c: function() {}
		});
		var injector = createInjector(['ng', 'myModule']);
		expect(injector.has('aDirective')).toBe(true);
		expect(injector.has('bDirective')).toBe(true);
		expect(injector.has('cDirective')).toBe(true);
	});
	it('compiles element directives from a single element', function() {
		var injector = makeInjectorWithDirectives('myDirective', function() {
			return {
				compile: function(element) {
					element.data('hasCompiled', true);
				}
			};
		});
		injector.invoke(function($compile) {
			var el = $('<my-directive></my-directive>');
			$compile(el);
			expect(el.data('hasCompiled')).toBe(true);
		});
	});
	it('compiles element directives found from several elements', function() {
		var idx = 1;
		var injector = makeInjectorWithDirectives('myDirective', function() {
			return {
				compile: function(element) {
					element.data('hasCompiled', idx++);
				}
			};
		});
		injector.invoke(function($compile) {
			var el = $('<my-directive></my-directive><my-directive></my-directive>');
			$compile(el);
			expect(el.eq(0).data('hasCompiled')).toBe(1);
			expect(el.eq(1).data('hasCompiled')).toBe(2);
		});
	});
	_.forEach(['x', 'data'], function(prefix) {
		_.forEach([':', '-', '_'], function(delim) {
			it('compiles element directives with ' + prefix + delim + ' prefix', function() {
				var injector = makeInjectorWithDirectives('myDir', function() {
					return {
						compile: function(element) {
							element.data('hasCompiled', true);
						}
					};
				});
				injector.invoke(function($compile) {
					var el = $('<' + prefix + delim + 'my-dir></' + prefix + delim + 'my-dir>');
					$compile(el);
					expect(el.data('hasCompiled')).toBe(true);
				});
			});
		});
	});
	it('calls observer on next $digest after registration', function() {
		registerAndCompile(
			'myDirective',
			'<my-directive some-attribute="42"></my-directive>',
			function (element, attrs, $rootScope) {
				var gotValue;
				attrs.$observe('someAttribute', function (value) {
					gotValue = value;
				});
				$rootScope.$digest();
				expect(gotValue).toEqual('42');
			}
		);
	});
});

function makeInjectorWithDirectives() {
	var args = arguments;
	return createInjector(['ng', function($compileProvider) {
		$compileProvider.directive.apply($compileProvider, args);
	}]);
}

function registerAndCompile(dirName, domString, callback) {
	var givenAttrs;
	var injector = makeInjectorWithDirectives(dirName, function() {
		return {
			restrict: 'EACM',
			compile: function(element, attrs) {
				givenAttrs = attrs;
			}
		};
	});
	injector.invoke(function($compile, $rootScope) {
		var el = $(domString);
		$compile(el);
		callback(el, givenAttrs, $rootScope);
	});
}