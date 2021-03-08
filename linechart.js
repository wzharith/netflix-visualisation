var margin = {top: 80, right: 80, bottom: 80, left: 80},
    width = 1200 - margin.left - margin.right,
    height = 700 - margin.top - margin.bottom;

var parse = d3.timeParse("%Y-%m");

// Scales and axes. Note the inverted domain for the y-scale: bigger is up!
var x = d3.scaleTime().range([0, width]),
    y = d3.scaleLinear().range([height, 0]),
    xAxis = d3.axisBottom(x).tickSize(-height),
    yAxis = d3.axisLeft(y).tickArguments(4);

// An area generator, for the light fill.
var area = d3.area()
    .curve(d3.curveMonotoneX)
    .x(function(d) { return x(d.date); })
    .y0(height)
    .y1(function(d) { return y(d.title); });

// A line generator, for the dark stroke.
var line = d3.line()
    .curve(d3.curveMonotoneX)
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.title); });

//data = d3.csvParse(d3.select("pre#data").text());
d3.csv("group.csv", function(error, data) {

  // format the data
  data.forEach(function(d) {
      d = type(d);
  });

  console.log(data);
//   console.log(parse(data.date));

  // Filter to one symbol; the S&P 500.
  var values = data.filter(function(d) {
    return d.type == "TV Show";
  });

  var msft = data.filter(function(d) {
    return d.type == "Movie";
  });

  // Compute the minimum and maximum date, and the maximum price.
  x.domain([values[0].date, values[values.length - 1].date]);
  y.domain([0, d3.max(msft, function(d) { return d.title; })]).nice();

//   console.log(d3.max(values, function(d) { return d.title; }));
  console.log(values[0].date);
  console.log(x.domain());
  console.log(y.domain());

  // Add an SVG element with the desired dimensions and margin.
  var svg = d3.select("#linechart")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
      

  // Add the clip path.
  svg.append("clipPath")
      .attr("id", "clip")
    .append("rect")
      .attr("width", width)
      .attr("height", height);

  // Add the x-axis.
  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  // Add the y-axis.
  svg.append("g")
      .attr("class", "y axis")
      .attr("transform", "translate(" + width + ",0)")
      .call(yAxis);

  var tooltip = d3.select("#linechart").append("div")
	    	.attr("id","tooltip").style("font-size","20px");    
  var colors = d3.scaleOrdinal(d3.schemeCategory10);
  svg.selectAll('.line')
    .data([values, msft])
    .enter()
      .append('path')
        .attr('class', 'line')
        .style('stroke', function(d) {
          return colors(Math.random() * 50);
        })
        .attr('clip-path', 'url(#clip)')
        .attr('d', function(d) {
          return line(d);
        })
        .on("mousemove", function(d,i){
          console.log(d[i].type)
          d3.select(this).style("stroke-width", 4);
          tooltip.style("visibility", "visible")
          .html(`<b>${d[i].type}</b>`)
          .style("top", (d3.event.pageY-60)+"px")
          .style("left",d3.event.pageX+10+"px");
        })
        .on("mouseout", function (d) { 
          d3.select(this).style("stroke-width", 2);
          d3.selectAll("#tooltip").style("visibility", "hidden");
        })

  // var legend = svg.selectAll('g')
  //               .data([values, msft])
  //               .enter()
  //               .append('g')
  //               .attr('class', 'legend');
    
  // legend.append('rect')
  //     .attr('x', width - 20)
  //     .attr('y', function(d, i){ return i *  20;})
  //     .attr('width', 10)
  //     .attr('height', 10)
  //     .style('fill', function(d) { 
  //       return color(d.type);
  //     });
      
  // legend.append('text')
  //     .attr('x', width - 8)
  //     .attr('y', function(d, i){ return (i *  20) + 9;})
  //     .text(function(d){ return d.type; });
        
  /* Add 'curtain' rectangle to hide entire graph */
  var curtain = svg.append('rect')
    .attr('x', -1 * width)
    .attr('y', -1 * height)
    .attr('height', height)
    .attr('width', width)
    .attr('class', 'curtain')
    .attr('transform', 'rotate(180)')
    .style('fill', '#ffffff');
    
  /* Optionally add a guideline */
  var guideline = svg.append('line')
    .attr('stroke', '#333')
    .attr('stroke-width', 0)
    .attr('class', 'guide')
    .attr('x1', 1)
    .attr('y1', 1)
    .attr('x2', 1)
    .attr('y2', height)
    
  /* Create a shared transition for anything we're animating */
  var t = svg.transition()
    .delay(750)
    .duration(6000)
    .ease(d3.easeLinear)
    .on('end', function() {
      d3.select('line.guide')
        .transition()
        .style('opacity', 0)
        .remove()
    });
  
  t.select('rect.curtain')
    .attr('width', 0);
  t.select('line.guide')
    .attr('transform', 'translate(' + width + ', 0)')

  d3.select("#show_guideline").on("change", function(e) {
    guideline.attr('stroke-width', this.checked ? 1 : 0);
    curtain.attr("opacity", this.checked ? 0.75 : 1);
  })

});

// Parse dates and numbers. We assume values are sorted by date.
function type(d) {
  d.date = parse(d.date);
  d.title = +d.title;
  return d;
}