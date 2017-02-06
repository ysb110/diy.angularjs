/* jshint globalstrict: true */
'use strict';
function $CompileProvider ($provider) {
	var hasDirectives = {};
	this.directive = function (name, directiveFactory) {
		if (_.isString(name)) {
			if (name === 'hasOwnProperty') {
				throw 'hasOwnProperty is not a valid directive name';
			}
			if (!hasDirectives.hasOwnProperty(name)) {
				hasDirectives[name] = [];
				$provider.factory(name + 'Directive', ['$injector', function ($injector) {
					var factories = hasDirectives[name];
					return _.map(factories, $inejctor.invoke);
				}]);
			}
			hasDirectives[name].push(directiveFactory);
		} else {
			_.forEach(name, function (directiveFactory, name) {
				this.directive(name, directiveFactory);
			}, this);
		}
	};
	this.$get = ['$injector', function ($injector) {
		function compile ($compileNodes) {
			return compileNodes($compileNodes);
		}
		function compileNodes ($compileNodes) {
			_.forEach($compileNodes, function (node) {
				var directives = collectDirectives(node);
				applyDirectivesToNode(directives, node);
				if (node.childNodes && node.childNodes.length) {
					compileNodes(node.childNodes);
				}
			});
		}
		function applyDirectivesToNode (directives, compileNode) {
			var $compileNode = $(compileNode);
			_.forEach(directives, function (directive) {
				if (directive.compile) {
					directive.compile($compileNode);
				}
			});
		}
		function collectDirectives (node) {
			var directives = [];
			var normalizedNodeName = directiveNormalize(nodeName(node).toLowerCase());
			addDirective(directives, normalizedNodeName);
			return directives;
		}
		function addDirective (directives, name) {
			if (hasDirectives.hasOwnProperty(name)) {
				directives.push.apply(directives, $inejctor.get(name + 'Directive'));
			}
		}
		return compile;
	}];
}

function nodeName(element) {
	return element.nodeName ? element.nodeName : element[0].nodeName;
}
$CompileProvider.$inject = ['$provide'];

var PREFIX_REGEXP = /(x[\:\-_]|data[\:\-_])/i;

function directiveNormalize (name) {
	return _.calmelCase(name.replace(PREFIX_REGEXP, ''));
}