/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(["N/search","N/record","N/https","N/format","N/runtime","N/file","N/task","N/email"],

		function(search,record,https,format,runtime,file,task,email) {

	/**
	 * Marks the beginning of the Map/Reduce process and generates input data.
	 *
	 * @typedef {Object} ObjectRef
	 * @property {number} id - Internal ID of the record instance
	 * @property {string} type - Record type id
	 *
	 * @return {Array|Object|Search|RecordRef} inputSummary
	 * @since 2015.1
	 */
	function getInputData() {
		try{
			return search.create({
				type:search.Type.EMPLOYEE ,
				columns:['email','internalid','custentity_emp_togglapitoken','custentity_toggl_date'],
				filters:[['custentity_emp_togglapitoken','isnotempty',null],'and',['isinactive','is',false]]
			});
		}
		catch(ex){
			log.debug(ex.name,ex.message);
		}
	}






	/**
	 * Executes when the map entry point is triggered and applies to each key/value pair.
	 *
	 * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
	 * @since 2015.1
	 */
	function map(context) {
		try{
			//search for project with respec to project ID 
			var projectarr = [] ;
			var projectSearch = search.create({
				type:search.Type.JOB,
				columns:['custentity_cust_toggl_projectid','customer','internalid'],
				filters:[['custentity_cust_toggl_projectid','isnotempty',null],'and',['isinactive','is',false]]
			});
			projectSearch.run().each(function(e){
				projectarr.push({
					pinternalid: e.getValue('internalid'),
					pid: e.getValue('custentity_cust_toggl_projectid')
				});
				return true;
			});
			log.debug('array',projectarr);
			var valueObj = JSON.parse(context.value);
			log.debug('valueObj',valueObj);
			var ydate = getDate('y');
			log.debug('we',ydate);
			ydate = encodeURIComponent(ydate+"T00:00:00.000Z");		
			var tdate = getDate('t');
			tdate = encodeURIComponent(tdate+"T00:00:00.000Z");
			log.debug('valueObj',valueObj.id);
			log.debug('empty',valueObj.values.custentity_toggl_date);

			//Getting value from Lastupdate field from employee record
			var newdate = valueObj.values.custentity_toggl_date;
			log.debug('newdate',newdate);			
			var lastupdatedate = new Date(valueObj.values.custentity_toggl_date);	
			log.debug('lastupdatedate',lastupdatedate);
			var difference = new Date().getDate()-lastupdatedate.getDate();
			var date1 = new Date(lastupdatedate);
			var date2 = new Date();
			var timeDiff = Math.abs(date2.getTime() - date1.getTime());
			var difference1 = Math.ceil(timeDiff / (1000 * 3600 * 24)); 	
			log.debug('difference1',difference1);
			var userRequest;
			if(difference1 > 3){
				log.debug('diff','loop');
				var date = new Date(newdate);
				var year = date.getFullYear();
				var month = date.getMonth()+1;				
				var dt = date.getDate()+1;				
				if (dt < 10) {
					dt = '0' + dt;
				}
				if (month < 10) {
					month = '0' + month;
				}
				var finalDate = year+'-'+month+'-'+dt;				
				var ydate = finalDate;					
				ydate = encodeURIComponent(ydate+"T00:00:00.000Z");	
				log.debug('ydate',ydate);
				var tdate = getDate('t');				
				tdate = encodeURIComponent(tdate+"T00:00:00.000Z");
				log.debug('tdate',tdate);
				// api call to toggl from start date to end date
				userRequest = https.get({
					url: 'https://www.toggl.com/api/v8/time_entries?start_date='+ydate+'&end_date='+tdate,
					headers: {
						'Authorization': "Basic " + base64encode(valueObj.values.custentity_emp_togglapitoken+':api_token')
					}
				});
			}else{
				log.debug('else','loop');
				var ydate1 = getDate('y');	
				ydate1 = encodeURIComponent(ydate1+"T00:00:00.000Z");	
				log.debug('ydate1',ydate1);
				var tdate1 = getDate('t');
				tdate1 = encodeURIComponent(tdate1+"T00:00:00.000Z");
				log.debug('tdate1',tdate1);
				// api call to toggl from start date to end date
				userRequest = https.get({
					url: 'https://www.toggl.com/api/v8/time_entries?start_date='+ydate1+'&end_date='+tdate1,
					headers: {
						'Authorization': "Basic " + base64encode(valueObj.values.custentity_emp_togglapitoken+':api_token')
					}
				});
			}

			var userRequestBody = userRequest.body;
			log.debug('userRequest',userRequest.code);
			userRequestBody = JSON.parse(userRequestBody);
			log.debug('type userRequestBody',typeof userRequestBody);
			log.debug('jsonuserRequestBody',userRequestBody);
			var parrLength = projectarr.length;
			if(userRequest.code == '200'){

				var empid = valueObj.id;
				var id = record.submitFields({
					type: record.Type.EMPLOYEE,
					id: empid,
					values: {
						custentity_toggl_responsecode : userRequest.code
					},
					options: {
						enableSourcing: false,
						ignoreMandatoryFields : true
					}
				});

				log.debug('URL','https://www.toggl.com/api/v8/time_entries?start_date='+ydate+'&end_date='+tdate);

				var projectResult;
				var urBodyLength = userRequestBody.length;				
				userRequestBody.forEach(function(element){

					try{			
						log.debug('ydate',ydate);
						log.debug('tdate',tdate);
						projectResult = projectarr.filter(function(prj){return prj.pid == element.pid});

						if(projectResult.length > 0){
							var startTime =  element.start.replace('+','.');
							startTime = startTime.substring(0, startTime.length-3);
							startTime = startTime.concat('0Z');
							//log.debug('startTime',startTime);

							var stopTime =  element.stop.replace('+','.');
							stopTime = stopTime.substring(0, stopTime.length-3);
							stopTime = stopTime.concat('0Z');
							//log.debug('stopTime',stopTime);						
							var duration = element.duration;
							duration = (duration/3600).toFixed(5);
							//log.debug('duration',duration);
							var isBillable = element.billable;
							log.debug('isBillable',isBillable);
							var createdRec = record.create({
								type:record.Type.TIME_BILL
							});
							log.debug('valueObj',valueObj);
							var tranDate = (element.at).slice(0,10).toString();
							log.debug('tranDate',tranDate);
							log.debug('at',typeof element.at);
							var tedate = new Date();
							log.debug('tedate',tedate);
							tedate.setDate(tedate.getDate() - 1);

							//creating time enteries records in Netsuite from data
							createdRec.setValue({fieldId:'employee', value:valueObj.id});
							createdRec.setValue({fieldId:'hoursstart', value:new Date(startTime)});
							createdRec.setValue({fieldId:'hoursend', value:new Date(stopTime)});
							createdRec.setValue({fieldId:'hours', value:duration});
							createdRec.setValue({fieldId:'memo', value:element.description});						
							createdRec.setValue({fieldId:'trandate', value:tedate});
							createdRec.setValue({fieldId:'customer', value:projectResult[0].pinternalid});
							createdRec.setValue({fieldId:'item', value:'736'});
							createdRec.setValue({fieldId:'isbillable', value:isBillable});
							var savedRec = createdRec.save({
								enableSourcing:false,
								ignoreMandatoryFields:true
							});
							log.debug('savedRec',savedRec);	
							var empid = valueObj.id;
							var id = record.submitFields({
								type: record.Type.EMPLOYEE,
								id: empid,
								values: {									
									custentity_toggl_date : tedate	
								},
								options: {
									enableSourcing: false,
									ignoreMandatoryFields : true
								}
							});


						}}
					catch(ex){
						log.debug('For Loop '+ex.name,ex.message);
					}

				});
				if(urBodyLength > 0){
					for(i=0;i < urBodyLength;i++){
						log.debug('id-s',userRequestBody[i].id);
						var tentryId = userRequestBody[i].id;
						var userRequest = https.put({
							url: 'https://www.toggl.com/api/v8/time_entries/'+tentryId,
							body:'{"time_entry":{"tags":["Synchronized"],"tag_action": "add"}}',
							headers: {
								'Authorization': "Basic " + base64encode(valueObj.values.custentity_emp_togglapitoken+':api_token'),
								'Content-Type': 'application/json'
							}		

						});
						log.debug('teurl','https://www.toggl.com/api/v8/time_entries/'+tentryId);
					}
				}


			}else{
				email.send({
					author: 5852,
					recipients: 5852,
					subject: 'Test Sample Email Module',
					body: 'The scheduled map reduce script for toggl integration failed to get time entries from server'
				});
				var empid = valueObj.id;		
				var id = record.submitFields({
					type: record.Type.EMPLOYEE,
					id: empid,
					values: {
						custentity_toggl_responsecode : ' '
					},
					options: {
						enableSourcing: false,
						ignoreMandatoryFields : true
					}
				});
			}
			log.debug('time end '+valueObj.id,runtime.getCurrentScript().getRemainingUsage());
		}
		catch(ex){
			log.debug(ex.name,ex.message);

		}
	}

	/**
	 * Executes when the reduce entry point is triggered and applies to each group.
	 *
	 * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
	 * @since 2015.1
	 */
	function reduce(context) {

	}


	/**
	 * Executes when the summarize entry point is triggered and applies to the result set.
	 *
	 * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
	 * @since 2015.1
	 */
	function summarize(summary) {

	}
	//function for encoding the string api token
	function base64encode(string_to_be_converted) {
		try{
			var base64EncodeChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
			var out, i, len;
			var c1, c2, c3;

			len = string_to_be_converted.length;
			i = 0;
			out = "";
			while(i < len) {
				c1 = string_to_be_converted.charCodeAt(i++) & 0xff;
				if(i == len)
				{
					out += base64EncodeChars.charAt(c1 >> 2);
					out += base64EncodeChars.charAt((c1 & 0x3) << 4);
					out += "==";
					break;
				}
				c2 = string_to_be_converted.charCodeAt(i++);
				if(i == len)
				{
					out += base64EncodeChars.charAt(c1 >> 2);
					out += base64EncodeChars.charAt(((c1 & 0x3)<< 4) | ((c2 & 0xF0) >> 4));
					out += base64EncodeChars.charAt((c2 & 0xF) << 2);
					out += "=";
					break;
				}
				c3 = string_to_be_converted.charCodeAt(i++);
				out += base64EncodeChars.charAt(c1 >> 2);
				out += base64EncodeChars.charAt(((c1 & 0x3)<< 4) | ((c2 & 0xF0) >> 4));
				out += base64EncodeChars.charAt(((c2 & 0xF) << 2) | ((c3 & 0xC0) >>6));
				out += base64EncodeChars.charAt(c3 & 0x3F);
			}
			return out;
		}
		catch(ex){
			log.debug(ex.name,ex.message);
		}
	}
	function getDate(parameter){
		try{
			var date = new Date();
			var year = date.getFullYear();
			var month = date.getMonth()+1;
			if(parameter == 'y'){
				var yesterday = new Date(new Date().setDate(new Date().getDate()-1));
				return yesterday.toISOString().slice(0,10);
//				var dt = new Date(date - 1000*60*60*24);

			}
			if(parameter == 't'){
				var dt = date.getDate();
			}


			if (dt < 10) {
				dt = '0' + dt;
			}
			if (month < 10) {
				month = '0' + month;
			}

			if(parameter == 'date'){
				var dt = date.getDate()-1;
				var finalDate = dt+'/'+month+'/'+year;
				return finalDate;
			}			

			var finalDate = year+'-'+month+'-'+dt;
			return finalDate;
		}
		catch(ex){
			log.debug('Date Block '+ex.name,ex.message);			
		}
	}

	return {
		getInputData: getInputData,
		map: map,
		reduce: reduce,
		summarize: summarize,
		base64encode: base64encode
	};

});
