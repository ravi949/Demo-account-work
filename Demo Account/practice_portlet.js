/**
 * @NApiVersion 2.x
 * @NScriptType Portlet
 * @NModuleScope SameAccount
 */
define(['N/search'],

		function(search) {

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
			var listOfAvgs = JSON.stringify([
				["Task", "Hours per Day"],
				["2014-"+getCustomersByYear(2014).count, getCustomersByYear(2014).count],
				["2015-"+getCustomersByYear(2015).count, getCustomersByYear(2015).count],
				["2016-"+getCustomersByYear(2016).count, getCustomersByYear(2016).count],
				["2017-"+getCustomersByYear(2017).count, getCustomersByYear(2017).count],
				["2018-"+getCustomersByYear(2018).count, getCustomersByYear(2018).count]
				]);
			var portlet = params.portlet;

			portlet.title = 'Customers Chart';
			portlet.html = '<html><body><h1>Customers created per year</h1>'+
			'<div id="piechart"></div><script type="text/javascript" src="https://www.gstatic.com/charts/loader.js">'+
			'</script><script type="text/javascript">var a = '+listOfAvgs+';console.log(a);google.charts.load("current", {"packages":["corechart"]});'+
			'google.charts.setOnLoadCallback('+drawChart+');</script></body></html>;';


		}catch(e){
			log.debug(e.name,e.message);
		}

	}

	function getCustomersByYear(year){
		return search.create({
			type:search.Type.CUSTOMER,	 
			columns:['internalid'],
			filters:['datecreated','within','1/1/'+year,'12/31/'+year]
		}).runPaged();
	}
	function drawChart() {
		var data = google.visualization.arrayToDataTable(a);
		var options = {'title':'Customers Graph', 'width':550, 'height':400};
		var chart = new google.visualization.PieChart(document.getElementById('piechart'));
		chart.draw(data, options);

	}


	return {
		render: render
	};

});
