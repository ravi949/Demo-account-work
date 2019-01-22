/**
 * @NApiVersion 2.x
 * @NScriptType Portlet
 * @NModuleScope SameAccount
 */
define(['N/search','N/runtime'],

		function(search,runtime) {

	/**
	 * Definition of the Portlet script trigger point.
	 * 
	 * @param {Object} params
	 * @param {Portlet} params.portlet - The portlet object used for rendering
	 * @param {number} params.column - Specifies whether portlet is placed in left (1), center (2) or right (3) column of the dashboard
	 * @param {string} params.entity - (For custom portlets only) references the customer ID for the selected customer
	 * @Since 2015.2
	 */
	function render(params) {
		try{
			var userObj = runtime.getCurrentUser();
			log.debug('userObj',userObj.email );

			var email = userObj.email;
			log.debug('split',userObj.email.split('@')[0]);
			var name = userObj.email.split('@')[0];
			var domain= userObj.email.split('@')[1];
			var timezone = new Date().getTimezoneOffset();
          	log.debug('timezone',timezone);
			var portlet = params.portlet;			         
			portlet.title = 'Google Calendar';
			portlet.html = '<html><body><iframe src="https://calendar.google.com/calendar/embed?src='+name+'%40'+domain+'&ctz='+timezone+'" style="border:solid 1px #777" width="1200" height="600" frameborder="0" scrolling="no"></iframe></body></html>';
        

		}catch(e){
			log.debug(e.name,e.message);
		}

	}	

	return {
		render: render
	};

});
