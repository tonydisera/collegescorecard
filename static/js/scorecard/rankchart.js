function rankchart() {
  var margin = { top: 10, right: 10, bottom: 30, left: 0 },
    width = 0,
    height = 0,
    innerWidth = width - margin.left - margin.right,
    innerHeight = height - margin.top - margin.bottom;
   
  var color = null;
  var tooltip = null;
  var tooltipContent = function(d) {
    return d.name + "<br>" + d.field.name + ": " + d.value
  }

  var fieldDescriptors = [];
  var totalField = null;
  var totalCategoryPadding = 0;
  var totalColWidth = 0;
  var container = null;
  var data = null;
  var stackedData = null;

  var headerHeight  = 70;
  var rowHeight     = 40;
  var barHeight     = 15;
  var colWidth      = 80;
  var colWidthTotal = 300;
  var colPadding    = 10;
  var nameWidth     = 250;
  var categoryPadding = 30;
  var weightHeight    = 14;
  var rowTextHeight   = 10;

  var inverseBarMin = 2;

  let onRescale = function() {

  }

  let onHover = function() {

  }

  let onHoverEnd = function() {

  }

  let onHoverRow = function() {

  }

  let onHoverRowEnd = function() {

  }

  var desaturate = function(color, k = 1) {
    const {l, c, h} = d3.lch(color);
    return d3.lch(l, c - 10 * k, h);
  }

  var setCurrentRow = function(rowElem, field) {
    let y = +rowElem.attr("transform").split(",")[1].split(")")[0]
    let x = 0
    container.select(".current-row")
     .attr("x", x)
     .attr("y", y-(rowHeight/2))
     .attr("width", innerWidth)
     .attr("height", rowHeight)

    container.select(".current-row")
       .transition()
       .duration(500)
       .attr("opacity", 1) 


  }
  var unsetCurrentRow = function(rowElem, field) {
    container.select(".current-row")
       .transition()
       .duration(500)
       .attr("opacity", 0)
  }

  let tc = d3.scaleOrdinal(d3.schemeTableau10);
  let tc_blue   = tc(0); //blue
  let tc_orange = tc(1); // orange
  let tc_red    = tc(2); // red
  let tc_cyan   = tc(3); // cyan
  let tc_green  = tc(4); // green
  let tc_yellow = tc(5); // yellow
  let tc_purple = tc(6); // purple
  let tc_pink   = tc(7); // pink
  let tc_brown  = tc(8); // brown
  let tc_tan    = tc(9); // tran
  let warm_green = "#8ea950"
  var categoryColorMap = {
    'selectivity': warm_green,
    'instruction': tc_blue,
    'diversity':   desaturate(tc_yellow, 1),
    'cost':        tc_cyan,
    'outcome':     desaturate(tc_red,1),
    'rank':        tc_brown,
    'total':       '#ffffff'
  }


  var formatColumnHeader = function(d,i) {
    return d;
  }




  function chart(selection) {
    selection.each(function(theData) {

      container = selection;

      if (fieldDescriptors == null) {
        console.log("rankchart cannot draw chart without fieldDescriptors") 
        return; 
      }   


      data = theData;

      // Scale the data
      scaleData(data)


      // Add a column representing the overall score 
      fieldDescriptors.push(totalField)


      // Calculate the height and width
      height = headerHeight + (rowHeight * data.length) + margin.top + margin.bottom;
      width  = totalColWidth + nameWidth + colPadding + colWidthTotal + totalCategoryPadding + margin.left + margin.right;
      innerHeight = height - margin.top - margin.bottom;
      innerWidth =  width - margin.left - margin.right;


      // Stack the data by the different columns
      let fieldNames = fieldDescriptors.map(function(field) {
        return field.name
      })
      stackedData = d3.stack()
        .keys(fieldNames)
        (data)


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


      // Add the column headers
      g.selectAll(".col-header-row").remove();
      var headerRow = g.selectAll(".col-header-row").data([fieldDescriptors]);
      headerRow.exit().remove();
      let headerRowEnter = headerRow.enter()
        .append("g")
        .attr("class", "col-header-row")

      headerRowEnter
        .append("text")
        .attr("class", "weight-header")
        .attr("x", "0")
        .attr("y", headerHeight-weightHeight-30+12)
        .text("Click to adjust weights >")


      var colHeaders = headerRow
        .merge(headerRowEnter)
        .selectAll(".col-header").data(fieldDescriptors,function(field,i) {
          return field.name + "-" + i + "-" + field.colX;
        });

      colHeaders.exit().remove();
      var colHeadersEnter = colHeaders
        .enter()
        .append("g")
        .attr("class", "col-header")
        .attr("transform", function(field,i) {
          return "translate(" + field.colX + ",0)";
        })
      colHeadersEnter
        .append("text")
        .attr("dx", 0)
        .attr("dy", 0)
        .text(function(d,i) {
          return formatColumnHeader(d.name,i);
        })
        .call(wrap, colWidth +3)

      // Add the weight boxes to the column header
      let weightGroup = colHeadersEnter.selectAll("g.weights")
        .data(function(fieldDescriptor) {
          return [fieldDescriptor.weights];
        })

      weightGroup.exit().remove();

      let weightGroupEnter = weightGroup
        .enter()
        .append("g")
        .attr("transform", "translate(0," + (headerHeight-(weightHeight)-30) + ")")
        .attr("class", "weights")

      let weightRectEnter = weightGroupEnter.selectAll("rect.weight")
        .data(function(weightObject) {
          return weightObject;
        }, function(weightObject) {
          return weightObject.weight;
        })
        .enter()

      weightRectEnter
        .append("rect")
        .attr("class", function(weightObject) {
          if (weightObject.weight <= weightObject.field.currentWeight-1) {
            return "weight selected";
          } else {
            return "weight"
          }
        })
        .attr("x", function(weightObject) {
          return weightObject.weight*weightHeight;
        })
        .attr("y", "0")
        .attr("width", function(weightObject) {
          if (weightObject.field.name != "_total") {
            return weightHeight;
          } else {
            return "0";
          }
        })
        .attr("height", weightHeight)
        .on("click", function(weightObject) {
          weightObject.field.currentWeight = weightObject.weight+1;

          d3.select(d3.select(this).node().parentNode)
            .selectAll("rect")
            .each(function(childWeightObject) {

            d3.select(this).classed("selected", childWeightObject.weight <= weightObject.weight)

          })

          onRescale()

        })

      g.append("rect")
        .attr("class", "current-row")

      // Add the rows
      var rows = g.selectAll(".row").data(data,
      function(d,i) {
        //return d.name + "-" + i + "-" + totalColWidth + "-" + totalCategoryPadding;
        return d.name + "-" + i;
      });

      rows.exit().remove();

      let rowsEnter  = rows.enter()
        .append('g')
        .attr('class', 'row')
        .attr('transform',function(record,i){ 
           return "translate(0," + ((rowHeight * record.position) + headerHeight) + ")";
         })
       

      rowsEnter
        .append("text")
        .attr("y", (rowTextHeight/2))
        .attr("dx", 0)
        .attr("dy", 0)
        .text(function (d,i) {
          return i+1 
        })
       

      rowsEnter
        .append("g")
        .attr("transform", "translate(33,0)")
        .append("text")
        .attr("y", (rowTextHeight/2))
        .attr("dx", 0)
        .attr("dy", 0)
        .text(function (d,i) {
          return d.name
        })

      rowsEnter
       .on("mouseover", function(d) {
          setCurrentRow(d3.select(this), d)
          
        })
        .on("mouseout", function(d) {
          unsetCurrentRow();

        })
       


      // Add the column bars
      var cols = rows
        .merge(rowsEnter)
        .selectAll(".col").data(function(d,i) {
          return stackedData.map(function(layer, layerIdx) {
            let isInverseScale = false;
            let fieldDescriptor = fieldDescriptors[layerIdx];

            return { row: i,
                     layerIdx:          layerIdx, 
                     layer:             layer[i],
                     name:              data[i].name,
                     field:             fieldDescriptor,
                     value:             data[i][fieldDescriptor.name]
                    };
          })
        }, function(d,i) {
          return d.name + "-" + d.field.name + "-" + d.field.width + " " + d.field.colX + "-" + i;
        });

      cols.exit().remove();

      let colsEnter = cols.enter()
        .append('g')
        .attr('class', function(d,i) {
          if (d.layerIdx == fieldDescriptors.length-1) {
            return "col total";
          } else{
            return "col";
          }
        });

      cols.merge(colsEnter)
        .attr("transform", function(d,i) {
          return "translate(" + d.field.colX + ",0)";
        })

      let bars = cols.merge(colsEnter).selectAll(".bar");

      let barsEnter = colsEnter
        .append("rect")
        .attr("class", "bar");

      cols.merge(colsEnter).selectAll(".bar")
        .attr("x", 0)
        .attr("y", (barHeight/2)*-1)
        .attr("height", barHeight)
        .attr("width", function(d,i) {
          if (d.field.name == "_total") {
            return 0;
          } else if (d.value == null) {
            return 0;
          } else if (d.field.rankDescending && (d.layer[1] - d.layer[0] == 0)) {
            return 0;
          } else if (d.field.rankDescending && (d.field.scale(d.layer[1] - d.layer[0]) == 0)) {
            return inverseBarMin;
          } else {
            return d.field.scale(d.layer[1] - d.layer[0]);
          }        
        })
        .attr("fill", function(d,i) {
          return getColor(d.field.category, d.field.categoryIdx);
        })
        /*
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
        */

      // Add the stacked bar showing the overall score for each row
      addTotalBars()

      // Show the transitions, reordering the rows and shrinking/expanding
      // the column bars
      showTransitions(g);        
            
      // Add the tooltip             
      container.select(".tooltip").remove();
      tooltip = container.append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);




    });
  }

  var initFieldDescriptors = function() {
    totalCategoryPadding = 0;
    totalColWidth = 0;
    fieldDescriptors.forEach(function(field,i) {
      if (i > 0 && field.category != fieldDescriptors[i-1].category) {
        totalCategoryPadding += categoryPadding;
      } 
      field.paddingCumulative = totalCategoryPadding;
      field.weights = [0,1,2,3].map(function(weight) {
        return {field: field, weight: weight};
      })
      field.currentWeight = field.currentWeight ? field.currentWeight : 1;
      field.width = colWidth*field.currentWeight;

      field.colX = nameWidth + colPadding + field.paddingCumulative + totalColWidth;

      totalColWidth += field.width;
      totalColWidth += colPadding;
    })
    // Add padding for total
    totalCategoryPadding += categoryPadding;

    // totalField holds the scales for the overall score 
    totalField = {name: '_total', category: 'total', categoryIdx: 0, padding: 0, paddingCumulative: totalCategoryPadding};
    totalField.weights = [];
    totalField.weight = 0;
    totalField.colX = nameWidth + colPadding + totalCategoryPadding + totalColWidth;
    totalField.scale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d._total)])
      .range([0, colWidth])

    totalField.scaleTotal = d3.scaleLinear()
      .domain([0, d3.max(data, d => d._total)])
      .range([0, 0])   

  }

  var scaleData = function(data) {

    // Initialize field descriptors with the x postion, padding, width
    initFieldDescriptors();


    // Set up column scales
    fieldDescriptors.forEach(function(field,i) {
      field.scale = d3.scaleLinear()
          .domain([d3.min(data, d => d[field.name]), d3.max(data, d => d[field.name])])
          .clamp(true)
      if (field.rankDescending) {
        field.scale.range([colWidth * field.currentWeight, 2])
      } else {
        field.scale.range([2, colWidth * field.currentWeight])
      }

      field.scaleTotal = d3.scaleLinear()
          .domain([d3. min(data, d => d[field.name]), d3.max(data, d => d[field.name])])
          .clamp(true)
      if (field.rankDescending) {
        field.scaleTotal.range([(colWidthTotal/fieldDescriptors.length) * field.currentWeight, 2])
      } else {
        field.scaleTotal.range([2, (colWidthTotal/fieldDescriptors.length) * field.currentWeight])
      }

    })

    // Calculate overall score 
    data.forEach(function(d) {
      let total = 0;
      fieldDescriptors.forEach(function(field, fieldIdx) {
        if (field.rankDescending && d[field.name] == null) {
        } else {
          total += field.scale(d[field.name]);
        }
      })
      d._total = total;
    })
    

    // Sort the rows according to the overall score
    data.forEach(function(record, i) {
      record.position = i;
    })
    data.sort(function(a,b) {
      return d3.descending(a._total, b._total);
    })

  }


  var addTotalBars = function() {
    // Add the overall bar (a stacked bar)
    container.selectAll(".col.total")
    .each(function(d,i) {
      colTot = d3.select(this)
      colTot.selectAll("rect").remove(); 

      let record = data[i];
      let theFieldDescriptors = fieldDescriptors.filter(function(field) {
        return field.name != "_total"
      })

      let scaledRec = {};
      theFieldDescriptors.forEach(function(field, i) {
        if (record[field.name] == null) {
          scaledRec[field.name] = 0;

        } else {
          scaledRec[field.name] = field.scaleTotal(record[field.name])

        }
      })

      let theFieldNames = theFieldDescriptors.map(function(field) {
        return field.name;
      })
      let stacked = d3.stack().keys(theFieldNames)([scaledRec]);

      stacked
      .forEach(function(fieldInfo, fieldIdx) {
        let fieldDescriptor = fieldDescriptors[fieldIdx];
        colTot.append("rect")
          .attr("class", "bar-total")
          .attr("x", function(d,i) {
            return fieldInfo[0][0]
          })
          .attr("y", (barHeight/2)*-1)
          .attr("height", barHeight)
          .attr("width", function(d,i) {
            return fieldInfo[0][1] - fieldInfo[0][0];
          })
          .attr("fill", function(d,i) {
            return getColor(fieldDescriptor.category, fieldDescriptor.categoryIdx);
          })
      })
    })
    container.selectAll(".col.total")
      .on("mouseover", function(d) {
         
          onHoverRow(d)
          
      })
      .on("mouseout", function(d) {
 
        onHoverRowEnd(d)

      })

  }

  var showTransitions = function(g) {
    // Transition the rows as the order changes
    g.selectAll(".row")
        .transition()
         .duration(1200)
         .ease(d3.easeSin)
         .attr('transform',function(d,i){ 
           return "translate(0," + ((rowHeight * i) + headerHeight) + ")";
         })

    /*
    g.selectAll(".row .col")
       .transition()
       .duration(1200)
       .ease(d3.easeSin)
       .attr("transform", function(d,i) {
          return "translate(" + d.field.colX + ",0)";
       })
    */

    /*
    g.selectAll(".row .col rect.bar")
     .transition()
     .duration(1200)
     .ease(d3.easeSin)
     .attr("width", function(d,i) {
        if (d.field.rankDescending && (d.layer[1] - d.layer[0] == 0)) {
          return 0;
        } else if (d.field.rankDescending && (d.field.scale(d.layer[1] - d.layer[0]) == 0)) {
          return inverseBarMin;
        } else {
          return d.field.scale(d.layer[1] - d.layer[0]);
        }        
     })
     */

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
      if (words.join(" ") == "score combined") {
        width = colWidthTotal;
      } 
      while (word = words.pop()) {
        line.push(word)
        tspan.text(line.join(" "))
        if (tspan.node().getComputedTextLength() > width) {
          line.pop()
          tspan.text(line.join(" "))
          line = [word]
          tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", `${lineHeight + dy}em`).text(word)
        }
      }
    })
  }

  var getColor = function(category, categoryIdx) {
    let baseColor = categoryColorMap[category];
    if (categoryIdx == 0) {
      return baseColor;
    } else {
      return adjustColor(baseColor, categoryIdx)
    }
  }

  var adjustColor = function(color, k) {
    let multiplier = Math.ceil(k / 2);
    if (multiplier < 1) {
      multiplier = 1;
    }
    if (k % 2 == 0) {
      return darken(color,multiplier)
    } else {
      return lighten(color,multiplier)
    }
  }

  var darken = function(color, k = 1) {
    const {l, c, h} = d3.lch(color);
    return d3.lch(l - 12 * k, c, h);
  }

  var lighten = function(color, k = 1) {
    const {l, c, h} = d3.lch(color);
    return d3.lch(l + 10 * k, c - 15, h);
  }

  var saturate = function(color, k = 1) {
    const {l, c, h} = d3.lch(color);
    return d3.lch(l, c + 6 * k, h);
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
  
  chart.formatColumnHeader = function(_) {
    if (!arguments.length) return formatColumnHeader;
    formatColumnHeader = _;
    return chart;
  }
  chart.fieldDescriptors = function(_) {
    if (!arguments.length) return fieldDescriptors;
    fieldDescriptors = _;
    return chart;
  }
  chart.colWidth = function(_) {
    if (!arguments.length) return colWidth;
    colWidth = _;
    return chart;
  }
  chart.colPadding = function(_) {
    if (!arguments.length) return colPadding;
    colWidth = _;
    return chart;
  }
  chart.colWidthTotal = function(_) {
    if (!arguments.length) return colWidthTotal;
    colWidthTotal = _;
    return chart;
  }
  chart.rowHeight = function(_) {
    if (!arguments.length) return rowHeight;
    rowHeight = _;
    return chart;
  }
  chart.barHeight = function(_) {
    if (!arguments.length) return barHeight;
    barHeight = _;
    return chart;
  }
  chart.headerHeight = function(_) {
    if (!arguments.length) return headerHeight;
    headerHeight = _;
    return chart;
  }
  chart.nameWidth = function(_) {
    if (!arguments.length) return nameWidth;
    nameWidth = _;
    return chart;
  }
  chart.categoryPadding = function(_) {
    if (!arguments.length) return categoryPadding;
    categoryPadding = _;
    return chart;
  }
  chart.onRescale = function(_) {
    if (!arguments.length) return onRescale;
    onRescale = _;
    return chart;
  }
  chart.onHover = function(_) {
    if (!arguments.length) return onHover;
    onHover = _;
    return chart;
  }
  chart.onHoverEnd = function(_) {
    if (!arguments.length) return onHoverEnd;
    onHoverEnd = _;
    return chart;
  }  
  chart.onHoverRow = function(_) {
    if (!arguments.length) return onHoverRow;
    onHoverRow = _;
    return chart;
  }
  chart.onHoverRowEnd = function(_) {
    if (!arguments.length) return onHoverRowEnd;
    onHoverRowEnd = _;
    return chart;
  }    
  chart.initFieldDescriptors = function(_) {
    if (!arguments.length) return initFieldDescriptors;
    initFieldDescriptors = _;
    return chart;
  }

  chart 
  return chart;
}