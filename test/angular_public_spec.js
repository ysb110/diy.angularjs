describe('angular public', function () {
	 it('set up $compile', function () {
	 	 publishExternalAPI();
	 	 var injector = createInjector(['ng']);
	 	 expect(injector.has('$compile')).toBe(true);
	 }); 
});