/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/ui/serverWidget','N/search'],

		function(ui,search) {

	/**
	 * Definition of the Suitelet script trigger point.
	 *
	 * @param {Object} context
	 * @param {ServerRequest} context.request - Encapsulation of the incoming request
	 * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
	 * @Since 2015.2
	 */
	function onRequest(context) {
		var  request = context.request;
		var response = context.response;
		var assistant = ui.createAssistant({
			title : 'Simple Assistant'
		});

		var subsidiary = assistant.addStep({
			id : 'subsidiary',
			label : 'Select Subsidiary'
		});

		var customer = assistant.addStep({
			id : 'customers',
			label : 'Select customers'
		});
		var priority = assistant.addStep({
			id : 'priority',
			label : 'Select one customer from list'
		});

		var finish = assistant.addStep({
			id : 'finish',
			label : 'Finish'
		});
//		log.debug('cstep',step);
		assistant.isNotOrdered = false;
		var lastStep = assistant.getLastStep();
		log.debug('lstep',lastStep);

		log.debug('assistant.getNextStep()',assistant.getNextStep());
//		if ( assistant.currentStep == null ){

		if(request.method == 'GET'){
			var start = request.parameters.start;
		}

		if(request.method == 'POST'){	
			if(assistant.getStep('subsidiary').stepNumber == 1){
				assistant.currentStep = subsidiary;
				assistant.addField({
					id : 'subsidiary',
					type : ui.FieldType.SELECT,
					label : 'Select Subsidiary',
					source:'subsidiary'
				});
			}else if(assistant.getStep('customer').stepNumber == 2){
				assistant.currentStep = customer;
				var firststep = assistant.getStep({
					id: 'subsidiary'
				});
				var firststepValue = firststep.getValue({
					id: 'subsidiary'
				});

				log.debug('firststepValue',firststepValue);
				var cusName = assistant.addField({
					id : 'customer',
					type : ui.FieldType.MULTISELECT,
					label : 'Select Customer'
				});				
				var cusName = search.create({
					type:search.Type.CUSTOMER,
					columns:['entityid'],
					filters: ['subsidiary','is',firststepValue]			         
				}).run().each(function(e){					
					cusName.addSelectOption({
						value :e.getValue('entityid'),
						text : e.getValue('entityid')						
					});

					return true;
				});
				log.debug('firststepValue',firststepValue);
//				assistant.errorHtml =  "You have <b>not</b> filled out the required fields. Please go back.";
			}else if(assistant.getNextStep().stepNumber == 3){
				assistant.currentStep = priority;
				var secondstep = assistant.getStep({
					id: 'customers'
				});
				var secondstepValue = secondstep.getValue({
					id: 'customer'
				});
				log.debug('type',typeof JSON.stringify(secondstepValue).split('|'));
				var sValue = secondstepValue.split('\u0005');
				log.debug('svalue',sValue);
				log.debug('secondstepValue',secondstepValue);
				var oneCustomer = assistant.addField({
					id : 'onecustomer',
					type : ui.FieldType.SELECT,
					label : 'Select one Customer from list'
				});		
				for(i=0;i<sValue.length;i++){
					oneCustomer.addSelectOption({
						value:sValue[i],
						text:sValue[i]
					});
				}
//				assistant.errorHtml =  "You have <b>not</b> filled out the required fields. Please go back.";
			}else if(assistant.getNextStep().stepNumber == 4){
				assistant.currentStep = finish;
			
//				assistant.finishedHtml =  "Congratulations! You have successfully set up your account.";
			}else if(assistant.getNextStep().stepNumber == 5){
				assistant.finishedHtml =  "Congratulations! You have successfully set up your account.";
			}
//			assistant.currentStep = subsidiary;
		}

		context.response.writePage(assistant);

	}

	return {
		onRequest: onRequest
	};

});
