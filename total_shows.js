$(document).ready(function(){

	d3.csv("netflix_durations1.csv", function(error,data){
		if (error)  throw error;

		var global_country = "global";

        var total_tv_shows = newTotalShows();

	  	function update_othercharts(country){
	//   		global_country = country;
	//   		var temp = data.filter(a => (a.country == global_country));
	// 		// total_tv_shows.updatets(temp);
		}

		function reset_all_charts(){
	// 		global_country = "global";
			total_tv_shows.update(data);
		}

        // total_tv_shows --------------------------------------------------------------------------------------------------------------------------------------------------------

        function newTotalShows2(data){

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
                        // totalshows_array.push(temp_dict);
                    }
                    else{
                        temp_dict2 = {}
                        temp_dict2["duration_bin"] = d.duration_bin;
                        temp_dict2["count"] = +d.count;
                        totalshows_array.push(temp_dict2);
                    }
                });

                var groups = _(totalshows_array).groupBy('duration_bin');

                var totalshows_array = _(groups).map(function(g, key) {
                    return { duration_bin: key, 
                        count: _(g).reduce(function(m,x) { return m + x.count; }, 0) };
                    });

                return totalshows_array;
            }

            function updateTotalShows(totalshows_array){

                var x = d3.scaleBand().range([0, bc_width]).padding(0.1);
                y = d3.scaleLinear().range([bc_height, 15]);

                // make new chart
                x.domain(totalshows_array.map(function(d){ return d.duration_bin; })); 
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
                .attr("x", function(d) { return x(d.duration_bin); })
                .attr("y", bc_height)  
                .attr("width", x.bandwidth()) 
                .attr("height", 0)
                .on("mouseover", function(d){
                    d3.select("#text_1a")
                    .html("Duration:  " + d.duration_bin);
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

        function newTotalShows(){
            var tvshows = [
                {duration: "1 Season", counts: 1608},
                {duration: "2 Seasons", counts: 382},
                {duration: "3 Seasons", counts: 184},
                {duration: "4 Seasons", counts: 87},
                {duration: "5 Seasons", counts: 58},
                {duration: "6 Seasons", counts: 30},
                {duration: "7 Seasons", counts: 19},
                {duration: "8 Seasons", counts: 18},
                {duration: "9 Seasons", counts: 8},
                {duration: "10 Seasons", counts: 6},
                {duration: "11 Seasons", counts: 3},
                {duration: "12 Seasons", counts: 2},
                {duration: "13 Seasons", counts: 2},
                {duration: "15 Seasons", counts: 2},
                {duration: "16 Seasons", counts: 1}
            ];

            var movies = [
                {duration: "0 - 60 mins", counts: 420},
                {duration: "60 - 90 mins", counts: 1233},
                {duration: "90 - 95 mins ", counts: 636},
                {duration: "95 - 120 mins", counts: 2031},
                {duration: "120 - 150 mins", counts: 815},
                {duration: "150 - 300 mins", counts: 242}
            ];

            // set the dimensions and margins of the graph
            var margin = {top: 30, right: 30, bottom: 70, left: 60},
            width = 460 - margin.left - margin.right,
            height = 400 - margin.top - margin.bottom;

            // append the svg object to the body of the page
            var svg = d3.select("#total_tv_shows")
            .append("svg")
            .attr("width", "100%")
            .attr("height", "94%")
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

            // Initialize the X axis
            var x = d3.scaleBand()
            .range([ 0, width ])
            .padding(0.2);
            var xAxis = svg.append("g")
            .attr("transform", "translate(0," + height + ")")

            // Initialize the Y axis
            var y = d3.scaleLinear()
            .range([ height, 0]);
            var yAxis = svg.append("g")
            .attr("class", "myYaxis")


            // A function that create / update the plot for a given variable:
            function update(data) {

                // Update the X axis
                x.domain(data.map(function(d) { return d.duration; }))
                xAxis.call(d3.axisBottom(x))
                .selectAll("text")
                    .attr("transform", "translate(-10,10)rotate(-45)")
                    .style("text-anchor", "end")
                    // .style("fill", "#69a3b2")

                // Update the Y axis
                y.domain([0, d3.max(data, function(d) { return d.counts }) ]);
                yAxis.transition().duration(1000).call(d3.axisLeft(y));

                // Create the u variable
                var u = svg.selectAll("rect")
                .data(data)

                u
                .enter()
                .append("rect") // Add a new rect for each new elements
                .merge(u) // get the already existing elements as well
                .transition() // and apply changes to all of them
                .duration(1000)
                    .attr("x", function(d) { return x(d.duration); })
                    .attr("y", function(d) { return y(d.counts); })
                    .attr("width", x.bandwidth())
                    .attr("height", function(d) { return height - y(d.counts); })
                    .attr("fill", "firebrick")
                    .attr("opacity", 0.8)

                // If less group in the new dataset, I delete the ones not in use anymore
                u
                .exit()
                .remove()
            }

            // Initialize the plot with the first dataset
            update(tvshows)
            
            this.update = function(data){
                // if (data == movies){
                //     update(movies);
                // }
                // else{
                //     update(tvshows);
                // }
                update(movies)
            }
        }

    }); //end of d3.csv         
})// end of document ready