/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/record','N/render'],

function(record,render) {
   
    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
    function onRequest(context) {
    	var strHTML = '<?xml version="1.0"?><!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd"><pdf><body>';
    	strHTML +='<div style="text-align:center; position: relative; top: 30%;"><table style="position: relative;left: 35%;">';
    	strHTML += '<tr><td><label>Invoice Id</label></td><td> ${InvObj.internalid}</td></tr>';
    	strHTML += '<tr><td><label>Invoice ${InvObj.entity@label}</label></td><td>${InvObj.entity}</td></tr>';
    	strHTML += '<tr><td><label>Total</label></td><td> ${InvObj.total}</td></tr>';
    	strHTML += '</table></div><label></label></body></pdf>';
    	
    	var renderObj = render.create();
    	 
    	renderObj.templateContent = strHTML;
    	
    	var inv = record.load({
    		type:record.Type.INVOICE,
    		id:10208
    	})
    	
    	renderObj.addRecord({
    	    templateName: 'InvObj',
    	    record: inv
    	});
    	
    	var template = renderObj.renderAsPdf();
    	
    	context.response.writeFile({
    	    file: template,
    	    isInline: true
    	});
    }
    
    return {
        onRequest: onRequest
    };
    
});
