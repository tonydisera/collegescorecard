function histogram() {
  var margin = { top: 20, right: 20, bottom: 30, left: 40 },
    width = 400,
    height = 400,
    innerWidth = width - margin.left - margin.right,
    innerHeight = height - margin.top - margin.bottom,
    xValue = function(d) {
      return d[0];
    };

  var x = null;
  var y = null;

  var rankDescending = false;

  var bins = null;
  var data = null;
  var container = null;

  var showAxis = true;

  var outline = function(names) {

    let selectedData = data.filter(function(d) {
      return names.indexOf(d.name) >= 0;
    })

    container.selectAll("rect").attr("class", "");

    let matchedBins = bins.filter(function(bin) {
      let matchingElements = selectedData.filter(function(d) {
        if (xValue(d) >= bin.x0 && xValue(d) < bin.x1) {
          return true;
        } else {
          return false;
        }
      })
      return matchingElements.length > 0;
    })
    let selectedBins = container.selectAll("rect").filter(function(bin) {
      let matches = matchedBins.filter(function(targetBin) {
        if (bin.x0 == targetBin.x0 && bin.x1 == targetBin.x1) {
          return true;
        } else {
          return false;
        }
      })
      return matches.length > 0;
    })
    selectedBins.attr("class", "highlight")

  }

  function highlight(names) {

    names.forEach(function(name) {
      let selectedData = data.filter(function(d) {
        return name == d.name;
      })



      let matchedBins = bins.filter(function(bin) {
        let matchingElements = selectedData.filter(function(d) {
          if (xValue(d) >= bin.x0 && xValue(d) < bin.x1) {
            return true;
          } else {
            return false;
          }
        })
        return matchingElements.length > 0;
      })

      let yPos = height - margin.top - margin.bottom;
      let xPos = 0;
      if (matchedBins.length > 0) {
        let theBin = matchedBins[0];
        xPos = x(theBin.x0) - ((x(theBin.x1) - x(theBin.x0))/2);
      } else {
        xPos = x(xValue(selectedData[0]));
      }



      let markers = container.select("svg .markers")


      //markers.select("line")
      // .attr("y2", yPos)
      // .attr("opacity", 1)

      markers.select("circle")
       .attr("cy", yPos)
       .attr("opacity", 1)

      markers.select("text")
       .attr("y", 0)
       .text(xValue(selectedData[0]))
       .attr("opacity", 1)

      markers.selectAll("line")
             .transition()
             .duration(1000)
             .attr("x1", xPos)
             .attr("x2", xPos)
      markers.selectAll("circle")
             .transition()
             .duration(1000)
             .attr("cx", xPos)
      markers.selectAll("text")
             .transition()
             .duration(1000)
             .attr("x", xPos < 16 ? 16 : xPos)
    
    })

  }

  function removeHighlight() {
    container.selectAll("svg .markers .marker").attr("opacity", 0);
    container.selectAll("svg .markers .marker-label").attr("opacity", 0);
  }



  function chart(selection) {
    selection.each(function(theData) {

      container = selection;

      data = theData

      let dataValues = data.filter(function(d) {
        return xValue(d);
      })
      .map(function(d) {
        return +xValue(d);
      })

      innerHeight = height - margin.top - margin.bottom;
      innerWidth = width - margin.left - margin.right;

      x = d3.scaleLinear()
        .domain(d3.extent(dataValues))

      if (rankDescending) {
        x.range([innerWidth, 0])

      } else {
        x.range([0, innerWidth])

      }

      bins = d3.histogram()
          .domain(x.domain())
          .thresholds(x.ticks(20))(dataValues)

      y = d3.scaleLinear()
        .domain([0, d3.max(bins, d => d.length)]).nice()
        .range([innerHeight, 0])

      // Select the svg element, if it exists.
      let svg = d3
        .select(this)
        .selectAll("svg")
        .data([bins]);

      // Otherwise, create the skeletal chart.
      var svgEnter = svg.enter().append("svg");
      var gEnter = svgEnter.append("g");
      gEnter.append("g").attr("class", "x axis");
      gEnter.append("g").attr("class", "y axis");

      // Update the outer dimensions.
      svg
        .merge(svgEnter)
        .attr("width", width)
        .attr("height", height);

      // Update the inner dimensions.
      var g = svg
        .merge(svgEnter)
        .select("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      if (showAxis) {
        svg
          .merge(svgEnter)
          .select(".x.axis")
          .attr("transform", "translate(0," + innerHeight + ")")
          .call(d3.axisBottom(x));

        svg
          .merge(svgEnter)
          .select(".y.axis")
          .call(d3.axisLeft(y))
          .append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", 6)
          .attr("dy", "0.71em")
          .attr("text-anchor", "end")
          .text("Frequency");

      }

      var bars = g.selectAll(".bar").data(function(d) {
        return d;
      });

      bars.enter()
         .append("rect")
         .attr("x", d => {
            if (rankDescending) {
              return x(d.x1)
            } else {
              return x(d.x0)
            }
         })
         .attr("width", d => {
            return Math.max(0, Math.abs(x(d.x1) - x(d.x0)));
         })
         .attr("y", d => y(d.length))
         .attr("height", d => y(0) - y(d.length));

      bars.exit().remove();


      container.selectAll("svg .markers").remove();
      container.select("svg")
               .append("g")
               .attr("class", "markers")
               .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
      let markers = container.select("svg .markers");
      
      markers.append("line")
       .attr("class", "marker")
       .attr("x1", 0)
       .attr("x2", 0)
       .attr("y1", 0)
       .attr("y2", 0)
       .attr("opacity", 0)

      markers.append("circle")
       .attr("class", "marker")
       .attr("cx", 0)
       .attr("cy", 0)
       .attr("r", "3")
       .attr("opacity", 0)

      markers.append("text")
       .attr("class", "marker-label")
       .attr("x", 0)
       .attr("y", -2)
       .style("text-anchor", "middle")
       .attr("opacity", 0)



    });
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

  chart.highlight = function(_) {
    if (!arguments.length) return highlight;
    highlight = _;
    return chart;
  };

  chart.removeHighlight = function(_) {
    if (!arguments.length) return removeHighlight;
    removeHighlight = _;
    return chart;
  };

  chart.showAxis = function(_) {
    if (!arguments.length) return showAxis;
    showAxis = _;
    return chart;
  };

  chart.rankDescending = function(_) {
    if (!arguments.length) return rankDescending;
    rankDescending = _;
    return chart;
  };
  return chart;
}