$(document).ready(function(){

	d3.csv("netflix_titles.csv", function(error,data){
		if (error)  throw error;

		var year1 = 1970, year2 = 2016;
		var global_country = "global";

        // console.log(data.director);

		var bubblechart = bubblechart(data);


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
	    	var tooltip = d3.select("#bubblechart").append("div")
	    	.attr("id","tooltip").style("font-size","20px");
	    	var svg = d3.select("#bubblechart")
	    	.append("svg")
	    	.attr("width", "100%")
	    	.attr("height", "100%")
	    	.attr("class", "bubble");  

	    	var height = $("#bubblechart").height() , width = $("#bubblechart").width();

	    	var color = d3.scaleOrdinal(d3.schemeCategory20c);  

	    	var df = preprocess(data);

	    	var pack = d3.pack(df)
	    	.size([width-5, height-5])
	    	.padding(1.5);  

	    	draw(df);

	    	function draw(df){
            	// Draw 20 bubbles but only show top 5 text in bubble
            	df.children = df.children.slice(0,20);
            	var top10 = _.map(df.children.slice(0,20), function(d){
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


	