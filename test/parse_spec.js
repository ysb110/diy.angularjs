/* jshint globalstrict: true*/
/* global parse: false, register: false */
it('can parse filter expressions', function() {
	register('upcase', function(){
		return function(str) {
			return str.toUpperCase();
		};
	});
	var fn = parse('aString | upcase');
	expect(fn({aString: 'Hello'})).toEqual('HELLO');
});