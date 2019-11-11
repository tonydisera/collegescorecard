function scatterplot() {
  var margin = { top: 20, right: 20, bottom: 30, left: 40 },
    width = 400,
    height = 400,
    innerWidth = width - margin.left - margin.right,
    innerHeight = height - margin.top - margin.bottom,
    xValue = function(d) {
      return d.x;
    };
    yValue = function(d) {
      return d.y;
    }
    sizeValue = null;
    colorValue = function(d) {
      return d.color;
    }

  var x = null;
  var y = null;
  var radius = null;
  var color = null;
  var sizeRange = [4,4];
  var colorLabels = null;
  var symbolLabels = null;
  var labels = {x: "X", y: "Y", color: "color", "size": "size"}
  let legendBuffer = 10;
  let legendWidth = 140;
  var tooltip = null;
  var tooltipContent = function(d) {
    return d.name + 
         "<br>" + labels.x     + ": " + xValue(d) + 
         "<br>" + labels.y     + ": " + yValue(d) +
         "<br>" + labels.color + ": " + colorValue(d)
  }

  var showQuadrants = false;

  let colorScale = d3.scaleOrdinal(d3.schemeCategory20);

  var outerWidth = null;

  var container = null;
  var data = null;

  var shape = null;

  

  function chart(selection) {
    selection.each(function(theData) {

      container = selection;

      data = theData
      outerWidth = width + legendBuffer + legendWidth;

      innerHeight = height - margin.top - margin.bottom;
      innerWidth =  width - margin.left - margin.right;



      x = d3.scaleLinear()
        .domain(d3.extent(data, d => xValue(d)))
        .range([0, innerWidth])

      y = d3.scaleLinear()
        .domain([0, d3.max(data, d => yValue(d))]).nice()
        .range([innerHeight, 0])

      if (sizeValue) {
        radius = d3.scaleSqrt()
                   .range(sizeRange);       
        radius.domain(d3.extent(data, d => sizeValue(d))).nice();
      } else {
        radius = d3.scaleSqrt()
                   .range(sizeRange ? sizeRange : [3,3])
        radius.domain([0,1])
      }
 

      color = colorScale;  

      // Select the svg element, if it exists.
      let svg = d3
        .select(this)
        .selectAll("svg")
        .data([data]);

      // Otherwise, create the skeletal chart.
      var svgEnter = svg.enter().append("svg");
      var gEnter = svgEnter.append("g");
      gEnter.append("g").attr("class", "x axis");
      gEnter.append("g").attr("class", "y axis");

      // Update the outer dimensions.
      svg
        .merge(svgEnter)
        .attr("class", "scatterplot")
        .attr("width", outerWidth)
        .attr("height", height);

      // Update the inner dimensions.
      var g = svg
        .merge(svgEnter)
        .select("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      svg
        .merge(svgEnter)
        .select(".x.axis")
        .attr("transform", "translate(0," + innerHeight + ")")
        .call(d3.axisBottom(x))
        .append("text")
        .attr("class", "label")
        .attr("x", (innerHeight/2))
        .attr("y",  margin.bottom - 13)
        .attr("dy", "0.71em")
        .attr("text-anchor", "middle")
        .text(labels.x);

      svg
        .merge(svgEnter)
        .select(".y.axis")
        .call(d3.axisLeft(y))
        .append("text")
        .attr("class", "label")
        .attr("transform", "rotate(-90)")
        .attr("x", (innerHeight/2) * -1)
        .attr("y", (margin.left * -1))
        .attr("dy", "0.71em")
        .attr("text-anchor", "middle")
        .text(labels.y);

      var bubbles = g.selectAll(".bubble").data(function(d) {
        return d;
      });


      bubbles.enter()
        .append('path')
        .attr('class', 'bubble')
        .attr('d', 
          d3.symbol()
            .size(function(d) { 
              return radius(sizeValue ? sizeValue(d) : 1) * 10; 
            })
            .type(function(d) { 
              return shape ? shape(d) : d3.symbolCircle;
            })
        )
        .attr('transform',function(d,i){ 
          return "translate(0," + innerHeight + ")";
        })
        .style('fill', function(d){ return color(colorValue(d)); })
        .on("mouseover", function(d) {
          tooltip.transition()
              .duration(200)
              .style("opacity", .9);

          tooltip.html(tooltipContent(d));

          h = tooltip.node().offsetHeight
          w = tooltip.node().offsetWidth

          tooltip
              .style("left", (d3.event.pageX + 2) + "px")
              .style("top", ((d3.event.pageY - h) - 3) + "px");
        })
        .on("mouseout", function(d) {
          tooltip.transition()
                 .duration(200)
                 .style("opacity", 0)
        })

      bubbles.exit().remove();


      g.selectAll(".bubble")
            .transition()
             .duration(1200)
             .ease(d3.easeSin)
             .attr('transform',function(d,i){ 
               return "translate(" + x(xValue(d)) + "," + y(yValue(d)) + ")";
             });
            
             
      container.select(".tooltip").remove();
      tooltip = container.append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);


    
    });
  }


  var drawColorLegend = function() {
    if (!container) {
      return
    }
    if (color.domain().length == 0) {
      return;
    }
    let svg = container.select("svg.scatterplot");
    svg.select(".legend-color").remove();

    svg.append("g")
      .attr("class", "legend-color")
      .attr("transform", "translate(" + (margin.left + innerWidth + legendBuffer) + "," + (margin.top + 10) + ")");

    let legendLabels = [];
    if (colorLabels) {
      color.domain().forEach(function(key) {
        legendLabels.push(colorLabels[key]);
      })
    } else {
      legendLabels = color.domain();
    }

    var legend = d3.legendColor()
        .title(labels.color)
        .titleWidth(110)
        .shapeWidth(20)
        .cells(color.domain().length)
        .labels(legendLabels)
        .orient("vertical")
        .scale(color)

    svg.select(".legend-color")
      .call(legend);
  }


  var drawSizeLegend = function() {
    if (!container) {
      return
    }

    let svg = container.select("svg.scatterplot");
    svg.select(".legend-size").remove();

    svg.append("g")
      .attr("class", "legend-size")
      .attr("transform", "translate(" + (margin.left + innerWidth + legendBuffer) + "," + (margin.top + 160) + ")");


    var legend= d3.legendSize()
      .title(labels.size)
      .titleWidth(80)
      .scale(radius)
      .shape('circle')
      .shapePadding(5)
      .cells(5)
      .orient('vertical');

    svg.select(".legend-size")
       .call(legend);
  }

  drawSymbolLegend = function() {
    if (!container) {
      return
    }
    
    var triangle = d3.symbol().type(d3.symbolTriangle)(),
      circle = d3.symbol().type(d3.symbolCircle)(),
      cross = d3.symbol().type(d3.symbolCross)(),
      diamond = d3.symbol().type(d3.symbolDiamond)(),
      star = d3.symbol().type(d3.symbolStar)();

    let legendKeys = Object.keys(symbolLabels);
    let legendShapes = [];
    let legendLabels = [];
    for (var key in symbolLabels) {
      let theLabel = symbolLabels[key]
      legendShapes.push(d3.symbol().type(theLabel.shape)());
      legendLabels.push(theLabel.name)
    }
    

    var symbolScale =  d3.scaleOrdinal()
      .domain(legendKeys)
      .range(legendShapes);

    let svg = container.select("svg.scatterplot");
    svg.select(".legend-symbol").remove();

    svg.append("g")
      .attr("class", "legend-symbol")
      .attr("transform", "translate(" + (margin.left + innerWidth + legendBuffer) + "," + (margin.top + 160) + ")");


    var legendPath = d3.legendSymbol()
      .scale(symbolScale)
      .titleWidth(80)
      .orient("vertical")
      .labelWrap(30)
      .labels(legendLabels)
      .title(labels.symbol)
      //.on("cellclick", function(d){alert("clicked " + d);});

    svg.select(".legend-symbol")
       .call(legendPath);
  }

  chart.margin = function(_) {
    if (!arguments.length) return margin;
    margin = _;
    return chart;
  };

  chart.width = function(_) {
    if (!arguments.length) return width;
    width = _;
    return chart;
  };

  chart.height = function(_) {
    if (!arguments.length) return height;
    height = _;
    return chart;
  };

  chart.xValue = function(_) {
    if (!arguments.length) return xValue;
    xValue = _;
    return chart;
  };
  chart.yValue = function(_) {
    if (!arguments.length) return yValue;
    yValue = _;
    return chart;
  };
  chart.sizeValue = function(_) {
    if (!arguments.length) return sizeValue;
    sizeValue = _;
    return chart;
  };
  chart.colorValue = function(_) {
    if (!arguments.length) return colorValue;
    colorValue = _;
    return chart;
  }; 
  chart.sizeRange = function(_) {
    if (!arguments.length) return sizeRange;
    sizeRange = _;
    return chart;
  }; 
  chart.drawSizeLegend = function(_) {
    if (!arguments.length) return drawSizeLegend;
    drawSizeLegend = _;
    return chart;
  };   
  chart.drawColorLegend = function(_) {
    if (!arguments.length) return drawColorLegend;
    drawColorLegend = _;
    return chart;
  }; 
  chart.drawSymbolLegend = function(_) {
    if (!arguments.length) return drawSymbolLegend;
    drawSymbolLegend = _;
    return chart;
  };   
  chart.labels = function(_) {
    if (!arguments.length) return labels;
    labels = _;
    return chart;
  };  
  chart.showQuadrants = function(_) {
    if (!arguments.length) return showQuadrants;
    showQuadrants = _;
    return chart;
  };  
  chart.colorLabels = function(_) {
    if (!arguments.length) return colorLabels;
    colorLabels = _;
    return chart;
  };  
  chart.colorScale = function(_) {
    if (!arguments.length) return colorScale;
    colorScale = _;
    return chart;
  };  
  chart.tooltipContent = function(_) {
    if (!arguments.length) return tooltipContent;
    tooltipContent = _;
    return chart;
  };  
  chart.shape = function(_) {
    if (!arguments.length) return shape;
    shape = _;
    return chart;
  }; 
  chart.symbolLabels = function(_) {
    if (!arguments.length) return symbolLabels;
    symbolLabels = _;
    return chart;
  };  
  chart 
  return chart;
}