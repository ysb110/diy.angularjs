function Scope(){
	this.$$watchers= [];
}
function initWatchVal(){}
Scope.prototype.$watch = function(watchFn, listenerFn){
	var watcher= {
		watchFn: watchFn,
		listenerFn: listenerFn || function(){},
		last:initWatchVal
	};
	this.$$watchers.push(watcher);
};
Scope.prototype.$digest = function() {
	var dirty,ttl=10;
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
	 	debugger;
	 	if(newValue != oldValue) {
	 		watcher.listenerFn(newValue, oldValue == initWatchVal?newValue:oldValue, self);
	 		watcher.last = newValue;
	 		dirty = true;
	 	}
	 });
	 return dirty;
};