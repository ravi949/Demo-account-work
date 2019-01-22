/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record','N/search','N/format'],

		function(record,search,format) {

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
		try{
			var salesorderId =  scriptContext.newRecord.getValue('createdfrom');
			log.debug('salesorderId',salesorderId);
			var woidArr = [];
			
			//fetching all workorders from sales order
			var soRecord = record.load({
				type: record.Type.SALES_ORDER, 
				id: salesorderId,
				isDynamic: true
			});
			var lineItemCount = soRecord.getLineCount('item');
			log.debug('lineItemCount',lineItemCount);
			
			for(i=0; i<lineItemCount;i++){
				
				var woID =  soRecord.getSublistValue({
					sublistId: 'item',
					fieldId: 'woid',
					line: i
					
				});  
				woidArr.push(woID);
				log.debug('woID',woID);
			}
			log.debug('woID',woidArr.length);
			
			//fetching all items from workorder where cablelength > 0 
			if(woidArr.length > 0){
				for(var i=0; i<woidArr.length ;i++){
					log.debug('woidin',woidArr[i]);
					var workorderSearchObj = search.create({
						type: "workorder",
						filters:
							[
								["type","anyof","WorkOrd"], 
								"AND", 
								["internalid","anyof",woidArr[i]],
								"AND",
								['mainline','is',"F"], 
								"AND", 
								["custcol_amt_length","greaterthan","0"]
								],
								columns:
									[
										search.createColumn({name: "item", label: "Item"})
										]
					}).run().each(function(e){

						log.debug('componeentitemid',e.getValue('item'));
						var componeentitemid = e.getValue('item');
						var itemSearchObj = search.create({
							type: "item",
							filters:
								[
									["internalid","anyof",e.getValue('item')]
									],
									columns:
										[
											search.createColumn({name: "binnumber", label: "Bin Number"}),
											search.createColumn({
												name: "internalid",
												join: "binNumber",
												label: "Internal ID"
											})
											]
						}).run().getRange(0,10);
						log.debug('itemSearchObj',itemSearchObj[1].getValue({name:'internalid',join:'binNumber'}));
						var binNumber = itemSearchObj[1].getValue({name:'internalid',join:'binNumber'});
						var tobinNumber = itemSearchObj[0].getValue({name:'internalid',join:'binNumber'});
						var itemSearchObj = search.create({
							type: "item",
							filters:
								[
									["inventorynumberbinonhand.quantityavailable","lessthan","1"], 
									"AND", 
									["internalid","anyof",e.getValue('item')], 
									"AND", 
									["inventorynumberbinonhand.binnumber","anyof",binNumber]
									],
									columns:
										[
											search.createColumn({
												name: "quantityavailable",
												join: "inventoryNumberBinOnHand",
												label: "Available"
											}),
											search.createColumn({
												name: "inventorynumber",
												join: "inventoryNumberBinOnHand",
												label: "Inventory Number"
											})
											]
						}).run().each(function(e){
							log.debug('inventorynumber',e.getValue({name: "inventorynumber",join: "inventoryNumberBinOnHand"}));
							log.debug('quantityavailable',e.getValue({name: "quantityavailable",join: "inventoryNumberBinOnHand"}));
							var inventorynumber = e.getValue({name: "inventorynumber",join: "inventoryNumberBinOnHand"});
							var quantityavailable =e.getValue({name: "quantityavailable",join: "inventoryNumberBinOnHand"});
							if(quantityavailable > 0){
								var objRecord = record.create({
									type: record.Type.BIN_TRANSFER, 
									isDynamic: true
								});
								objRecord.setValue('location',34);
								var componentRec = record.load({
									type:record.Type.LOT_NUMBERED_INVENTORY_ITEM,
									id:componeentitemid
								});
								var cableValue = componentRec.getValue('custitem__amt_length');
								log.debug('cableValue',cableValue);
								objRecord.selectNewLine({
									sublistId: 'inventory'

								});
								objRecord.setCurrentSublistValue({
									sublistId: 'inventory',
									fieldId: 'item',
									value: componeentitemid
								});
								log.debug('val',quantityavailable*1000);
								var value = quantityavailable*1000;
								value  =format.parse({value:value, type: format.Type.CURRENCY}).toFixed(2);
								if(cableValue == 500){
									objRecord.setCurrentSublistValue({
										sublistId: 'inventory',
										fieldId: 'quantity',
										value: quantityavailable*500
									});
								}else if(cableValue == 1000){
									objRecord.setCurrentSublistValue({
										sublistId: 'inventory',
										fieldId: 'quantity',
										value: value
									});
								}else if(cableValue == 2500){
									objRecord.setCurrentSublistValue({
										sublistId: 'inventory',
										fieldId: 'quantity',
										value: quantityavailable*2500
									});
								}
								var subrec = objRecord.getCurrentSublistSubrecord({
									sublistId: 'inventory',
									fieldId: 'inventorydetail'
								});
								subrec.selectNewLine({
									sublistId: 'inventoryassignment'
								});
								subrec.setCurrentSublistValue({
									sublistId: 'inventoryassignment',
									fieldId: 'issueinventorynumber',
									value: inventorynumber
								});
								subrec.setCurrentSublistValue({
									sublistId: 'inventoryassignment',
									fieldId: 'binnumber',
									value: binNumber
								});
								subrec.setCurrentSublistValue({
									sublistId: 'inventoryassignment',
									fieldId: 'tobinnumber',
									value:tobinNumber
								});
								if(cableValue == 500){
									subrec.setCurrentSublistValue({
										sublistId: 'inventoryassignment',
										fieldId: 'quantity',
										value: quantityavailable*500
									});
								}else if(cableValue == 1000){
									subrec.setCurrentSublistValue({
										sublistId: 'inventoryassignment',
										fieldId: 'quantity',
										value: value
									});
								}else if(cableValue == 2500){
									subrec.setCurrentSublistValue({
										sublistId: 'inventoryassignment',
										fieldId: 'quantity',
										value: quantityavailable*2500
									});
								}					
								subrec.commitLine({
									sublistId: 'inventoryassignment'
								});

								objRecord.commitLine({
									sublistId: 'inventory'
								});
								objRecord.save();
								//log.debug('objRecord',objRecord);
								return true;
							}
						});


					});

					
				}
			}
			
			
		}catch(e){
			log.debug(e.name,e.message);
		}

	}

	return {
		beforeLoad: beforeLoad,
		beforeSubmit: beforeSubmit,
		afterSubmit: afterSubmit
	};

});
