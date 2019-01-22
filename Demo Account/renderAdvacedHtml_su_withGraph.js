/**
 * @NApiVersion 2.0
 * @NScriptType suitelet
 */
define(['N/render','N/file','N/search','N/runtime','N/ui/serverWidget'], function(render,file,search,runtime,serverWidget) {
	
	
	function getResultsArray(){
		var col1 = search.createColumn({
		     name:'datecreated',
		     summary:search.Summary.GROUP,
		     function:'year'
		 })


		var col2 = search.createColumn({
		     name:'datecreated',
		     label:'created',
		     summary:search.Summary.COUNT
		 })


	     searchResult = search.create({
		   type:search.Type.CUSTOMER,
		   columns:[col1,col2]
		}).run().getRange(0,100);

		return searchResult.map(function(r){
			return {
				year:r.getValue({name:'datecreated',summary:search.Summary.GROUP}),
				count:r.getValue({name:'datecreated',summary:search.Summary.COUNT})
			}
		})
		
		
	}
	
	
    return {
        onRequest: function(options) {
            var form = serverWidget.createForm({
                 title : 'Simple Form'
            });
        	var request = options.request,response = options.response;
        	var customersList = getResultsArray();
        	log.debug('result',customersList);
        	var fileObj = file.load('18697');
        	var renderer = render.create();
        	var currentUser  = runtime.getCurrentUser();
        	renderer.templateContent = fileObj.getContents();
        	renderer.addCustomDataSource({
        		 format: render.DataSource.OBJECT,
                 alias: "owner",
                 data: currentUser
        	});
        
        	
        	renderer.addCustomDataSource({
        		format: render.DataSource.OBJECT,
                alias: "chartList",
                data: {data:JSON.stringify(customersList)}
        	});
        	
        	var output_template = renderer.renderAsString();
            var field = form.addField({
                id : 'custpage_inlinefield',
               type : serverWidget.FieldType.INLINEHTML,
                 label : 'Text'
            }).defaultValue = output_template
        	response.writePage(form);
        	
        }
    }
});