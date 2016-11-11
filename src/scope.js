function Scope(){
	this.$$watchers= [];
	this.$$lastDirtyWatch = null;
}
function initWatchVal(){}
Scope.prototype.$watch = function(watchFn, listenerFn, valueEq){
	var watcher= {
		watchFn: watchFn,
		listenerFn: listenerFn || function(){},
		last: initWatchVal,
		valueEq: !!valueEq
	};
	this.$$watchers.push(watcher);
	this.$$lastDirtyWatch = null;
};
Scope.prototype.$digest = function() {
	var dirty,ttl=10;
	this.$$lastDirtyWatch = null;
	do{
		dirty = this.$digestOnce();
		if (dirty && !(ttl--)) {
			throw "10 digest iterations reached";
		}
	} while(dirty);
};
Scope.prototype.$digestOnce = function() {
	 var self= this;
	 var oldValue, newValue, dirty;
	 _.forEach(this.$$watchers, function(watcher){
	 	newValue = watcher.watchFn(self);
	 	oldValue = watcher.last;
	 	if(!self.$$areEqual(newValue, oldValue, watcher.valueEq)) {
	 		self.$$lastDirtyWatch = watcher;
	 		watcher.listenerFn(newValue, oldValue == initWatchVal?newValue:oldValue, self);
	 		watcher.last = watcher.valueEq?_.cloneDeep(newValue):newValue;
	 		dirty = true;
	 	} else if (self.$$lastDirtyWatch == watcher) {
	 		return false;
	 	}
	 });
	 return dirty;
};
Scope.prototype.$$areEqual = function(newValue, oldValue, valueEq){
	 if (valueEq){
	 	return _.isEqual(newValue, oldValue);
	 } else {
	 	return (newValue == oldValue || 
	 		(typeof(newValue) == 'number' && typeof(oldValue) == 'number' && isNaN(newValue) && isNaN(oldValue)));
	 }
};

Scope.prototype.$eval = function(expr, locals){
	 return expr(this, locals); 
};
Scope.prototype.$apply = function(expr){
	 try {
	  	return this.$eval(expr);
	  } finally {
	  	this.$digest();
	  } 
};