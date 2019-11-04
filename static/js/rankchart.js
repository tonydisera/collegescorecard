function rankchart() {
  var margin = { top: 10, right: 10, bottom: 30, left: 0 },
    width = 0,
    height = 0,
    innerWidth = width - margin.left - margin.right,
    innerHeight = height - margin.top - margin.bottom,
    xValue = function(d) {
      return d.x;
    };
    yValue = function(d) {
      return d.y;
    }
    colorValue = function(d) {
      return d.color;
    }

  var scales = null;
  var color = null;
  var tooltip = null;
  var tooltipContent = function(d) {
    return d.name + 
         "<br>" + d.name     + ": " + xValue(d);
  }

  var fields = []


  let colorScale = d3.scaleOrdinal(d3.schemeCategory20);

  var outerWidth = null;

  var container = null;
  var data = null;
  var stackedData = null;

  var rowHeight  = 50;
  var barHeight  = 20;
  var colWidth   = 80;
  var colPadding = 20;
  var nameWidth  = 175;


  function chart(selection) {
    selection.each(function(theData) {

      container = selection;

      fields = Object.keys(theData[0]).filter(function(field) {
        return field != "name";
      })

      data = theData;

      scales = fields.map(function(field,i) {
        return d3.scaleLinear()
            .domain([0, d3.max(data, d => d[field])])
            .range([0, colWidth])
      })
      scalesTotal = fields.map(function(field,i) {
        return d3.scaleLinear()
            .domain([0, d3.max(data, d => d[field])])
            .range([0, (colWidth/fields.length)])
      })

      data.forEach(function(d) {
        let total = 0;
        fields.forEach(function(field, fieldIdx) {
          total += scales[fieldIdx](d[field]);
        })
        d._total = total;
      })
      fields.push("_total")
      scales.push( 
        d3.scaleLinear()
            .domain([0, d3.max(data, d => d._total)])
            .range([0, colWidth])
      )
      scalesTotal.push( 
        d3.scaleLinear()
            .domain([0, d3.max(data, d => d._total)])
            .range([0, 0])
      )

      data.sort(function(a,b) {
        return d3.descending(a._total, b._total);
      })

      stackedData = d3.stack()
        .keys(fields)
        (data)

      height = (rowHeight * data.length) + margin.top + margin.bottom;
      width  = ((colWidth+colPadding) * fields.length) + nameWidth + colPadding + margin.left + margin.right;

      innerHeight = height - margin.top - margin.bottom;
      innerWidth =  width - margin.left - margin.right;


      color = colorScale;  

      // Select the svg element, if it exists.
      let svg = d3
        .select(this)
        .selectAll("svg")
        .data([stackedData]);

      // Otherwise, create the skeletal chart.
      var svgEnter = svg.enter().append("svg");
      var gEnter = svgEnter.append("g");


      // Update the outer dimensions.
      svg
        .merge(svgEnter)
        .attr("class", "rankchart")
        .attr("width", width)
        .attr("height", height);

      var g = svg
        .merge(svgEnter)
        .select("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      var rows = g.selectAll(".row").data(data,
      function(d) {
        return d.name
      });

      rows.exit().remove();

      let rowsEnter  = rows.enter()
        .append('g')
        .attr('class', 'row')
        .attr('transform',function(d,i){ 
          return "translate(0,0)";
        })
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

      rowsEnter
        .append("text")
        .attr("x", 0)
        .attr("y", 14)
        .attr("dy", 0)
        .text(function (d,i) {
          return d.name;
        })
        .call(wrap, nameWidth)

      var cols = rowsEnter
        .selectAll(".col").data(function(d,i) {
          return stackedData.map(function(layer, layerIdx) {
            return {layerIdx: layerIdx, scale: scales[layerIdx], scaleTotal: scalesTotal[layerIdx], layer: layer[i]};
          })
        }, function(d,i) {
          return d.name + i
        });

      cols.exit().remove();

      let colsEnter = cols.enter()
        .append('g')
        .attr('class', function(d,i) {
          if (d.layerIdx == fields.length-1) {
            return "col total";
          } else{
            return "col";
          }
        })
        .attr("transform", function(d,i) {
          return "translate(" + (nameWidth+colPadding + (i*(colWidth+colPadding))) + ",0)";
        })

      colsEnter
        .append("rect")
        .attr("class", "bar")
        .attr("x", 0)
        .attr("y", 0)
        .attr("height", barHeight)
        .attr("width", function(d,i) {
          return d.scale(d.layer[1] - d.layer[0]);
        })
        .attr("fill", function(d,i) {
          if (d.layerIdx == fields.length-1) {
            return "white";
          } else {
            return color(d.layerIdx);
          }
        })

      container.selectAll(".col.total")
         .each(function(d,i) {
            colTot = d3.select(this)
            colTot.select("rect").remove(); 

            let record = data[i];
            let theFields = fields.filter(function(field) {
              return fields != "_total"
            })

            let scaledRec = {};
            theFields.forEach(function(field, i) {
              scaledRec[field] = scalesTotal[i](record[field])
            })

            let stacked = d3.stack().keys(theFields)([scaledRec]);

            stacked
            .forEach(function(fieldInfo, fieldIdx) {
              colTot.append("rect")
                .attr("class", "bar")
                .attr("x", function(d,i) {
                  return fieldInfo[0][0]
                })
                .attr("y", 0)
                .attr("height", barHeight)
                .attr("width", function(d,i) {
                  return fieldInfo[0][1] - fieldInfo[0][0];
                })
                .attr("fill", function(d,i) {
                  return color(fieldIdx);
                })
              })
         })
         
        



      g.selectAll(".row")
          .transition()
           .duration(1200)
           .ease(d3.easeSin)
           .attr('transform',function(d,i){ 
             return "translate(0 ," + (rowHeight * i) + ")";
           })

            
             
      container.select(".tooltip").remove();
      tooltip = container.append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);


    
    });
  }


  var wrap = function(text, width) {
    text.each(function() {
      var text = d3.select(this),
          words = text.text().split(/\s+/).reverse(),
          word,
          line = [],
          lineNumber = 0,
          lineHeight = 1.1, // ems
          y = text.attr("y"),
          dy = parseFloat(text.attr("dy")),
          tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em")
      while (word = words.pop()) {
        line.push(word)
        tspan.text(line.join(" "))
        if (tspan.node().getComputedTextLength() > width) {
          line.pop()
          tspan.text(line.join(" "))
          line = [word]
          tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", `${++lineNumber * lineHeight + dy}em`).text(word)
        }
      }
    })
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
  
  chart 
  return chart;
}