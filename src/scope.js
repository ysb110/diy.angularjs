function Scope() {
	this.$$watchers = [];
	this.$$lastDirtyWatch = null;
	this.$$asyncQueue = [];
	this.$$applyAsyncQueue = [];
	this.$$applyAsyncId = null;
	this.$$postDigestQueue = [];
	this.$root = this;
	this.$$children = [];
	this.$$listeners = {};
	this.$$phase = null;
}

function initWatchVal() {}
Scope.prototype.$watch = function(watchFn, listenerFn, valueEq) {
	var self = this;
	var watcher = {
		watchFn: watchFn,
		listenerFn: listenerFn || function() {},
		last: initWatchVal,
		valueEq: !!valueEq
	};
	this.$$watchers.unshift(watcher);
	this.$root.$$lastDirtyWatch = null;
	return function() {
		var index = self.$$watchers.indexOf(watcher);
		if (index >= 0) {
			self.$$watchers.splice(index, 1);
			self.$root.$$lastDirtyWatch = null;
		}
	};
};
Scope.prototype.$digest = function() {
	var dirty, ttl = 10;
	this.$root.$$lastDirtyWatch = null;
	this.$beginPhase("$digest");

	if (this.$root.$$applyAsyncId) {
		clearTimeout(this.$root.$$applyAsyncId);
		this.$$flushApplyAsync();
	}

	do {
		while (this.$$asyncQueue.length) {
			var asyncTask = this.$$asyncQueue.shift();
			asyncTask.scope.$eval(asyncTask.expression);
		}
		dirty = this.$$digestOnce();
		if ((dirty || this.$$asyncQueue.length) && !(ttl--)) {
			throw "10 digest iterations reached";
		}
	} while (dirty || this.$$asyncQueue.length);

	this.$clearPhase();

	while (this.$$postDigestQueue.length) {
		try {
			this.$$postDigestQueue.shift()();
		} catch (e) {
			console.error(e);
		}
	}
};
Scope.prototype.$$everyScope = function(fn) {
	if (fn(this)) {
		this.$$children.every(function(child) {
			return child.$$everyScope(fn);
		});
	} else {
		return false;
	}
};
Scope.prototype.$$digestOnce = function() {
	var continueLoop = true;
	var dirty;
	this.$$everyScope(function(scope) {
		var oldValue, newValue;
		_.forEachRight(scope.$$watchers, function(watcher) {
			try {
				if (watcher) {
					newValue = watcher.watchFn(scope);
					oldValue = watcher.last;
					if (!scope.$$areEqual(newValue, oldValue, watcher.valueEq)) {
						scope.$root.$$lastDirtyWatch = watcher;
						watcher.listenerFn(newValue, oldValue == initWatchVal ? newValue : oldValue, scope);
						watcher.last = watcher.valueEq ? _.cloneDeep(newValue) : newValue;
						dirty = true;
					} else if (scope.$root.$$lastDirtyWatch == watcher) {
						continueLoop = false;
						return false;
					}
				}
			} catch (e) {
				console.log(e);
			}
		});
		return continueLoop;
	});
	return dirty;
};
Scope.prototype.$$areEqual = function(newValue, oldValue, valueEq) {
	if (valueEq) {
		return _.isEqual(newValue, oldValue);
	} else {
		return (newValue == oldValue ||
			(typeof(newValue) == 'number' && typeof(oldValue) == 'number' && isNaN(newValue) && isNaN(oldValue)));
	}
};

Scope.prototype.$eval = function(expr, locals) {
	return expr(this, locals);
};
Scope.prototype.$apply = function(expr) {
	try {
		this.$beginPhase("$apply");
		return this.$eval(expr);
	} finally {
		this.$clearPhase();
		this.$root.$digest();
	}
};
Scope.prototype.$evalAsync = function(expr) {
	var self = this;
	if (!self.$$asyncQueue.length && !self.$$phase) {
		setTimeout(function() {
			if (self.$$asyncQueue.length) {
				self.$root.$digest();
			}
		}, 0);
	}
	this.$$asyncQueue.push({
		scope: this,
		expression: expr
	});
};
Scope.prototype.$applyAsync = function(expr) {
	var self = this;
	this.$$applyAsyncQueue.push(function() {
		self.$eval(expr);
	});
	if (self.$root.$$applyAsyncId === null) {
		self.$root.$$applyAsyncId = setTimeout(function() {
			self.$apply(_.bind(self.$flushApplyAsync, self));
		}, 0);
	}
};
Scope.prototype.$flushApplyAsync = function() {
	while (this.$$applyAsyncQueue.length) {
		this.$$applyAsyncQueue.shift()();
	}
	this.$root.$$applyAsyncId = null;

};
Scope.prototype.$postDigest = function(fn) {
	this.$$postDigestQueue.push(fn);
};
Scope.prototype.$beginPhase = function(phase) {
	if (this.$$phase) {
		throw this.$$phase + " already in progress";
	}
	this.$$phase = phase;
};
Scope.prototype.$clearPhase = function() {
	this.$$phase = null;
};
Scope.prototype.$watchGroup = function(watchFns, listenerFn) {
	var self = this;
	var newValues = new Array(watchFns.length);
	var oldValues = new Array(watchFns.length);

	var changeReactionScheduled = false;
	var firstRun = true;

	if (watchFns.length === 0) {
		var shouldCall = true;
		self.$evalAsync(function() {
			if (shouldCall) {
				listenerFn(newValues, newValues, self);
			}
		});
		return function() {
			shouldCall = false;
		};
	}

	function watchGroupListener() {
		if (firstRun) {
			firstRun = false;
			listenerFn(newValues, newValues, self);
		} else {
			listenerFn(newValues, oldValues, self);
		}
		changeReactionScheduled = false;
	}
	var destoryFunctions = _.map(watchFns, function(watchFn, i) {
		return self.$watch(watchFn, function(newValue, oldValue) {
			newValues[i] = newValue;
			oldValues[i] = oldValue;
			if (!changeReactionScheduled) {
				changeReactionScheduled = true;
				self.$evalAsync(watchGroupListener);
			}
		});
	});
	return function() {
		_.forEach(destoryFunctions, function(destoryFunction) {
			destoryFunction();
		});
	};
};

/*inheritance*/
Scope.prototype.$new = function(isolated, parent) {
	var child;
	parent = parent || this;
	if (isolated) {
		child = new Scope();
		child.$root = parent.$root;
		child.$$asyncQueue = parent.$$asyncQueue;
		child.$$postDigestQueue = parent.$$postDigestQueue;
		child.$$applyAsyncQueue = parent.$$applyAsyncQueue;
	} else {
		var ChildScope = function() {};
		ChildScope.prototype = this;
		child = new ChildScope();
	}
	parent.$$children.push(child);
	child.$$watchers = [];
	child.$$children = [];
	child.$$listeners = {};
	child.$parent = parent;
	return child;
};
Scope.prototype.$destroy = function() {
	if (this.$parent) {
		var siblings = this.$parent.$$children;
		var indexOfThis = siblings.indexOf(this);
		if (indexOfThis >= 0) {
			siblings.splice(indexOfThis, 1);
		}
	}
	this.$$watchers = null;
};

Scope.prototype.$on = function(eventName, listener){
	var listeners = this.$$listeners[eventName];
	if (!listeners) {
		this.$$listeners[eventName] = listeners = [];
	}
	listeners.push(listener);
	return function () {
		 var index = listeners.indexOf(listener);
		 if (index >= 0) {
		 	listeners.splice(index, 1);
		 } 
	}
};
Scope.prototype.$emit = function(eventName){
	var additionalArgs = _.rest(arguments);
	return this.$$fireEventOnScope(eventName, additionalArgs);
};
Scope.prototype.$broadcast = function(eventName){
	var additionalArgs = _.rest(arguments);
	return this.$$fireEventOnScope(eventName, additionalArgs);
};
Scope.prototype.$$fireEventOnScope = function(eventName, additionalArgs){
	var event = {name: eventName};
	var listenerArgs = [event].concat(additionalArgs);
	var listeners = this.$$listeners[eventName] || [];
	 _.forEach(listeners, function (listener) {
	 	 listener.apply(null, listenerArgs); 
	 });
	 return event;
};