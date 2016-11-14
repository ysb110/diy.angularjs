/* jshint globalstrict: true */
/* global Scope:false */
'use strict';
describe('Scope', function() {
	describe('digest', function() {
		var scope;
		beforeEach(function() {
			scope = new Scope();
		});
		it('calls the listener function of a watch on fist digest', function() {
			var watchFn = function() {
				return 'wat';
			};
			var listenerFn = jasmine.createSpy();
			scope.$watch(watchFn, listenerFn);
			scope.$digest();
			expect(listenerFn).toHaveBeenCalled();
		});
		it('calls the watch function with the scope as the argument', function() {
			var watchFn = jasmine.createSpy();
			var listenerFn = function() {
				return 'wat';
			};
			scope.$watch(watchFn, listenerFn);
			scope.$digest();
			expect(watchFn).toHaveBeenCalledWith(scope);
		});
		it("calls the listener function when the watched value changes", function() {
			scope.someValue = 'a';
			scope.counter = 0;
			scope.$watch(
				function(scope) {
					return scope.someValue;
				},
				function(newValue, oldValue, scope) {
					scope.counter++;
				}
			);
			expect(scope.counter).toBe(0);

			scope.$digest();
			expect(scope.counter).toBe(1);

			scope.$digest();
			expect(scope.counter).toBe(1);
		});
		it("calls listener when watch value is first undefined", function() {
			scope.counter = 0;
			scope.$watch(
				function(scope) {
					return scope.someValue;
				},
				function(newValue, oldValue, scope) {
					scope.counter++;
				}
			);
			scope.$digest();
			expect(scope.counter).toBe(1);
		});
		it("calls listener with new value as old value the first time", function() {
			scope.someValue = 123;
			var oldValueGiven;
			scope.$watch(
				function(scope) {
					return scope.someValue;
				},
				function(newValue, oldValue, scope) {
					oldValueGiven = oldValue;
				}
			);
			scope.$digest();
			expect(oldValueGiven).toBe(123);
		});
		it('my have watchers that omit the listener function', function() {
			var watchFn = jasmine.createSpy().and.returnValue('something');
			scope.$watch(watchFn);

			scope.$digest();
			expect(watchFn).toHaveBeenCalled();
		});
		it("triggers chained watchers in the same digest", function() {
			scope.name = 'Jane';
			scope.$watch(function(scope) {
				return scope.nameUpper;
			}, function(newValue, oldValue, scope) {
				if (newValue) {
					scope.initial = newValue.substring(0, 1) + '.';
				}
			});
			scope.$watch(function(scope) {
				return scope.name;
			}, function(newValue, oldValue, scope) {
				if (newValue) {
					scope.nameUpper = newValue.toUpperCase();
				}
			});

			scope.$digest();
			expect(scope.initial).toBe("J.");

			scope.name = "Bob";
			scope.$digest();
			expect(scope.initial).toBe("B.");
		});
		it('gives up on the watches after 10 iterations', function() {
			scope.counterA = 0;
			scope.counterB = 0;
			scope.$watch(function(scope) {
				return scope.counterA;
			}, function(newValue, oldValue, scope) {
				scope.counterB++;
			});
			scope.$watch(function(scope) {
				return scope.counterB;
			}, function(newValue, oldValue, scope) {
				scope.counterA++;
			});

			expect(function() {
				scope.$digest();
			}).toThrow();
		});
		it('ends the digest when the last watch is clean', function() {
			scope.array = _.range(100);
			var watchExecutions = 0;
			_.times(100, function(i) {
				scope.$watch(function(scope) {
					watchExecutions++;
					return scope.array[i];
				}, function(newValue, oldValue, scope) {

				});
			});

			scope.$digest();
			expect(watchExecutions).toBe(200);

			scope.array[0] = 401;
			scope.$digest();
			expect(watchExecutions).toBe(301);
		});
		it('does not end digest so new watchers are not run', function() {
			scope.aValue = 'abc';
			scope.counter = 0;

			scope.$watch(function(scope) {
				return scope.aValue;
			}, function(newValue, oldValue, scope) {
				scope.$watch(function(scope) {
					return scope.aValue;
				}, function(newValue, oldValue, scope) {
					scope.counter++;
				});
			});
			scope.$digest();
			expect(scope.counter).toBe(1);
		});
		it("compare based on value is enabled", function() {
			scope.aValue = [1, 2, 3];
			scope.counter = 0;
			scope.$watch(function(scope) {
				return scope.aValue;
			}, function(newValue, oldValue, scope) {
				scope.counter++;
			}, true);

			scope.$digest();
			expect(scope.counter).toBe(1);

			scope.aValue.push(4);
			scope.$digest();
			expect(scope.counter).toBe(2);
		});
		it('在同一cycle中延时执行$evalAsync中的方法', function() {
			scope.aValue = [1, 2, 3];
			scope.asyncEvaluated = false;
			scope.asyncEvaluatedImmediately = false;

			scope.$watch(function(scope) {
				return scope.aValue;
			}, function(newValue, oldValue, scope) {
				scope.$evalAsync(function(scope) {
					scope.asyncEvaluated = true;
				});
				scope.asyncEvaluatedImmediately = scope.asyncEvaluated;
			});

			scope.$digest();
			expect(scope.asyncEvaluated).toBe(true);
			expect(scope.asyncEvaluatedImmediately).toBe(false);
		});
		it('没有脏数据也能延时执行wathFn中$evalAsync调用的方法', function() {
			scope.aValue = [1, 2, 3];
			scope.asyncEvaluatedTimes = 0;

			scope.$watch(function(scope) {
				if (scope.asyncEvaluatedTimes < 2) {
					scope.$evalAsync(function(scope) {
						scope.asyncEvaluatedTimes++;
					});
				}
				return scope.aValue;
			}, function(newValue, oldValue, scope) {});

			scope.$digest();
			expect(scope.asyncEvaluatedTimes).toBe(2);
		});
		it('在$evalAsync中安排一次digest,$evalAysnc只是为了防止误调用才加入这个（应该调用$applyAsync）', function(done) {
			scope.aValue = 'abc';
			scope.counter = 0;

			scope.$watch(function(scope) {
				return scope.aValue;
			}, function(newValue, oldValue, scope) {
				scope.counter++;
			});
			scope.$evalAsync(function() {});

			expect(scope.counter).toBe(0);
			setTimeout(function() {
				expect(scope.counter).toBe(1);
				done();
			}, 50);
		});
		it('同一cycle中永远不执行$applyAsync中的方法', function(done) {
			scope.aValue = [1, 2, 3];
			scope.asyncApplied = false;

			scope.$watch(function(scope) {
				return scope.aValue;
			}, function(newValue, oldValue, scope) {
				scope.$applyAsync(function(scope) {
					scope.asyncApplied = true;
				});
			});

			scope.$digest();
			expect(scope.asyncApplied).toBe(false);

			setTimeout(function() {
				expect(scope.asyncApplied).toBe(true);
				done();
			}, 50);
		});
		it('允许在digest时删除watcher', function() {
			scope.aValue = 'abc';
			var watchCalls = [];

			scope.$watch(function(scope) {
				watchCalls.push('first');
				return scope.aValue;
			});

			var destoryWatch = scope.$watch(function(scope) {
				watchCalls.push("second");
				destoryWatch();
			});
			scope.$watch(function(scope) {
				watchCalls.push("third");
				return scope.aValue;
			});

			scope.$digest();
			expect(watchCalls).toEqual(['first', 'second', 'third', 'first', 'third']);
		});
		it('在digest中允许一个$watch去删除另一个', function() {
			scope.aValue = 'abc';
			scope.counter = 0;

			scope.$watch(function(scope) {
				return scope.aValue;
			}, function(newValue, oldValue, scope) {
				destoryWatch();
			});
			var destoryWatch = scope.$watch(function(scope) {},
				function(newValue, oldValue, scope) {});

			scope.$watch(function(scope) {
				return scope.aValue;
			}, function(newValue, oldValue, scope) {
				scope.counter++;
			});

			scope.$digest();
			expect(scope.counter).toBe(1);
		});
	});
	describe('$watchGroup', function() {
		var scope;
		beforeEach(function() {
			scope = new Scope();
		});
		it('watch一个数组，listener被传入之前的返回值的数组', function() {
			scope.aValue = 1;
			scope.anotherValue = 2;
			var gotNewValues, gotOldValues;

			scope.$watchGroup([function(scope) {
				return scope.aValue;
			}, function(scope) {
				return scope.anotherValue;
			}], function(newValue, oldValue, scope) {
				gotNewValues = newValue;
				gotOldValues = oldValue;
			});

			scope.$digest();
			expect(gotNewValues).toEqual([1, 2]);
			expect(gotOldValues).toEqual([1, 2]);
		});
		it('一次digest执行一次listener', function() {
			var counter = 0;
			scope.aValue = 1;
			scope.anotherValue = 2;
			scope.$watchGroup([
				function(scope) {
					return scope.aValue;
				},
				function(scope) {
					return scope.anotherValue;
				}
			], function(newValues, oldValues, scope) {
				counter++;
			});
			scope.$digest();
			expect(counter).toEqual(1);
		});
		it("第一次执行时候oldValue === newValue", function () {
			 var gotOldValues, gotNewValues;

			 scope.aValue = 1;
			 scope.anotherValue = 2;

			 scope.$watchGroup([function (scope) {
			 	 return scope.aValue; 
			 }, function (scope) {
			 	 return scope.anotherValue; 
			 }], function (newValue, oldValue, scope) {
			 	 gotNewValues = newValue;
			 	 gotOldValues = oldValue; 
			 });

			 scope.$digest();
			 expect(gotOldValues).toBe(gotNewValues);
		});
		it("watchArray是empty的时候也要执行Listener一次", function () {
			var counter = 0;
			scope.$watchGroup([], function (newValue, oldValue, scope) {
				 counter++; 
			});
			
			scope.$digest();
			expect(counter).toEqual(1);
		});
		it("已经删除的watch一次也不执行listener", function () {
			var counter = 0;
			var destroyGroup = scope.$watchGroup([], function (newValue, oldValue, scope) {
				 counter++; 
			});
			destroyGroup();

			scope.$digest();
			expect(counter).toEqual(0);
		});
	});
	describe("inheritance", function () {
		 it('继承parent的属性', function () {
		 	 var parent = new Scope();
		 	 parent.aValue = [1, 2, 3];
		 	 var child = parent.$new();
		 	 expect(child).toEqual([1, 2, 3]);
		 });
		 it("digest 所有孩子", function () {
		 	 var parent = new Scope();
		 	 var child = parent.$new();
		 	 parent.aValue = 'abc';

		 	 child.$watch(function (scope) {
		 	 	 return scope.aValue; 
		 	 }, function (newValue, oldValue, scope) {
		 	 	 scope.aValueWas = oldValue; 
		 	 }); 

		 	 parent.$digest();
		 	 expect(child.aValueWas).toBe('abc');
		 });
});