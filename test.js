$(document).ready(function(){

	d3.csv("global.csv", function(error,data){
		if (error)  throw error;

		var year1 = 1970, year2 = 2016;
		var global_country = "global";

        var barchart1 = newdata_barchart(data);

	  	function update_othercharts(country){
	  		global_country = country;
	  		var temp = data.filter(a => (a.country == global_country));
	  		//temp =  temp.filter(a => $.inArray(a.iyear, _.range(year1,year2+1)) > -1);
            barchart.updatebc(temp);
		}

		function reset_all_charts(){
			global_country = "global";
            barchart.updatebc(data);
		}

	    function newdata_barchart(data){

	    	// Create barchart SVG
		    var margin = {top: 20, right: 20, bottom: 45, left: 60};

		    var bar_chart = d3.select("#barchart")
		    .append("svg")
		    .attr("class", "bar_chart")
		    .attr("width", "100%")
		    .attr("height", "100%")
		    .append("g")
		    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		    var bc_width = $(".bar_chart").width() - margin.left - margin.right,
		    bc_height = $(".bar_chart").height() - margin.top - margin.bottom;

	    	var preprocessed_data = preprocess_barchart(data);

	        // text label for the x axis title
	        bar_chart.append("g")
	        .attr("class", "bc_xaxis")
	        .attr("transform", "translate(" + (bc_width/2) + " ," + (bc_height + margin.top + 20) + ")")
	        .append("text")
	        .text("Year");

      		updateBarchart(preprocessed_data);

      		function preprocess_barchart(data){

      			var barchart_array = [];
	  			data.forEach(function(d) {
	  				if(d.country_txt == global_country){
	  					temp_dict = {}
	  					temp_dict["iyear"] = +d.iyear;
	  					temp_dict["nkill"] = +d.nkill;
	  					barchart_array.push(temp_dict);
	  				}
	  				else{
	  					temp_dict = {}
	  					temp_dict["iyear"] = +d.iyear;
	  					temp_dict["nkill"] = +d.nkill;
	  					barchart_array.push(temp_dict);
	  				}
	  			});

	      		var groups = _(barchart_array).groupBy('iyear');

	      		var barchart_array = _(groups).map(function(g, key) {
	      			return { iyear: key, 
	      				nkill: _(g).reduce(function(m,x) { return m + x.nkill; }, 0) };
	      			});

	      		return barchart_array;
      		}

      		function updateBarchart(barchart_array){

		      	var x = d3.scaleBand().range([0, bc_width]).padding(0.1);
		      	y = d3.scaleLinear().range([bc_height, 15]);

	      		// make new chart
	        	x.domain(barchart_array.map(function(d){ return d.iyear; })); 
	        	y.domain(d3.extent(barchart_array, function(d){ return d.nkill; })).nice();

	        	bar_chart.selectAll(".axis.axis--x").remove();

	        	bar_chart.append("g")
	        	.attr("class", "axis axis--x")
	        	.attr("transform", "translate(0," + bc_height + ")")
	            .call(d3.axisBottom(x).tickValues(x.domain().filter(function(d,i){ return !(i%5)}))); 
	            bar_chart.selectAll(".axis.axis--y").remove();

	            // remove all info window
	            bar_chart.selectAll(".infowin").remove();

	            // text label for the selected barchart text 1
		        bar_chart.append("g")
		        .attr("class", "infowin")
		        .attr("transform", "translate(100, 5)")
		        .append("text")
		        .attr("id", "text_1");

		        // text label for the selected barchart text 2
		        bar_chart.append("g")
		        .attr("class", "infowin")
		        .attr("transform", "translate(180, 5)")
		        .append("text")
		        .attr("id","text_2");

	            bar_chart.append("g")
	            .attr("class", "axis axis--y")
	            .call(d3.axisLeft(y).ticks(10))
	            .append("text")
	            .attr("transform", "translate(60,0)")
	            .attr("y", 6)
	            .attr("dy", "0.71em")
	            .attr("text-anchor", "end")
	            .text("Frequency");

	            bar_chart.selectAll(".bar").remove();

	            bar_chart.selectAll(".bar")
	            .data(barchart_array)
	            .enter().append("rect")
	            .attr("class", "bar")
	            .attr("x", function(d) { return x(d.iyear); })
	            .attr("y", bc_height)  
	        	.attr("width", x.bandwidth()) 
	        	.attr("height", 0)
	        	.on("mouseover", function(d){
	        		d3.select("#text_1")
	        		.html("Year: " + d.iyear );
	        		d3.select("#text_2")
	        		.html("No. of people killed: " + d.nkill);
	        	})
	        	.transition().delay(250).duration(500)
	            .attr("y", function(d) { return y(d.nkill); }) 
	            .attr("height", function(d) { return bc_height - y(d.nkill); }) 
	            .style("opacity", 1);
		    }

		    this.updatebc = function(data){
		    	var barchart_array = preprocess_barchart(data);
      			updateBarchart(barchart_array);
			}  
			return this;
      	}
	}); //end of d3.csv         
})// end of document ready


	