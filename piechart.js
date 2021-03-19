$(document).ready(function(){

	d3.csv("netflix_durations1.csv", function(error,data){
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
            margin = {top: 200, right: 40, bottom: 40, left: 195};

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

                var tooltip = d3.select("body").append("div").attr("id","tooltip").style("font-size","20px"); 
                // Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
                u
                .enter()
                .append('path')
                .merge(u)
                .on("mousemove", function(d){
                    tooltip
                    .style("visibility", "visible")
                    .html((d.data.value.count) + " shows")
                    .style("top", (d3.event.pageY-60)+"px")
                    .style("left",d3.event.pageX+10+"px");
                })
                .on("mouseout", function (d) { 
                    d3.selectAll("#tooltip").style("visibility", "hidden");
                })
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
		    // var margin = {top: 20, right: 20, bottom: 45, left: 60};
            var margin = {top: 30, right: 30, bottom: 70, left: 60},
            width = 460 - margin.left - margin.right,
            height = 400 - margin.top - margin.bottom;

		    var total_shows = d3.select("#total_tv_shows")
		    .append("svg")
		    .attr("class", "total_shows")
		    .attr("width", "100%")
		    .attr("height", "100%")
            // .attr("width", width + margin.left + margin.right)
            // .attr("height", height + margin.top + margin.bottom)
		    .append("g")
		    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		    var bc_width = $(".total_shows").width() - margin.left - margin.right,
		    bc_height = $(".total_shows").height() - margin.top - margin.bottom;

	        // text label for the x axis title
	        // total_shows.append("g")
	        // .attr("class", "bc_xaxis")
	        // .attr("transform", "translate(" + (bc_width/2 - 20) + " ," + (bc_height + margin.top + 10) + ")")
	        // .append("text")
	        // .text("Duration");

            // Initialize the X axis
            var x = d3.scaleBand()
            .range([ 0, width ])
            .padding(0.2);
            var xAxis = total_shows.append("g")
            .attr("transform", "translate(0," + height + ")")
            // .selectAll("text")
            // .attr("y", 0)
            // .attr("x", 9)
            // .attr("dy", ".35em")
            // .attr("transform", "rotate(90)")
            // .style("text-anchor", "start");

            // Initialize the Y axis
            var y = d3.scaleLinear()
            .range([ height, 0]);
            var yAxis = total_shows.append("g")
            .attr("class", "myYaxis")

            var preprocessed_data = preprocess_totalshows(data);
      		updateTotalShows(preprocessed_data);

      		function preprocess_totalshows(data){

      			var totalshows_array1 = [];
                var totalshows_array2 = [];
	  			data.forEach(function(d) {
	  				if(d.type == "TV Show"){
	  					temp_dict = {}
	  					temp_dict["duration"] = d.duration;
	  					temp_dict["count"] = +d.count;
	  					totalshows_array1.push(temp_dict);
	  				}
	  				else{
	  					temp_dict2 = {}
	  					temp_dict2["duration_bin"] = d.duration_bin;
	  					temp_dict2["count"] = +d.count;
	  					totalshows_array2.push(temp_dict2);
	  				}
	  			});

	      		var groups = _(totalshows_array2).groupBy('duration_bin');

	      		var totalshows_array2 = _(groups).map(function(g, key) {
	      			return { duration_bin: key, 
	      				count: _(g).reduce(function(m,x) { return m + x.count; }, 0) };
	      			});

                      
	      		return totalshows_array2;
      		}

      		function updateTotalShows(totalshows_array){
                // X axis
                x.domain(totalshows_array.map(function(d) { return d.duration_bin; }))
                xAxis.transition().duration(1000).call(d3.axisBottom(x))
                .selectAll("text")
                .attr("transform", "translate(-10,10)rotate(-45)")
                .style("text-anchor", "end")
                // .style("font-size", 20)
                .style("fill", "#69a3b2")

                // Add Y axis
                // y.domain([0, d3.max(totalshows_array, function(d) { return +d[countDuration] }) ]);
                y.domain(d3.extent(totalshows_array, function(d){ return d.count; })).nice();
                yAxis.transition().duration(1000).call(d3.axisLeft(y));

                // variable u: map data to existing bars
                var u = total_shows.selectAll("rect")
                .data(totalshows_array)

                // update bars
                u
                .enter()
                .append("rect")
                .merge(u)
                .transition()
                .duration(1000)
                .attr("x", function(d) { return x(d.duration_bin); })
                .attr("y", function(d) { return y(d.count); })
                .attr("width", x.bandwidth())
                .attr("height", function(d) { return height - y(d.count); })
                .attr("fill", "#69b3a2")
		    }

            // updateTotalShows('count')

		    this.updatets = function(data){
		    	var totalshows_array = preprocess_totalshows(data);
      			updateTotalShows(totalshows_array);
			}  
			return this;
      	}
    }); //end of d3.csv         
})// end of document ready