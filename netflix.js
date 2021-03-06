$(document).ready(function(){

	d3.csv("netflix_titles_mod.csv", function(error,data){
		if (error)  throw error;

		var global_country = "global";

		netflix_map(data);
        var barchart = newdata_barchart(data);

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

		function netflix_map(data){
			var transformation;
			var iszoomed = false;
			var circle_radius;
			var selected_year;
			var new_data = data;

			var active = d3.select(null);

			var zoom = d3.zoom()
			.scaleExtent([1,100])
			.on("zoom", zoomed);

			// Create netflix_map SVG
			var netflix_map = d3.select("#netflix_map")
			.append("svg")
			.attr("class", "netflix_map")
			.attr("width", "100%")
			.attr("height", "100%")
			.attr("padding-right", '0px');

			// Width and height of the whole visualization
			var cp_width = $("#netflix_map").width(),
			cp_height = $("#netflix_map").height();

			// Create legend SVG
			var netflix_map_legend = d3.select("#netflix_map_legend")
			.append("svg")
			.attr("class", "netflix_map_legend")
			.attr("width", 150)
			.attr("height", cp_height);

			// Set projection parameters
			var projection = d3.geoMercator()
			.scale(1)
			.translate([1, 0]); // width issue

			// Create geopath
			var path = d3.geoPath()
			.projection(projection);

			var cp_div = d3.select("#jason").append("div")
			.attr("id", "tooltip")
			.style("opacity", 0);

			netflix_map.append("rect")
			.attr("class", "background")
			.attr("width", cp_width)
			.attr("height", cp_height);

			var g = netflix_map.append("g");

			netflix_map.call(zoom);

		    data.forEach(function(d) {
		    	if (d.country == "United States")
		    		d.country = "USA";
                //console.log(d.date_added);
		    });
	        // console.log(data);

	        // loading bar
	        d3.select('div#loadingbar')
	        .transition().delay(1000).duration(500)
	        .style("opacity", 0);

	        // loading bar
	        d3.select('div#slider-range')
	        .transition().delay(1000).duration(500)
	        .style("opacity", 1);

	       	// netflix_map --------------------------------------------------------------------------------------------------------------------------------------------------------

	        // Read Global map
	        d3.json("world_map.json", function(map) {
	        	var bounds = path.bounds(map);
	        	var s = 0.95 / Math.max((bounds[1][0] - bounds[0][0]) / cp_width, (bounds[1][1] - bounds[0][1]) / cp_height);
	        	var t = [(cp_width - s * (bounds[1][0] + bounds[0][0])) / 2, (cp_height - s * (bounds[1][1] + bounds[0][1])) / 2];
	        	projection
	        	.scale(s)
	        	.translate(t);

	        	d3.select("g")
	        	.attr("class", "tracts")
	        	.selectAll("path")
	        	.data(map.features)
	        	.enter()
	        	.append('path')
	        	.attr("d", path)
	        	.on("click", clicked)
	        	.attr("stroke", "white")
	        	.attr("stroke-width", 0.5)
	        	.attr("fill", "white")
	        	.attr("fill-opacity", 0.7);

		       	// pre processing
		       	var map_data = _.countBy(data, "country");
		        // console.log(map_data);

		        // add and update mouse over tooltip div
		        updateTooltip(map_data);
		        
		        // add and update map color intensity for number of attacks
		        updateMapIntensity(map_data);

		    })

	        function clicked(d) {
	        	if (active.node() === this) {
	        		iszoomed = false;
	        		global_country = "global";

	  				// remove all crime data
	  				netflix_map.selectAll("circle").remove();

	  				// reset all chart
	  				reset_all_charts();
	  				reset();
	  			}
  				else{
	  				if(iszoomed){
	  					// remove all crime data
	  					netflix_map.selectAll("circle").remove();
		  				reset();
		  			}
		  			iszoomed = true;
		  			global_country = d.properties.name;

		  			active.classed("active", false);
		  			active = d3.select(this).classed("active", true);

		      		// reduce opacity of other country
		      		netflix_map.selectAll('path')
		      		.transition().duration(1000)
		      		.attr("opacity", 0.3);

		      		var bounds = path.bounds(d),
		      		dx = bounds[1][0] - bounds[0][0],
		      		dy = bounds[1][1] - bounds[0][1],
		      		x = (bounds[0][0] + bounds[1][0]) / 2,
		      		y = (bounds[0][1] + bounds[1][1]) / 2,
		      		scale = Math.max(1, Math.min(8, 0.9 / Math.max(dx / cp_width, dy / cp_height))),
		      		translate = [cp_width / 2 - scale * x, cp_height / 2 - scale * y];

		      		netflix_map.transition()
		      		.duration(750)
				      	.call( zoom.transform, d3.zoomIdentity.translate(translate[0],translate[1]).scale(scale) ); // updated for d3 v4

	  				// add crime data
				    //addCrime(new_data);
				    //update_othercharts(d.properties.name);
				}
			}

			function reset() {
				active.classed("active", false);
				active = d3.select(null);

			  	// reset opacity
			  	netflix_map.selectAll('path')
			  	.transition().delay(10)
			  	.attr("opacity", 1);

			  	netflix_map.transition()
			  	.duration(750)
			      	.call( zoom.transform, d3.zoomIdentity ); // updated for d3 v4
			      }

			      function zoomed() {
			      	transformation = d3.event.transform;
			      	g.attr("transform", d3.event.transform);
			      	netflix_map.selectAll("circle").attr("transform", d3.event.transform);
			      }

			      function stopped() {
			      	if (d3.event.defaultPrevented) d3.event.stopPropagation();
			      }

			      function updateTooltip(map_data){
			      	netflix_map.selectAll("path")
			      	.on("mouseover", function(d) {
			      		d3.select(this)
			      		.style("fill-opacity", 1);
			      		cp_div.transition().duration(300)
			      		.style("opacity", 1);
			      		cp_div.html(`<span style="font-size:20px;font-weight:bold">Country: ${d.properties.name}<br></span><span style="font-size:20px;">Number of shows: ${map_data[d.properties.name]}</span>`).style("visibility", "visible")
			      		.style("left", (d3.event.pageX) + "px")
			      		.style("top", (d3.event.pageY -30) + "px");
			      	})
			      	.on("mouseout", function() {
			      		d3.select(this)
			      		.style("fill-opacity", 0.7);
			      		cp_div.style("visibility", "none").transition().duration(300)
			      		.style("opacity", 0);
			      	});
			      }

			function updateMapIntensity(map_data){ // update legends together too

				var array = Object.values(map_data);
	        	// console.log(array);

	        	var min = getPercentile(array, 1);
	        	var q1 = getPercentile(array, 25);
	        	var mean = getPercentile(array, 50);
	        	var q3 = getPercentile(array, 75);
	        	var max = getPercentile(array, 99);

	        	var color_domain = [min, q1, mean, q3, max];
	        	// console.log(color_domain)

				// set map fill color
				var cp_color = d3.scaleThreshold()
				.range(d3.schemeOrRd[6])
				.domain(color_domain);

	            // set color
	            netflix_map.selectAll('path')
	            .transition().duration(500)
	            .attr("fill", function(d) {
	            	if(map_data[d.properties.name]){
	            		return cp_color(map_data[d.properties.name]);
	            	}
	            	else{
	            		return cp_color(0);
	            	}
	            });

	        	// color legend
	        	var legend_labels = [];
	        	var ext_color_domain = [];
	        	ext_color_domain.push(0);

	        	for(var i=0; i<color_domain.length; i++){
	        		ext_color_domain.push(color_domain[i]);
	        	}

	        	for(var i=0; i<color_domain.length; i++){
	        		if(i==0)
	        			legend_labels.push("< " + color_domain[i]);
	        		else
	        			legend_labels.push((parseInt(color_domain[i-1])+1) + " - " + color_domain[i]);
	        	}
	        	legend_labels.push("> " + color_domain[color_domain.length-1]);
	        	// console.log(legend_labels);

	            // change legend text according to drop down menu
	            netflix_map.selectAll("g.legend").select("text")
	            .transition().duration(500)
	            .on("start", function(){
	            	var t = d3.active(this)
	            	.style("opacity", 0);
	            })
	            .on("end", function(){
	            	netflix_map.selectAll("g.legend").select("text")
	            	.text(function(d, i){ return legend_labels[i]; })
	            	.transition().delay(500).duration(1000)
	            	.style("opacity", 1);
	            });

				// exit and reset data
				netflix_map_legend.selectAll("g.legend").exit();
				netflix_map_legend.selectAll("g").remove();

				//Adding legend for our Choropleth
				var legend = netflix_map_legend.selectAll("g.legend")
				.data(ext_color_domain)
				.enter().append("g")
				.attr("class", "legend");

				var ls_w = 25, ls_h = cp_height/10, n = 6;

				legend.append("rect")
				.attr("x", 20)
				.attr("y", function(d, i){ return ls_h*i+50;})
				.attr("width", ls_w)
				.attr("height", ls_h)
				.style("fill", function(d, i) { return cp_color(d); })
				.style("opacity", 0.7);

				legend.append("text")
				.attr("x", 50)
				.attr("y", function(d, i){ return ls_h*i+60+ls_h/2;})
				.text(function(d, i){ return legend_labels[i]; });

				netflix_map_legend.append("g")
				.attr("class", "title")
				.append("text")
				.attr("x", 20)
				.attr("y", parseInt(30))
				.text("No. of shows:");
			}

			//get any percentile from an array
			function getPercentile(data, percentile) {
				data.sort(numSort);
				var index = (percentile/100) * data.length;
				var result;
				if (Math.floor(index) == index) {
					result = (data[(index-1)] + data[index])/2;
				}
				else {
					result = data[Math.floor(index)];
				}
				if (result==0){
					result = 1;
				}
				return result;
			}

			// because .sort() doesn't sort numbers correctly
			function numSort(a,b) { 
				return a - b; 
			}
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
	        .text("Genre");

      		updateBarchart(preprocessed_data);

      		function preprocess_barchart(data){

      			var barchart_array = [];
	  			data.forEach(function(d) {
	  				if(d.country_txt == global_country){
	  					temp_dict = {}
	  					temp_dict["rating"] = d.rating;
	  					temp_dict["count"] = +d.count;
	  					barchart_array.push(temp_dict);
	  				}
	  				else{
	  					temp_dict = {}
	  					temp_dict["rating"] = d.rating;
	  					temp_dict["count"] = +d.count;
	  					barchart_array.push(temp_dict);
	  				}
	  			});

	      		var groups = _(barchart_array).groupBy('rating');

	      		var barchart_array = _(groups).map(function(g, key) {
	      			return { rating: key, 
	      				count: _(g).reduce(function(m,x) { return m + x.count; }, 0) };
	      			});

	      		return barchart_array;
      		}

      		function updateBarchart(barchart_array){

		      	var x = d3.scaleBand().range([0, bc_width]).padding(0.1);
		      	y = d3.scaleLinear().range([bc_height, 15]);

	      		// make new chart
	        	x.domain(barchart_array.map(function(d){ return d.rating; })); 
	        	y.domain(d3.extent(barchart_array, function(d){ return d.count; })).nice();

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
		        .attr("transform", "translate(250, 5)")
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
	            .attr("x", function(d) { return x(d.rating); })
	            .attr("y", bc_height)  
	        	.attr("width", x.bandwidth()) 
	        	.attr("height", 0)
	        	.on("mouseover", function(d){
	        		d3.select("#text_1")
	        		.html("Rating :  " + d.rating);
	        		d3.select("#text_2")
	        		.html("No. of movies : " + d.count);
	        	})
	        	.transition().delay(250).duration(500)
	            .attr("y", function(d) { return y(d.count); }) 
	            .attr("height", function(d) { return bc_height - y(d.count); }) 
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


	