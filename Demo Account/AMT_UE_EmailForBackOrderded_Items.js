/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record','N/search','N/email'],

		function(record,search,email) {

	/**
	 * Function definition to be triggered before record is loaded.
	 *
	 * @param {Object} scriptContext
	 * @param {Record} scriptContext.newRecord - New record
	 * @param {string} scriptContext.type - Trigger type
	 * @param {Form} scriptContext.form - Current form
	 * @Since 2015.2
	 */
	function beforeLoad(scriptContext) {

	}

	/**
	 * Function definition to be triggered before record is loaded.
	 *
	 * @param {Object} scriptContext
	 * @param {Record} scriptContext.newRecord - New record
	 * @param {Record} scriptContext.oldRecord - Old record
	 * @param {string} scriptContext.type - Trigger type
	 * @Since 2015.2
	 */
	function beforeSubmit(scriptContext) {
		try{
			var objRecord =  scriptContext.newRecord ;

			var numLines = objRecord.getLineCount({
				sublistId: 'item'
			});
			log.debug('lines',numLines);
			var itemsList = [];
			var backorderedArr = [];
			for(i=0;i<numLines;i++){
				var receive = objRecord.getSublistValue({
					sublistId: 'item',
					fieldId: 'itemreceive',
					line: i
				});
				log.debug('receive',receive);
				if(receive){
					var itemId = objRecord.getSublistValue({
						sublistId: 'item',
						fieldId: 'item',
						line: i
					});
					var itemName = objRecord.getSublistText({
						sublistId: 'item',
						fieldId: 'item',
						line: i
					});
					log.debug('iname',itemName);
					log.debug('iname',typeof itemName);
					var fieldLookUp = search.lookupFields({
						type: 'item',
						id: itemId ,
						columns: ['quantitybackordered']
					});
					var backordered = fieldLookUp.quantitybackordered;
					log.debug('bo',backordered);
					var quantity = objRecord.getSublistValue({
						sublistId: 'item',
						fieldId: 'quantity',
						line: i
					});
					var stillBackordered = 0;
					if(backordered > 0){
						stillBackordered = parseFloat(backordered) - parseFloat(quantity);
						log.debug('sbo',stillBackordered);
					}
					if(stillBackordered > 0){
						itemsList.push(itemId);
						backorderedArr.push(stillBackordered);
					}        		
				}
			}
			if(itemsList.length > 0){
				var body =  '<html><script type = "text/javascript" >var mytable = "<table    border=\"4\" cellpadding=\"1\" cellspacing=\"1\"><tbody><tr>"; for (var i = 1; i < 31; i++) { if (i % 3 == 1 && i != 1) { mytable += "</tr><tr>";}mytable += "<td>[" + i + "]</td>";}mytable += "</tr></tbody></table>"; mytable; </script></html>';
				var b = '<table><tr>jksdg</tr></table>';
				email.send({
					author: 3062,
					recipients: 3063,
					subject: 'Test Sample Email Module',
					body: b
				});
			}
			log.debug('items',itemsList);
		}catch(ex){
			log.error(ex.name,ex.message);
		}
	}

	/**
	 * Function definition to be triggered before record is loaded.
	 *
	 * @param {Object} scriptContext
	 * @param {Record} scriptContext.newRecord - New record
	 * @param {Record} scriptContext.oldRecord - Old record
	 * @param {string} scriptContext.type - Trigger type
	 * @Since 2015.2
	 */
	function afterSubmit(scriptContext) {

	}

	return {
		beforeLoad: beforeLoad,
		beforeSubmit: beforeSubmit,
		afterSubmit: afterSubmit
	};

});
