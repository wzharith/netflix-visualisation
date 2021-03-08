$(document).ready(function(){

	d3.csv("netflix_titles_mod.csv", function(error,data){
		if (error)  throw error;

		var global_country = "global";

		var dist_shows = dist_shows2(data);
        // var total_tv_shows = newTotalShows(data);

	  	function update_othercharts(country){
	  		global_country = country;
	  		var temp = data.filter(a => (a.country == global_country));
			dist_shows.updatepc(temp);
			// total_tv_shows.updatets(temp);
		}

		function reset_all_charts(){
			global_country = "global";
			dist_shows.updatepc(data);
			// total_tv_shows.updatets(data);
		}

        // dist_shows --------------------------------------------------------------------------------------------------------------------------------------------------------

        function dist_shows2(data){

            // Create pie chart SVG
            var width = 250
            height = 250
            margin = {top: 200, right: 40, bottom: 40, left: 180};

            // The radius of the pieplot is half the width or half the height (smallest one). I subtract a bit of margin.
            var radius = Math.min(width, height) / 2 + 10

            // append the svg object to the div called 'my_dataviz'
            var svg = d3.select("#distribution_of_shows")
            .append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");            

            // Create dummy data
            // var data = {a: 9, b: 20}

            var predata = preprocess_piechart(data);
            updatePieChart(predata);
            console.log(predata);

            function preprocess_piechart(data){

                var piechart_array = [];
                data.forEach(function(d) {
                    temp_dict = {}
                    temp_dict["type"] = d.type;
                    temp_dict["count"] = +d.count;
                    piechart_array.push(temp_dict);
                });

                var groups = _(piechart_array).groupBy('type');

                var piechart_array = _(groups).map(function(g, key) {
                    return { type: key, 
                        count: _(g).reduce(function(m,x) { return m + x.count; }, 0) };
                    });

                return piechart_array;
            }

            function updatePieChart(data){
            
                // set the color scale
                var color = d3.scaleOrdinal()
                // .domain(data)
                .range(["steelblue", "firebrick"])

                // Compute the position of each group on the pie:
                var pie = d3.pie()
                .value(function(d) {return d.value.count; })
                var data_ready = pie(d3.entries(data));

                // The arc generator
                var arc = d3.arc()
                .innerRadius(radius * 0)         // This is the size of the donut hole
                .outerRadius(radius * 0.5)

                // Another arc that won't be drawn. Just for labels positioning
                var outerArc = d3.arc()
                .innerRadius(radius * 0.9)
                .outerRadius(radius * 0.9)

                // Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
                svg
                .selectAll('allSlices')
                .data(data_ready)
                .enter()
                .append('path')
                .transition()
                .duration(1000)
                .attr('d', arc)
                .attr('fill', function(d){ return(color(d.data.key)) })
                .attr("stroke", "white")
                .style("stroke-width", "3px")
                .style("opacity", 1)

                // map to data
                var u = svg.selectAll("path")
                .data(data_ready)

                // Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
                u
                .enter()
                .append('path')
                .merge(u)
                .transition()
                .duration(1000)
                .attr('d', d3.arc()
                    .innerRadius(0)
                    .outerRadius(radius * 0.8)
                )
                .attr('fill', function(d){ return(color(d.data.key)) })
                .attr("stroke", "white")
                .style("stroke-width", "3px")
                .style("opacity", 0.8)

                // Add the polylines between chart and labels:
                svg
                .selectAll('allPolylines')
                .data(data_ready)
                .enter()
                .append('polyline')
                    .attr("stroke", "black")
                    .style("fill", "none")
                    .attr("stroke-width", 1)
                    .attr('points', function(d) {
                    var posA = arc.centroid(d) // line insertion in the slice
                    var posB = outerArc.centroid(d) // line break: we use the other arc generator that has been built only for that
                    var posC = outerArc.centroid(d); // Label position = almost the same as posB
                    var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2 // we need the angle to see if the X position will be at the extreme right or extreme left
                    posC[0] = radius * 0.85 * (midangle < Math.PI ? 1 : -1); // multiply by 1 or -1 to put it on the right or on the left
                    return [posA, posB, posC]
                    })

                // Add the polylines between chart and labels:
                svg
                .selectAll('allLabels')
                .data(data_ready)
                .enter()
                .append('text')
                    .text( function(d) { console.log(d.data.key) ; return d.data.value.type } )
                    .attr('transform', function(d) {
                        var pos = outerArc.centroid(d);
                        var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
                        pos[0] = radius * 0.89 * (midangle < Math.PI ? 1 : -1);
                        return 'translate(' + pos + ')';
                    })
                    .style('text-anchor', function(d) {
                        var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
                        return (midangle < Math.PI ? 'start' : 'end')
                    })

                // // Set up groups
                // var arcs = svg.selectAll("g.arc")
                // .data(data_ready)
                // .enter()
                // .append("g")
                // .attr("class", "arc")
                // .attr("transform", "translate(" + outerRadius + "," + outerRadius + ")")
                // .on("mouseover", function (d) {
                // d3.select("#tooltip2")
                //     .style("left", d3.event.pageX + "px")
                //     .style("top", d3.event.pageY + "px")
                //     .style("opacity", 1)
                //     .select("#value2")
                //     .text(d.data.value);
                // })
                // .on("mouseout", function () {
                
                //     // Hide the tooltip
                // d3.select("#tooltip2")
                //     .style("opacity", 0);;
                // });

                // // Labels
                // arcs.append("text")
                // .attr("transform", function (d) {
                // return "translate(" + arc.centroid(d) + ")";
                // })
                // .attr("text-anchor", "middle")
                // .text(function (d) {
                // return d.data.value.count;
                // });
            }

            this.updatepc = function(data){
                var piechart_array = preprocess_piechart(data);
                updatePieChart(piechart_array);
            }

            return this;
        }

        // total_tv_shows --------------------------------------------------------------------------------------------------------------------------------------------------------

	    function newTotalShows(data){

	    	// Create barchart SVG
		    var margin = {top: 20, right: 20, bottom: 45, left: 60};

		    var total_shows = d3.select("#total_tv_shows")
		    .append("svg")
		    .attr("class", "total_shows")
		    .attr("width", "100%")
		    .attr("height", "100%")
		    .append("g")
		    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		    var bc_width = $(".total_shows").width() - margin.left - margin.right,
		    bc_height = $(".total_shows").height() - margin.top - margin.bottom;

	    	var preprocessed_data = preprocess_totalshows(data);

	        // text label for the x axis title
	        total_shows.append("g")
	        .attr("class", "bc_xaxis")
	        .attr("transform", "translate(" + (bc_width/2 - 20) + " ," + (bc_height + margin.top + 10) + ")")
	        .append("text")
	        .text("Duration");

      		updateTotalShows(preprocessed_data);

      		function preprocess_totalshows(data){

      			var totalshows_array = [];
	  			data.forEach(function(d) {
	  				if(d.type == "TV Show"){
	  					temp_dict = {}
	  					temp_dict["duration"] = d.duration;
	  					temp_dict["count"] = +d.count;
	  					totalshows_array.push(temp_dict);
	  				}
	  				else{
	  					temp_dict2 = {}
	  					temp_dict2["duration"] = d.duration;
	  					temp_dict2["count"] = +d.count;
	  					// totalshows_array.push(temp_dict2);
	  				}
	  			});

	      		var groups = _(totalshows_array).groupBy('duration');

	      		var totalshows_array = _(groups).map(function(g, key) {
	      			return { duration: key, 
	      				count: _(g).reduce(function(m,x) { return m + x.count; }, 0) };
	      			});

	      		return totalshows_array;
      		}

      		function updateTotalShows(totalshows_array){

		      	var x = d3.scaleBand().range([0, bc_width]).padding(0.1);
		      	y = d3.scaleLinear().range([bc_height, 15]);

	      		// make new chart
	        	x.domain(totalshows_array.map(function(d){ return d.duration; })); 
	        	y.domain(d3.extent(totalshows_array, function(d){ return d.count; })).nice();

	        	total_shows.selectAll(".axis.axis--x").remove();

	        	total_shows.append("g")
	        	.attr("class", "axis axis--x")
	        	.attr("transform", "translate(0," + bc_height + ")")
	            .call(d3.axisBottom(x).tickValues(x.domain().filter(function(d,i){ return !(i%5)}))); 
	            total_shows.selectAll(".axis.axis--y").remove();

	            // remove all info window
	            total_shows.selectAll(".infowin2").remove();

	            // text label for the selected barchart text 1
		        total_shows.append("g")
		        .attr("class", "infowin2")
		        .attr("transform", "translate(100, 25)")
		        .append("text")
		        .attr("id", "text_1a");

		        // text label for the selected barchart text 2
		        total_shows.append("g")
		        .attr("class", "infowin2")
		        .attr("transform", "translate(100, 45)")
		        .append("text")
		        .attr("id","text_2a");

	            total_shows.append("g")
	            .attr("class", "axis axis--y")
	            .call(d3.axisLeft(y).ticks(10))
	            .append("text")
	            .attr("transform", "translate(60,0)")
	            .attr("y", 6)
	            .attr("dy", "0")
	            .attr("text-anchor", "end")
	            .text("Number of Shows");

	            total_shows.selectAll(".bar").remove();

	            total_shows.selectAll(".bar")
	            .data(totalshows_array)
	            .enter().append("rect")
	            .attr("class", "bar")
	            .attr("x", function(d) { return x(d.duration); })
	            .attr("y", bc_height)  
	        	.attr("width", x.bandwidth()) 
	        	.attr("height", 0)
	        	.on("mouseover", function(d){
	        		d3.select("#text_1a")
	        		.html("Duration:  " + d.duration);
	        		d3.select("#text_2a")
	        		.html("No. of shows: " + d.count);
	        	})
	        	.transition().delay(250).duration(500)
	            .attr("y", function(d) { return y(d.count); }) 
	            .attr("height", function(d) { return bc_height - y(d.count); }) 
	            .style("opacity", 1);
		    }

		    this.updatets = function(data){
		    	var totalshows_array = preprocess_totalshows(data);
      			updateTotalShows(totalshows_array);
			}  
			return this;
      	}
    }); //end of d3.csv         
})// end of document ready