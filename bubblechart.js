$(document).ready(function(){

	d3.csv("netflix_titles.csv", function(error,data){
		if (error)  throw error;

		var year1 = 1970, year2 = 2016;
		var global_country = "global";

        // console.log(data.director);

		var waynebubble = bubblechart(data);

	  	function update_othercharts(country){
	  		global_country = country;
	  		var temp = data.filter(a => (a.country_txt == global_country));
			waynebubble.updatebubble(temp);
		}

		function reset_all_charts(){
			waynebubble.updatebubble(data);
		}

		function update_data_year(year_1, year_2){
			var temp = data;
			if (global_country != "global"){
	  			temp = temp.filter(a => (a.country_txt == global_country));
			}
			year1 = year_1;
			year2 = year_2;
			temp = temp.filter(a => $.inArray(a.iyear, _.range(year1,year2+1)) > -1);
			sankeygraph.updates(temp);
			stream.update(temp);
			bubbleaxisgraph.updatess(temp);
			waynebubble.updatebubble(temp);
			barchart.updatebc(temp);
		}

		function sankey(raw_data){
			var preprocess_sankey = function(raw_data){
				// Map data from master dataset
				var data = _.map(raw_data, function(d){
					return {
						terrorist_group: d.gname,
						target_type: d.targtype1_txt
					}
				});

				// Filter data by top 10 of terrorist group based on their total number of attacks
				// Count frequency of occurrence
				var temp = _.countBy(data.map(g => g.terrorist_group)) 
				// data = data.filter(d => $.inArray(d.terrorist_group, temp) > -1)

				data = d3.nest()
				.key(function(d){return d.terrorist_group})
				.key(function(d){return d.target_type})
				.rollup(function(d){ return d.length })
				.entries(data)
				.filter(d => d.key != "Unknown")
				.sort((a,b) => temp[b.key]-temp[a.key]).splice(0,10);


				// We'll be using terrorist group data and their target type
				var terrorist_group = _.unique(data.map(g => g.key));

				// create links for sankey
				var links = [];
				_.each(data, function(d){
				    _.each(d.values, function(p){
						links.push({"source":d.key, "target":p.key, "value":p.value})
				    })
				})

				// Filter top 7 links, showing all is too messy.
				var filtered_target = d3.nest().key(function(d){ return d.target;})
					.rollup(function(d){ return d3.sum(d, function(p){ return p.value; });})
					.entries(links).sort((a,b) => b.value-a.value).splice(0,7).map(a => a.key)
				links = links.filter(d => $.inArray(d.target, filtered_target) > -1);

				// create nodes for sankey
				// Filter nodes accordingly
				var nodes = terrorist_group.concat(filtered_target).map(function(d){
					return {
						"name" : d
					}
				});

				var graph = {"nodes":nodes, "links":links};
				var nodeMap = {};
				graph.nodes.forEach(function(x) { nodeMap[x.name] = x; });
				graph.links = graph.links.map(function(x) {
					return {
						source: nodeMap[x.source],
						target: nodeMap[x.target],
						value: x.value
					};
				});

				return {"terrorist_group":terrorist_group,"sankey_graph":graph}
			}

			var t = d3.transition()
			.duration(750)
			.ease(d3.easeLinear)

			// Initialize tooltip
			var tooltip = d3.select("#chart").append("div")
			.attr("id","tooltip").style("font-size","16px");

			// Define dimensions
			var margin = {top: 10, right: 10, bottom: 10, left: 10};

			// Append the svg canvas to the page
			var svg = d3.select("#chart")
			.append("svg")
			.attr("width", "100%")
			.attr("height", "100%")
			.append("g")
			.attr("transform", 
				"translate(" + margin.left + "," + margin.top + ")");

			var width = $("#chart").width() - margin.left - margin.right,
			height = $("#chart").height() - margin.top - margin.bottom;

			var links = svg.append("g").attr("class","links");
			var nodes = svg.append("g").attr("class","nodes");

			var sankey = d3.sankey()
			.nodeWidth(10)
			.nodePadding(10)
			.size([width, height]);

			// Preprocess raw data to sankey format
			var processedData = preprocess_sankey(raw_data);
			var graph = processedData.sankey_graph;
			var terrorist_group = processedData.terrorist_group;

			var updateSankey = function(graph, terrorist_group){
				// console.log(graph);
				// Set the sankey diagram properties
				sankey
				.nodes(graph.nodes)
				.links(graph.links)
				.layout(32);

				sankey.relayout();

				var path = sankey.link();
				// add in the links
				var link = links.selectAll("path")
				.data(graph.links);

				var linkEnter = link.enter().append("path")
				.attr("d", path)
				.attr("class","link")
				.style("stroke-width", function(d) { return Math.max(1, d.dy); })
				.style("stroke-opacity", function(d){
					return d.source.name == terrorist_group[0] ? 0.7 : 0.1
				})
				.classed("selected_sankey", function(d){
					return d.source.name == terrorist_group[0]
				})
				.sort(function(a, b) { return b.dy - a.dy; })
				.on("mousemove", function(d,i){
					if (d3.select(this).classed('selected_sankey')){
						tooltip
						.style("visibility", "visible")
						.html(`<span style="font-size:20px;"><b>${d.source.name}</b><br>${d.value} attacks on ${d.target.name}</b></span>`)
						.style("top", (d3.event.pageY-60)+"px")
						.style("left",(d3.event.pageX+10)+"px");

					}
				})
				.on("mouseout", function (d) { 
					d3.selectAll("#tooltip").style("visibility", "hidden");
				});;

				link
				.classed("selected_sankey", function(d){
					return d.source.name == terrorist_group[0]
				})
				.sort(function(a, b) { return b.dy - a.dy; })
				.transition(t)
				.attr("d",path)
				.style("stroke-width", function(d) { return Math.max(1, d.dy); })
				.style("stroke-opacity", function(d){
					return d.source.name == terrorist_group[0] ? 0.7 : 0.1
				})

				link.exit().remove();

				var node = nodes.selectAll("g")
				.data(graph.nodes)

				var nodeEnter = node.enter().append('g').attr("class", "node")
				.attr("transform", function(d) { 
					return "translate(" + d.x + "," + d.y + ")"; });


				nodeEnter.append("rect")
				.attr("height", function(d) { return d.dy; })
				.attr("width", sankey.nodeWidth())
				.style("fill", "#000")
				.on("mouseover", function(d){
					links.selectAll("path").style("stroke-opacity", function(x){
						return d.name == x.source.name ? 0.7 : (d.name == x.target.name ? 0.7 : 0.1)
					});
					links.selectAll("path").classed("selected_sankey", function(x){
						return d.name == x.source.name || d.name == x.target.name
					});
					tooltip
					.style("visibility", "visible")
					.style("top", (d3.event.pageY-70)+"px")
					.style("left",(d3.event.pageX+10)+"px");
					if( $.inArray(d.name, terrorist_group) > -1){
						tooltip.html(`<span style="font-size:20px;"><b>${d.name}</b></span><br><span style="font-size:25px;">Attack Count: ${d.value}</span>`)
					}else{
						tooltip.html(`<span style="font-size:20px;"><b>${d.name}</b></span><br><span style="font-size:25px;">Attacked Count: ${d.value}</span>`)
					}

				})
				.on("mouseout", function (d) { 
					d3.selectAll("#tooltip").style("visibility", "hidden");
				});

				node.select('rect')
				.transition(t)
				.attr("height", function(d) { return d.dy; })

				nodeEnter.append("text")
				.attr("x", -6)
				.attr("y", function(d) { return d.dy / 2; })
				.attr("dy", ".35em")
				.attr("text-anchor", "end")
				.attr("transform", null)
				.text(function(d) { return d.name; })
				.filter(function(d) { return d.x < width / 2; })
				.attr("x", 6 + sankey.nodeWidth())
				.attr("text-anchor", "start");

				node.select("text").transition(t)
				.attr("x", -6)
				.attr("y", function(d) { return d.dy / 2; })
				.attr("dy", ".35em")
				.attr("text-anchor", "end")
				.attr("transform", null)
				.text(function(d) { return d.name; })
				.filter(function(d) { return d.x < width / 2; })
				.attr("x", 6 + sankey.nodeWidth())
				.attr("text-anchor", "start");

				node.exit().remove();
				node.attr("transform", function(d) { 
					return "translate(" + d.x + "," + d.y + ")"; });
			}

			this.updates = function(data){
				var processedData = preprocess_sankey(data);
				var graph = processedData.sankey_graph;
				var terrorist_group = processedData.terrorist_group;
				sankey = d3.sankey()
				.nodeWidth(10)
				.nodePadding(10)
				.size([width, height]);

				updateSankey(graph,terrorist_group);
			}

			updateSankey(graph,terrorist_group);
			return this;
		}

		function bubblechartwithaxis(raw_data){
			var tooltip = d3.select("body").append("div")
             .attr("id","tooltip").style("font-size","20px");
			var color = d3.scaleOrdinal(d3.schemeCategory20);

			var preprocess_bubbleaxis = function(raw_data){
    			var mytarget = ['69','85','86','87','78','71','109','110','111'], 
					dict ={'69' : 'religion','85' : 'religion','86' : 'religion','87' : 'religion','78' : 'religion','71' : 'ethnical','109': 'politic','110': 'politic','111': 'politic',};

				// Map terrorist group data and their target type data
				var data = _.map(raw_data, function(d){
					return {
						terrorist_group: d.gname,
						target_type: d.targtype1_txt,
						year: d.iyear,
						nkill: d.nkill,
						ideology: d.targsubtype1
					}
				});

				// Filter data by only getting top 10 of terrorist group base on their total number of attacks
				var temp = _.countBy(data.map(g => g.terrorist_group))
				var props = Object.keys(temp).map(function(key) {
					return { key: key, value: this[key] };
				}, temp).filter(d => d.key != "Unknown");
				props = props.sort((a,b) => b.value-a.value);
				temp = props.slice(0, 10);

				data = data.filter(d => $.inArray(d.terrorist_group, temp.map(a => a.key)) > -1);
				var terrorist_group = _.unique(data.map(g => g.terrorist_group));
				var year = _.unique(data.map(d=>d.year.toString()));
				
				var group_data = d3.nest().key(function(d) { return d.terrorist_group}).key(function(d){ return d.year; }).entries(data);

				data = []
				_.each(group_data, function(d){
					var y = d.key;
					_.each(d.values, function(a){
						var x = a.key;
						var numz = a.values.map(z=>+z.nkill).reduce((a,b) => a+b,0);
						data.push({y:y,x:x,size: numz})
					})
				});

				return {year:year, terrorist_group:terrorist_group, data:data};
			}

			var processedData_bubbleaxis = preprocess_bubbleaxis(raw_data);

			var margin_left = 300;
			var margin = 40;

			var svg = d3.select('#bubblechart')
			.append('svg')
			.attr('class', 'chart')
			.attr("width", "100%")
			.attr("height", "100%")
			.append("g")
			.attr("transform", "translate(" + margin_left + "," + margin + ")");

			var width = $("#bubblechart").width() - margin_left - margin;
			var height = $("#bubblechart").height() - margin - margin;

			var color =  d3.scaleOrdinal(d3.schemeCategory10);

			var year = processedData_bubbleaxis.year, terrorist_group = processedData_bubbleaxis.terrorist_group;
			var data = processedData_bubbleaxis.data;

			var x = d3.scaleTime()
			.range([0, width]);

			var y = d3.scalePoint()
			.rangeRound([height, 0]);

			var scale = d3.scaleSqrt()
			.range([4, 30]);

			var opacity = d3.scaleSqrt()
			.range([1, .5]);	

			var xAxis = d3.axisBottom().scale(x);
			var yAxis = d3.axisLeft().scale(y);

			svg.append("g")
			.attr("class", "y axis")
			.call(yAxis)
			.append("text")
			.attr("transform", "rotate(-90)")
			.attr("x", 20)
			.attr("y", -margin)
			.attr("dy", ".71em")
			.style("text-anchor", "end");
			
			// x axis and label
			svg.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + height + ")")
			.call(xAxis)
			.append("text")
			.attr("x", width + 20)
			.attr("y", margin - 10)
			.attr("dy", ".71em")
			.style("text-anchor", "end");

			updateBubbleAxisChart(processedData_bubbleaxis);

			function updateBubbleAxisChart(processedData_bubbleaxis){

				var year = processedData_bubbleaxis.year, terrorist_group = processedData_bubbleaxis.terrorist_group;
				var data = processedData_bubbleaxis.data;
				// console.log("bubble axis chart update initiated")
				// console.log(year)
				// console.log(d3.extent(year.map(d=> new Date(d))))
				// console.log(data)

				x.domain(d3.extent(year.map(d=> new Date(d))));
				y.domain(terrorist_group).padding([1]);
				scale.domain(d3.extent(data, function (d) { return d.size; }));
				opacity.domain(d3.extent(data, function (d) { return d.size; }));

				var xAxis = d3.axisBottom().scale(x);
				var yAxis = d3.axisLeft().scale(y);

				svg.select('.x.axis').transition().duration(300).call(xAxis);
				svg.select('.y.axis').transition().duration(300).call(yAxis);

				var circles = svg.selectAll("circle").data(data);

				circles.exit().remove();

				circles.enter()
				.insert("circle")
				.attr("cx", width / 2)
				.attr("cy", height / 2)
				.attr("opacity", function (d) { return opacity(d.size); })
				.attr("r", function (d) { return scale(d.size); })
				.style("fill", "steelblue")
                .on("mousemove", function(d,i){
                	d3.select(this).style("fill", "#E74C3C")
                    tooltip
                    .style("visibility", "visible")
                    .html(`<span style="font-size:25px;font-weight:bold">Year ${d.x}</span><br><b>${d.y}</b><br>Number of kills: ${d.size}`)
                    .style("top", (d3.event.pageY-100)+"px")
                    .style("left",d3.event.pageX+"px");
                })
                .on("mouseout", function (d) { 
                	d3.select(this).style("fill", "steelblue")
                    d3.selectAll("#tooltip").style("visibility", "hidden");
                })
				.transition()
				.delay(function (d, i) { return x(new Date(d.x)) - y(d.y); })
				.duration(500)
				.attr("cx", function (d) { return x(new Date(d.x)); })
				.attr("cy", function (d) { return y(d.y); });

				circles.transition().duration(300)
				.attr("cx", width / 2)
				.attr("cy", height / 2)
				.attr("opacity", function (d) { return opacity(d.size); })
				.attr("r", function (d) { return scale(d.size); })
				.transition()
				.delay(function (d, i) { return x(new Date(d.x)) - y(d.y); })
				.duration(500)
				.attr("cx", function (d) { return x(new Date(d.x)); })
				.attr("cy", function (d) { return y(d.y); });
			} 	

			this.updatess = function(data){
				var processedData_bubbleaxis = preprocess_bubbleaxis(data);
				updateBubbleAxisChart(processedData_bubbleaxis);
			}  
			return this;
		}//end of bubble chart with axis

		function choropleth_andbarchart(data){
			// range slider
			$( function() {
				$( "#slider-range" ).slider({
					range: true,
					min: 1970,
					max: 2016,
					values: [ 1970, 2016 ],
					slide: function( event, ui ) {
						$( "#amount" ).val(ui.values[ 0 ] + " - " + ui.values[ 1 ] );
						change_year(ui.values[ 0 ], ui.values[ 1 ]);
						update_data_year(ui.values[ 0 ], ui.values[ 1 ]);
					}
				});
				$( "#amount" ).val( $( "#slider-range" ).slider( "values", 0 ) +
					" - " + $( "#slider-range" ).slider( "values", 1 ) );
			});

			var transformation;
			var iszoomed = false;
			var circle_radius;
			var selected_year;
			var new_data = data;

			function change_year(min, max) {

				selected_year = _.range(min, max+1, 1);

				// reset and filter data
				var temp = _.filter(data, function (d) {
					return selected_year.indexOf(d.iyear) !== -1; // -1 means not present
				});
				new_data = temp;

				// update color intensity in map
				var map_data = _.countBy(temp, "country_txt");
				updateTooltip(map_data);
				updateMapIntensity(map_data);

				// update crime data in zoomed map
				if(iszoomed){
					updateCrime(temp);
					choropleth.selectAll("circle").attr("transform", transformation);
				}

				temp = [];
			}

			var active = d3.select(null);

			var zoom = d3.zoom()
			.scaleExtent([1,100])
			.on("zoom", zoomed);

			// Create choropleth SVG
			var choropleth = d3.select("#choropleth")
			.append("svg")
			.attr("class", "choropleth")
			.attr("width", "100%")
			.attr("height", "100%")
			.attr("padding-right", '0px');

			// Width and height of the whole visualization
			var cp_width = $("#choropleth").width(),
			cp_height = $("#choropleth").height();

			// Create legend SVG
			var choropleth_legend = d3.select("#choropleth_legend")
			.append("svg")
			.attr("class", "choropleth_legend")
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

			choropleth.append("rect")
			.attr("class", "background")
			.attr("width", cp_width)
			.attr("height", cp_height);

			var g = choropleth.append("g");

			choropleth.call(zoom);

		    data.forEach(function(d) {
		    	if (d.country_txt == "United States")
		    		d.country_txt = "USA";
		    	d.iyear = +d.iyear;
		    	d.latitude = +d.latitude;
		    	d.longitude = +d.longitude;
		    	d.nkill = +d.nkill;
		    	d.nwound = +d.nwound;
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

	       	// choropleth --------------------------------------------------------------------------------------------------------------------------------------------------------

	        // Read Global map
	        d3.json("World_map.json", function(map) {
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
		       	var map_data = _.countBy(data, "country_txt");
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
	  				choropleth.selectAll("circle").remove();

	  				// reset all chart
	  				reset_all_charts();
	  				reset();
	  			}
  				else{
	  				if(iszoomed){
	  					// remove all crime data
	  					choropleth.selectAll("circle").remove();
		  				reset();
		  			}
		  			iszoomed = true;
		  			global_country = d.properties.name;

		  			active.classed("active", false);
		  			active = d3.select(this).classed("active", true);

		      		// reduce opacity of other country
		      		choropleth.selectAll('path')
		      		.transition().duration(1000)
		      		.attr("opacity", 0.3);

		      		var bounds = path.bounds(d),
		      		dx = bounds[1][0] - bounds[0][0],
		      		dy = bounds[1][1] - bounds[0][1],
		      		x = (bounds[0][0] + bounds[1][0]) / 2,
		      		y = (bounds[0][1] + bounds[1][1]) / 2,
		      		scale = Math.max(1, Math.min(8, 0.9 / Math.max(dx / cp_width, dy / cp_height))),
		      		translate = [cp_width / 2 - scale * x, cp_height / 2 - scale * y];

		      		choropleth.transition()
		      		.duration(750)
				      	.call( zoom.transform, d3.zoomIdentity.translate(translate[0],translate[1]).scale(scale) ); // updated for d3 v4

	  				// add crime data
				    addCrime(new_data);
				    update_othercharts(d.properties.name);
				}
			}

			function reset() {
				active.classed("active", false);
				active = d3.select(null);

			  	// reset opacity
			  	choropleth.selectAll('path')
			  	.transition().delay(10)
			  	.attr("opacity", 1);

			  	choropleth.transition()
			  	.duration(750)
			      	.call( zoom.transform, d3.zoomIdentity ); // updated for d3 v4
			      }

			      function zoomed() {
			      	transformation = d3.event.transform;
			      	g.attr("transform", d3.event.transform);
			      	choropleth.selectAll("circle").attr("transform", d3.event.transform);
			      }

			      function stopped() {
			      	if (d3.event.defaultPrevented) d3.event.stopPropagation();
			      }

			      function updateTooltip(map_data){
			      	choropleth.selectAll("path")
			      	.on("mouseover", function(d) {
			      		d3.select(this)
			      		.style("fill-opacity", 1);
			      		cp_div.transition().duration(300)
			      		.style("opacity", 1);
			      		cp_div.html(`<span style="font-size:20px;font-weight:bold">Country: ${d.properties.name}<br></span><span style="font-size:20px;">Number of attack: ${map_data[d.properties.name]}</span>`).style("visibility", "visible")
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
	            choropleth.selectAll('path')
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
	            choropleth.selectAll("g.legend").select("text")
	            .transition().duration(500)
	            .on("start", function(){
	            	var t = d3.active(this)
	            	.style("opacity", 0);
	            })
	            .on("end", function(){
	            	choropleth.selectAll("g.legend").select("text")
	            	.text(function(d, i){ return legend_labels[i]; })
	            	.transition().delay(500).duration(1000)
	            	.style("opacity", 1);
	            });

				// exit and reset data
				choropleth_legend.selectAll("g.legend").exit();
				choropleth_legend.selectAll("g").remove();

				//Adding legend for our Choropleth
				var legend = choropleth_legend.selectAll("g.legend")
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

				choropleth_legend.append("g")
				.attr("class", "title")
				.append("text")
				.attr("x", 20)
				.attr("y", parseInt(30))
				.text("No. of attack:");
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

			function addCrime(data){
				crime_data = data.filter(function(d){ return d.country_txt == global_country; })
				crime_data.sort(function(x, y){ return d3.descending(+x.nkill, +y.nkill); });
				var counter = 0;
				crime_data = crime_data.filter(function(d){ if(counter<100){ counter++; return d; }});
				console.log(crime_data);

				choropleth.selectAll("circle")
				.data(crime_data)
				.enter()
				.append("circle")
				.attr("class", "crime")
					.attr("cx", function(d){return projection([d.longitude, d.latitude])[0];})  
					.attr("cy", function(d){return projection([d.longitude, d.latitude])[1] - 10;}) 
					.style("opacity", 1e-6)
					.style("fill", "steelblue")
					.on("mouseover", function(d) {
			      		d3.select(this)
			      		.style("fill", "brickred");
			      		cp_div.style("visibility", "none");
			      		cp_div.transition().duration(300)
			      		.style("opacity", 1);
			      		cp_div.html(`<span style="font-size:15px;">Terrorist group &emsp; : ${d.gname}</span><br><span style="font-size:15px;">Type of victim &emsp; : ${d.targtype1_txt}</span><br><span style="font-size:15px;">Type of attack &emsp; : ${d.attacktype1_txt}</span><br><span style="font-size:15px;">No of victim killed : ${d.nkill}</span><br><span style="font-size:15px;">No of victim wounded : ${d.nwound}</span>`).style("visibility", "visible")
			      		.style("left", (d3.event.pageX) + "px")
			      		.style("top", (d3.event.pageY -30) + "px");
			      	})
			      	.on("mouseout", function() {
			      		d3.select(this)
			      		.style("fill", "steelblue");
			      		cp_div.style("visibility", "none").transition().duration(300)
			      		.style("opacity", 0);
			      	})
					.transition().delay(1000).duration(500) 
					.attr("cy", function(d){return projection([d.longitude, d.latitude])[1];})
					.attr("r", function(d){ return d.nkill>50? 2:1; })
					.style("opacity", 0.7);
				}

			function updateCrime(data){
				crime_data = data.filter(function(d){ return d.country_txt == global_country; })
				crime_data.sort(function(x, y){ return d3.descending(+x.nkill, +y.nkill); });
				var counter = 0;
				crime_data = crime_data.filter(function(d){ if(counter<100){ counter++; return d; }});

				// update data
				var circle = choropleth.selectAll("circle")
					.data(crime_data)

				var t = d3.transition().duration(500);

				// EXIT old elements not present in new data.
				circle.exit()
				.attr("class", "exit")
				.transition(t)
				.style("opacity", 1e-6)
				.remove();

				if(crime_data.length > 0){
					// UPDATE old elements present in new data.
					circle.attr("class", "crime")
					.attr("cx", function(d){return projection([d.longitude, d.latitude])[0];})
					.attr("cy", function(d){return projection([d.longitude, d.latitude])[1];})
					.attr("r", function(d){ return d.nkill>50? 2:1; })
					.style("opacity", 1e-6)
					.style("fill", "#AF7AC5")
					.transition(t)
					.style("opacity", 0.7);

					// ENTER new elements present in new data.
					circle.enter().append("circle")
					.attr("class", "enter")
					.attr("cx", function(d){return projection([d.longitude, d.latitude])[0];})
					.attr("cy", function(d){return projection([d.longitude, d.latitude])[1];})
					.attr("r", function(d){ return d.nkill>50? 2:1; })
					.on("mouseover", function(d) {
			      		d3.select(this)
			      		.attr("stroke", "grey")
			      		.attr("stroke-wdith", 0.25);
			      		cp_div.style("visibility", "none");
			      		cp_div.transition().duration(300)
			      		.style("opacity", 1);
			      		cp_div.html(`<span style="font-size:15px;">Terrorist group &emsp; : ${d.gname}</span><br><span style="font-size:15px;">Type of victim &emsp; : ${d.targtype1_txt}</span><br><span style="font-size:15px;">Type of attack &emsp; : ${d.attacktype1_txt}</span><br><span style="font-size:15px;">No of victim killed : ${d.nkill}</span><br><span style="font-size:15px;">No of victim wounded : ${d.nwound}</span>`).style("visibility", "visible")
			      		.style("left", (d3.event.pageX) + "px")
			      		.style("top", (d3.event.pageY -30) + "px");
			      	})
			      	.on("mouseout", function() {
			      		d3.select(this)
			      		.attr("stroke", "none");
			      		cp_div.style("visibility", "none").transition().duration(300)
			      		.style("opacity", 0);
			      	})
					.style("opacity", 1e-6)
					.transition(t)
					.style("opacity", 0.7);
				}
			}
	    }

	    function bubblechart(data){
	    	var preprocess = function(data){
	    		var a = []
                var cnt = 0
	    		var df = _.map(data, function(d) {
	    			return {
	    				'director'   : d.director,
	    				'movies' : d.title,
	    			}
	    		}); 
                df1 = d3.nest().key(function(d){ return d.director}).entries(df);
	    		dfcount = d3.nest().key(function(d){ return d.director}).rollup(function(leaves) { return leaves.length; }).entries(df);
                // console.log(df1);
                // console.log(dfcount);    
	    		a.children = _.map(df1, function(d){
	    			var key = d.key;
                    // console.log(key)
	    			// var counts = d.values.map(z => z.movies).reduce((a,b) => a+b,0);
                    var counts = d.values.length;
	    			return { name:key, counts: +counts}
	    		}).filter(d => isNaN(d.name));    
	    		a.children = _.sortBy(a.children,function(d) {
	    			return d.counts;
	    		}).reverse(); 
                console.log(a.children);

	    		return a;
	    	}
	    	var tooltip = d3.select("#waynebubble").append("div")
	    	.attr("id","tooltip").style("font-size","20px");
	    	var svg = d3.select("#waynebubble")
	    	.append("svg")
	    	.attr("width", "100%")
	    	.attr("height", "100%")
	    	.attr("class", "bubble");  

	    	var height = $("#waynebubble").height() , width = $("#waynebubble").width();

	    	var color = d3.scaleOrdinal(d3.schemeCategory20c);  

	    	var df = preprocess(data);

	    	var pack = d3.pack(df)
	    	.size([width-5, height-5])
	    	.padding(1.5);  

	    	draw(df);

	    	function draw(df){
            	// Draw 20 bubbles but only show top 5 text in bubble
            	df.children = df.children.slice(0,20);
            	var top10 = _.map(df.children.slice(0,5), function(d){
            		return d.name;
            	});

		 		// transition
		 		var t = d3.transition()
		 		.duration(750);

		 		var h = d3.hierarchy(df)
		 		.sum(function(d) { return d.counts; });   

		 		var circle = svg.selectAll("circle")
		 		.data(pack(h).leaves(), function(d){ return d.data.name; });

		 		var text = svg.selectAll("text")
		 		.data(pack(h).leaves(), function(d){ return d.data.name; });

          		//EXIT
          		circle.exit()
          		.style("fill", "#b26745")
          		.transition(t)
          		.attr("r", 1e-6)
          		.remove();

          		text.exit()
          		.transition(t)
          		.attr("opacity", 1e-6)
          		.remove();

          		console.log(df.children.length);

          		if(df.children.length > 1){
          			//UPDATE
	                circle
	                .transition(t)
	                .style("fill", function(d){ return color(d); })
	                .attr("r", function(d){ return d.r })
	                .attr("cx", function(d){ return d.x; })
	                .attr("cy", function(d){ return d.y; })

	                text
	                .attr("x", function(d){ return d.x; })
	                .attr("y", function(d){ return d.y; })
	                .text(function(d){ return $.inArray(d.data.name, top10) > -1 ? (d.r == 0 ? "":d.data.name) : ""; })
	                .style("pointer-events","none")
	                .each(wrap)

				      //ENTER
				      circle.enter().append("circle")
				      .attr("r", 1e-6)
				      .attr("cx", function(d){ return d.x; })
				      .attr("cy", function(d){ return d.y; })
				      .style("fill", "#fff")
				      .on("mousemove", function(d,i){
				      	d3.select(this).style("fill", "#E74C3C");
				      	tooltip
				      	.style("visibility", "visible")
				      	.html(`<b>${d.data.name}</b><br>${d.data.counts} movies`)
				      	.style("top", (d3.event.pageY-60)+"px")
				      	.style("left",d3.event.pageX+10+"px");
				      })
				      .on("mouseout", function (d) { 
				      	d3.select(this).style("fill", "steelblue");
				      	d3.selectAll("#tooltip").style("visibility", "hidden");
				      })
				      .transition(t)
				      .style("fill", function(d){ return color(d); })
				      .attr("r", function(d){ return d.r });

				      var mytext = text.enter().append("text")
				      .attr("opacity", 1e-6)
				      .attr("x", function(d){ return d.x; })
				      .attr("y", function(d){ return d.y; })
				      .style("text-anchor", "middle")
				      .text(function(d){ return $.inArray(d.data.name, top10) > -1 ? (d.r == 0 ? "":d.data.name) : ""; })
				      .style("pointer-events","none")
				      .transition(t)
				      .style("fill","#FFF")
				      .attr("opacity", 1).each(wrap);
          		}

			      function wrap(d) {
			      	if ( $.inArray(d.data.name, top10) > -1 && d.r > 0){
			      		var text = d3.select(this),
			      		width = (d.r * 2)-10,
			      		x = d.x,
			      		y = d.y,
			      		words = d.data.name.split(/\s+/),
			      		word,
			      		line = [],
			      		lineNumber = 0,
			      		lineHeight = 1.1;
			      		var tspan = text.text(null).append("tspan").attr("x", x).attr("y", y);
			      		if (words.length > 4){
			      			words = words.splice(0,4);
			      			words.push("...")
			      			words = words.reverse();
			      		}else{
			      			words = words.reverse();
			      		}
			      		if(d.r > 50){
				      		while (word = words.pop()) {
				      			line.push(word);
				      			tspan.text(line.join(" "));
				      			if (tspan.node().getComputedTextLength() > width) {
				      				line.pop();
				      				tspan.text(line.join(" "));
				      				line = [word];
				      				tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + "em").text(word);
				      			}
				      		}
				      	}
			      	}
			      }
			  }

			  this.updatebubble = function(data){
			  	var df = preprocess(data);
			  	draw(df);
			  }
			  return this;
			}




	}); //end of d3.csv         
})// end of document ready


	