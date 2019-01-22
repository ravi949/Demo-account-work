/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/redirect', 'N/ui/serverWidget','N/search'],
/**
 * @param {redirect} redirect
 * @param {serverWidget} serverWidget
 */
function(redirect, serverWidget, search) {
   
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
    		var assistantEx = serverWidget.createAssistant({
    		    title : 'Example Assistant'
    		});
    		var step1 = assistantEx.addStep({
    		    id : 'step_1',
    		    label : 'Sample Step1'
    		});
    		var step2 = assistantEx.addStep({
    		    id : 'step_2',
    		    label : 'Sample Step2'
    		});
    		var step3 = assistantEx.addStep({
    		    id : 'step_3',
    		    label : 'Sample Step3'
    		});
    		var step4 = assistantEx.addStep({
    		    id : 'step_4',
    		    label : 'Sample Step4'
    		});
    		var request = context.request;
    		var response = context.response;
    		if(request.method == 'GET'){
    			if(assistantEx.currentStep == null)
    				assistantEx.currentStep = step1;
    			if(assistantEx.currentStep.stepNumber == 1){
    				var sublist = assistantEx.addField({
    					id : 'custpage_subsidary',
    					type : serverWidget.FieldType.SELECT,
    					source:'subsidiary',
    					label : 'Subsidary'
    				});
    			}
    		}

    	    if(request.method == 'POST'){
    	    	if(assistantEx.currentStep.stepNumber == 1)
    	    		log.debug('debug',step1.getValue({id: 'custpage_subsidary'}));
    	    	if(assistantEx.getNextStep() == 4){
    	    		assistantEx.currentStep = step1
    	    	}else
    	    		assistantEx.currentStep = assistantEx.getNextStep();
    	    	if(assistantEx.currentStep.stepNumber == 1){
    				var sublist = assistantEx.addField({
    					id : 'custpage_subsidary',
    					type : serverWidget.FieldType.SELECT,
    					source:'subsidiary',
    					label : 'Subsidary'
    				});
    			}
    			 if(assistantEx.currentStep.stepNumber == 2){
        	    	 assistantEx.addField({
        	 	     id : 'custpage_customer',
        	  	     type : serverWidget.FieldType.MULTISELECT,
 					source:'entity',
        	   	     label : 'Select Customers'
        		   });
        	     }
    			 if(assistantEx.currentStep.stepNumber == 3){
        	    	 assistantEx.addField({
        	 	     id : 'custpage_selectedcust',
        	  	     type : serverWidget.FieldType.INLINEHTML,
        	   	     label : 'Customers List'
        		   });
        	     }
    			 if(assistantEx.currentStep.stepNumber == 4){
        	    	 assistantEx.addField({
        	 	     id : 'custpage_lastpage',
        	  	     type : serverWidget.FieldType.LABEL,
        	   	     label : 'You Finished the process'
        		   });
        	     }
    	     }
    	     
    		  response.writePage(assistantEx);
    	}catch(e){
    		log.error(e.message,e);
    	}

    }

    return {
        onRequest: onRequest
    };
    
});
