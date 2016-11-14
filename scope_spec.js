/* jshint globalStrict: false */
/* global Scope: false */
'use strict';
describe('Scope',function(){
	it('simple object',function(){
		var scope = new Scope();
		scope.aProperty = 1;

		expect(scope.aPeoperty).toBe(1);
	});

	describe('digest', function(){
		var scope;
		beforEach(function(){
			scope = new Scope();
		})

		it('call a listener function of a watch on first digest', function(){
			var watchFn = function(){return 'wat';};
			var listenerFn = jasmine.createSpy();
			scope.$watch(watchFn, listenerFn);
			scope.$digest();
			expect(listenerFn).toHaveBeenCalled();
		})
		
		it('call watch as scope as argument', function(){
			var watchFn = jasmine.createSpy();
			var listenerFn = function(){return 'wat';};
			scope.$watch(watchFn, listenerFn);
			scope.$digest();
			expect(watchFn).toHaveBeenCalledWith(scope);
		})
	})
});
