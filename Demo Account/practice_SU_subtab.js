/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/ui/serverWidget','N/search','N/record','N/format'],

		function(ui,search,record,format) {

	/**
	 * Definition of the Suitelet script trigger point.
	 *
	 * @param {Object} context
	 * @param {ServerRequest} context.request - Encapsulation of the incoming request
	 * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
	 * @Since 2015.2
	 */
	function onRequest(context) {
		try{
			var  request = context.request;
			var response = context.response;

			if (context.request.method === 'GET') {
				var form = ui.createForm({
					title: 'suitelet search'
				});	
				var amount1 = form.addField({
					id: 'custpage_currency1',
					type: ui.FieldType.CURRENCY,
					label: 'amount1'
				}); 
				var amount2 = form.addField({
					id: 'custpage_currency2',
					type: ui.FieldType.CURRENCY,
					label: 'amount2'
				}); 
				var amount3 = form.addField({
					id: 'custpage_currency3',
					type: ui.FieldType.MULTISELECT,
					label: 'amount3'
				}); 
				amount3.addSelectOption({
				    value : '1',
				    text : '23'
				});
				amount3.addSelectOption({
				    value : '1',
				    text : '35'
				});

				var tab = form.addSubtab({
					id : 'custpage_tab',
					label : 'Invoices data'
				});  
				var subList = form.addSublist({
					id : 'custpage_show',
					type : ui.SublistType.LIST,
					label : 'Inline Editor Sublist',
					tab:'custpage_tab'
				});
				var intID = form.addField({
					id: 'custpage_inv_ids',
					type: ui.FieldType.SELECT,
					label: 'customer name',
					container:'custpage_tab',
					source:'customer'
				}); 
				var acp = form.addField({
					id: 'custpage_accntng',
					type: ui.FieldType.SELECT,
					label: 'accounting period',
					container:'custpage_tab',
					source:'ACCOUNTINGPERIOD'					
				}); 
				var paginationField = form.addField({
					id : 'custpage_ss_pagination',
					type : ui.FieldType.SELECT,
					label : 'Rows',
					container:'custpage_tab'
				});
				paginationField.updateDisplaySize({
					height:50,
					width : 140
				});

				var docno = subList.addField({
					id: 'custpage_ns_invdocno',
					type: ui.FieldType.TEXT,
					label: 'Invoice Document numbers'
				}); 
				var invId = subList.addField({
					id: 'custpage_ns_invids',
					type: ui.FieldType.TEXT,
					label: 'Invoice Ids'
				});

				var custName = subList.addField({
					id: 'custpage_ns_cnames',
					type: ui.FieldType.TEXT,
					label: 'Customer names'
				});

				context.response.writePage(form);
				form.clientScriptModulePath  = './practice_CS_subtab_su_link.js';

				if(request.parameters.customer){

					intID.defaultValue = request.parameters.customer;
					var myPagedData = searchFunction(request.parameters.customer);
					var myPagedData1 = searchFunctionforACP(request.parameters.period);
					var totalResultCount = myPagedData1.count;					

					myPagedData1.pageRanges.forEach(function(pageRange){	

						var myPage = myPagedData1.fetch({index: request.parameters.startno});		
						var j = 0;
						myPage.data.forEach(function(result){
							subList.setSublistValue({					
								id: 'custpage_ns_invdocno',
								line : j,
								value : result.getValue('tranid')
							});
							subList.setSublistValue({					
								id: 'custpage_ns_invids',
								line : j,
								value : result.id
							});
							subList.setSublistValue({					
								id: 'custpage_ns_cnames',
								line : j,
								value : result.getText('entity')
							});
							j++;
							context.response.writePage(form);
							return true;
						});
					});

					var listOfPages = myPagedData1["pageRanges"];
					var numberOfPages = listOfPages.length;
					var page = dataCount = null;
					var startno = request.parameters.startno;

					for(var i = 0;i < numberOfPages;i++){
						var paginationTextEnd = (totalResultCount >= (i*20)+20)?((i * 20)+20):totalResultCount;
						paginationField.addSelectOption({
							value :listOfPages[i].index,
							text : ((i*20)+1)+' to '+paginationTextEnd+' of '+totalResultCount,
							isSelected:(startno == i)
						});
					}

					page = myPagedData1.fetch({
						index:startno
					});

					dataCount = page.data.length;
				}
			}
		}catch(e){
			log.debug(e.name,e.message);
		}

	}
	function searchFunction(customer){
		try{
			var intId = search.createColumn({
				name: 'internalid',
				sort: search.Sort.ASC
			});
			var createdSearch = search.create({
				type:search.Type.INVOICE ,    
				columns:['tranid','entity',intId],
				filters:[['mainline','is',true],'and',['entity','is',customer]]
			});
			var myPagedData = createdSearch.runPaged({
				pageSize :20
			});
			return myPagedData;
		}catch(e){
			log.error(e.name,e.message);

		}
	}
	function searchFunctionforACP(acid){
		try{

			var loadedRec = record.load({
				type:record.Type.ACCOUNTING_PERIOD,
				id:acid
			});
			var start = format.format({
				value: loadedRec.getValue('startdate'),
				type: format.Type.DATE
			});
			log.debug('sdate',start);
			var end = format.format({
				value: loadedRec.getValue('enddate'),
				type: format.Type.DATE
			});
			log.debug('edate',end);
			var createdSearch = search.create({
				type:search.Type.SALES_ORDER,    
				columns:['tranid','entity'],
				filters:[['mainline','is',true],'and',['trandate','within',start,end]]
			});
			log.debug('searc',createdSearch );
			log.debug('ss',loadedRec);
			log.debug('ss',loadedRec.getValue('startdate'));
			var myPagedData1 = createdSearch.runPaged({
				pageSize :20
			});
			return myPagedData1;
		}catch(e){
			log.error(e.name,e.message);

		}
	}



	return {
		onRequest: onRequest
	};

});
