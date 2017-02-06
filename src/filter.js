function $FilterProvider($provide) {
	var filters = {};

	this.register = function(name, factory) {
		if (_.isObject(name)) {
			return _.map(name, function(factory, name) {
				return this.register(name, factory);
			});
		} else {
			return $provide.factory(name + 'Filter', factory);
		}
	};

	this.get = function () {
		return function(name) {
			return filters[name];
		};
	};
}
$FilterProvider.$inject = ['$provide'];