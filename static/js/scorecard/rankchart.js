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
  var headingContainer = null;
  var data = null;
  var stackedData = null;
  var scaleForScore = 0;

  var headerHeight  = 60;
  var rowHeight     = 40;
  var barHeight     = 15;
  var colWidthScore = 20;
  var colWidthRank  = 60;
  var colWidth      = 80;
  var colWidthTotal = 300;
  var colPadding    = 10;
  var nameWidth     = 250;
  var categoryPadding = 30;
  var weightHeight    = 14;
  var weightWidth     = 20;
  var rowTextHeight   = 10;
  var maxNameLength = 50;

  var inverseBarMin = 2;

  let onRescale = function(data) {

  }

  let onHover = function() {

  }

  let onHoverEnd = function() {

  }

  let onHoverRow = function() {

  }

  let onHoverRowEnd = function() {

  }

  let onRowClicked = function() {
    
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
    'rank':        tc_purple,
    'total':       '#ffffff'
  }


  var formatColumnHeader = function(d,i) {
    return d;
  }




  function chart(selection, containerForHeading) {
    selection.each(function(theData) {

      container = selection;
      headingContainer = containerForHeading ? containerForHeading : selection;

      if (fieldDescriptors == null) {
        console.log("rankchart cannot draw chart without fieldDescriptors") 
        return; 
      }   



      data = theData;

      // Scale the data
      scaleData(data)



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

      container.style("min-width", width + "px")
      headingContainer.style("min-width", width + "px")


      addHeadingSVG()


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


      g.append("rect")
        .attr("class", "current-row")

      // Add the rows
      var rows = g.selectAll(".row").data(data,
      function(d,i) {
        //return d.name + "-" + i + "-" + totalColWidth + "-" + totalCategoryPadding;
        //return d.name + "-" + i + "-" + scaleForScore(d._total);
        return d.name + "-" + i + "-" + d.position;
      });

      rows.exit().remove();

      let rowsEnter  = rows.enter()
        .append('g')
        .attr("id", function(d,i) {
          return "row-" + i;
        })
        .attr('class', 'row')
        .attr('transform',function(record,i){ 
            let position = record.firstPass ? record.positionOrig : record.position;
            return "translate(0," + ((rowHeight * position) ) + ")";
         })
       

      rowsEnter
        .append("text")
        .attr("class", "rank")
        .attr("y", (rowTextHeight/2))
        .attr("dx", 0)
        .attr("dy", 0)
        .text(function (d,i) {
          return (i+1);
        })
      rowsEnter
        .append("g")
        .attr("class", "delta")
        .attr("transform", "translate(" + (colWidthRank/2) + "," + (rowTextHeight/2) + ")")
       

      rowsEnter
        .append("g")
        .attr("transform", "translate(" + colWidthRank + ",0)")
        .append("text")
        .attr("class", "name")
        .attr("y", (rowTextHeight/2))
        .attr("dx", 0)
        .attr("dy", 0)
        .text(function (d,i) {
          return d.name.substring(0, maxNameLength)
        })

      rowsEnter
        .on("mouseover", function(d) {
          setCurrentRow(d3.select(this), d)
          
        })
        .on("mouseout", function(d) {
          unsetCurrentRow();

        })
        .on("click", function(d) {
          onRowClicked(d)
          
        })

      rowsEnter.append("g")
        .attr("transform", "translate(" + (nameWidth+colWidthRank) + ",0)")
        .append("text")
        .attr("class", "score")
        .attr("x", 0)
        .attr("y", 5)
        .text(function(record,i) {
          return Math.ceil(scaleForScore(record._total))
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
          if (d.field.name == "_total") {
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

  var addHeadingSVG = function() {
      // Select the svg element, if it exists.
      let svg = headingContainer
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
        .attr("height", headerHeight );

      var g = svg
        .merge(svgEnter)
        .select("g")
        .attr("transform", "translate(" + margin.left + ",0)");


      // Add the column headers
      g.selectAll(".col-header-row").remove();
      var headerRow = g.selectAll(".col-header-row").data([fieldDescriptors]);
      headerRow.exit().remove();
      let headerRowEnter = headerRow.enter()
        .append("g")
        .attr("class", "col-header-row")



      var colHeaders = headerRow
        .merge(headerRowEnter)
        .selectAll(".col-header").data(fieldDescriptors,function(field,i) {
          return field.name + "-" + i + "-" + field.colX;
        });

      colHeaders.exit().remove();


      headerRowEnter
        .append("text")
        .attr("class", "col-header")
        .attr("x", 0)
        .attr("y", weightHeight+45)
        .text("Rank")

      headerRowEnter
        .append("text")
        .attr("id", "col-header-name")
        .attr("class", "col-header col-name")
        .attr("x", colWidthRank)
        .attr("y", weightHeight+45)
        .text("College")

      headerRowEnter
        .append("text")
        .attr("class", "col-header col-score")
        .attr("x", colWidthRank+nameWidth)
        .attr("y", weightHeight+45)
        .text("Score")      


      var colHeadersEnter = colHeaders
        .enter()
        .append("g")
        .attr("id", function(d,i) {
          return "col-metric-" + i;
        })
        .attr("class", "col-header col-metric")
        .attr("transform", function(field,i) {
          return "translate(" + field.colX + ",0)";
        })

      let colHeadersText = colHeadersEnter
        .append("g")
        .attr("transform", "translate(0," +  (weightHeight+45) + ")")
      colHeadersText  
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
        .attr("transform", "translate(" + ((colWidth - (weightWidth*4))/2) + "," + (weightHeight+((weightHeight/2)*-1)) + ")")
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
        .attr("id", function(d,i) {
          return "weight-square-" + i;
        })
        .attr("class", function(weightObject) {
          if (weightObject.weight <= weightObject.field.currentWeight-1) {
            return "weight selected";
          } else {
            return "weight"
          }
        })
        .attr("x", function(weightObject) {
          return weightObject.weight*weightWidth;
        })
        .attr("y", "0")
        .attr("width", function(weightObject) {
          if (weightObject.field.name != "_total") {
            return weightWidth;
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

          onRescale(data)

        })



      let hintGroup = headerRowEnter
        .append("g")
        .attr("transform", "translate(" + (nameWidth + colWidthRank) + "," + (weightHeight + (((weightHeight/2)*-1)+12)) + ")");

      hintGroup
        .append("text")
        .attr("id", "col-header-weight")
        .attr("class", "hint-header")
        .attr("x", 0)
        .attr("y", 0)
        .text("Weight")

  }



  var initFieldDescriptors = function() {
    totalCategoryPadding = 0;
    totalColWidth = 0;

    // totalField holds the scales for the overall score 
    totalField = {name: '_total', category: 'total', categoryIdx: 0, padding: 0, paddingCumulative: 0};
    totalField.weights = [];
    totalField.weight = 0;
    totalField.scale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d._total)])
      .range([0, colWidth])

    totalField.scaleTotal = d3.scaleLinear()
      .domain([0, d3.max(data, d => d._total)])
      .range([0, 0])   

    
    fieldDescriptors.splice(0, 0, totalField)      


    fieldDescriptors.forEach(function(field,i) {
      if (i > 0 && field.category != fieldDescriptors[i-1].category) {
        totalCategoryPadding += categoryPadding;
      } 
      field.paddingCumulative = totalCategoryPadding;
      field.weights = [0,1,2,3].map(function(weight) {
        return {field: field, weight: weight};
      })
      field.currentWeight = field.currentWeight ? field.currentWeight : 1;
      field.width = field.name == "_total" ? colWidthTotal : colWidth*field.currentWeight;

      field.colX =  colWidthRank + nameWidth + colPadding + colWidthScore + colPadding 
                    + field.paddingCumulative + totalColWidth;

      totalColWidth += field.width;
      totalColWidth += colPadding;
    })
    // Add padding for total
    totalCategoryPadding += categoryPadding;


  }

  var scaleData = function(data) {

    // Initialize field descriptors with the x postion, padding, width
    initFieldDescriptors();


    let units = 0;
    fieldDescriptors.forEach(function(field) {
      if (field.name != "_total") {
        units += field.currentWeight;
      }
    })

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
        field.scaleTotal.range([(colWidthTotal/units) * field.currentWeight, 2])
      } else {
        field.scaleTotal.range([2, (colWidthTotal/units) * field.currentWeight])
      }

    })
    // Calculate overall score 
    data.forEach(function(d) {
      let total = 0;
      fieldDescriptors.forEach(function(field, fieldIdx) {
        if (field.name != "_total") {
          if (field.rankDescending && d[field.name] == null) {
          } else {
            total += field.scale(d[field.name]);
          }

        }
      })
      d._total = total;
    })


    // Set flag if we haven't ranked this data before
    data.forEach(function(record, i) {
      if (record.delta == null) {
        record.firstPass = true;
      } else {
        record.firstPass = false;
      }
    })


    // Store the position before the entries were ranked 
    data.forEach(function(record, i) {
      if (record.firstPass) {
        record.positionOrig = i;
      }
    })


    // Sort the rows according to the overall score
    data = data.sort(function(a,b) {
      return d3.descending(a._total, b._total);
    })


    // Store the position for the first
    // time the entries are ranked
    data.forEach(function(record, i) {
      if (record.firstPass) {
        record.position = i;
      }
    })


    // Capture the different in ranking between the initial ranking
    // and the current ranking 
    data.forEach(function(rec,i) {
      if (rec.firstPass) {
        rec.delta = 0;
      } else {
        rec.delta = i - rec.position;
      }
    })

    
    let maxScore = data[0]._total;
    scaleForScore = d3.scaleLinear()
               .domain([0, maxScore])
               .clamp(true)
               .range([0, 100])
    
  }


  var addTotalBars = function() {


    var symbolGenerator = d3.symbol()
      .size(30).type(d3.symbolTriangle)


    container.selectAll("g.delta")
    .each(function(d,i) {
      let deltaGroup = d3.select(this)
      let record = data[i];
      deltaGroup.select("path").remove();
      deltaGroup.select("text").remove();
      if (record.delta !=  0) {
        deltaGroup
          .append('path')
          .attr("transform", function() {
            if (record.delta > 0) {
              return "rotate(180),translate(0,4)"
            } else {
              return "translate(0,-2)"
            }
          })
          .attr("class", function() {
            if (record.delta > 0) {
              return "down"
            } else if (record.delta < 0) {
              return "up"
            } else {
              return "";
            }
          })
          .attr('d', function(d) {
            return symbolGenerator(); 
          })
        deltaGroup
          .append("text")
          .attr("class", function() {
            if (record.delta > 0) {
              return "down"
            } else if (record.delta < 0) {
              return "up"
            } else {
              return "";
            }
          })          
          .attr("x", 7)
          .attr("y", 0)
          .text(Math.abs(record.delta))
      }
    })

    container.selectAll("text.score")
    .each(function(d,i) {
      let scoreElement = d3.select(this)
      let record = data[i];
      scoreElement.text(function() {
        return Math.ceil(scaleForScore(record._total))
      })
    })


    // Add the overall bar (a stacked bar)
    container.selectAll(".col.total")
    .each(function(d,i) {
      colTot = d3.select(this)


      colTot.selectAll("text").remove(); 
      colTot.selectAll("rect").remove(); 


      let record = data[i];
      let theFieldDescriptors = fieldDescriptors.filter(function(field) {
        return field.name != "_total"
      })

      let scaledRec = {};
      let scaledScore = 0;
      theFieldDescriptors.forEach(function(field, i) {
        if (record[field.name] == null) {
          scaledRec[field.name] = 0;

        } else {
          scaledRec[field.name] = field.scaleTotal(record[field.name])
          scaledScore += field.scaleTotal(record[field.name])

        }
      })

      let theFieldNames = theFieldDescriptors.map(function(field) {
        return field.name;
      })
      let stacked = d3.stack().keys(theFieldNames)([scaledRec]);

      stacked
      .forEach(function(fieldInfo, fieldIdx) {
        let fieldDescriptor = theFieldDescriptors[fieldIdx];
        colTot.append("rect")
          .attr("class", "bar-total " + fieldDescriptor.category)
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
    container.selectAll(".col")
      .on("mouseover", function(d) {
          onHoverRow(d)
      })
      .on("mouseout", function(d) {
        onHoverRowEnd(d)
      })
    container.selectAll(".row text")
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
           return "translate(0," + ((rowHeight * i) ) + ")";
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
  chart.onRowClicked = function(_) {
    if (!arguments.length) return onRowClicked;
    onRowClicked = _;
    return chart;
  }    
  chart.initFieldDescriptors = function(_) {
    if (!arguments.length) return initFieldDescriptors;
    initFieldDescriptors = _;
    return chart;
  }
  chart.colWidthScore = function(_) {
    if (!arguments.length) return colWidthScore;
    colWidthScore = _;
    return chart;
  }
  chart.colWidthRank = function(_) {
    if (!arguments.length) return colWidthRank;
    colWidthRank = _;
    return chart;
  }
  chart.maxNameLength = function(_) {
    if (!arguments.length) return maxNameLength;
    maxNameLength = _;
    return chart;
  }
  chart.weightWidth = function(_) {
    if (!arguments.length) return weightWidth;
    weightWidth = _;
    return chart;
  }
  chart.weightHeight = function(_) {
    if (!arguments.length) return weightHeight;
    weightHeight = _;
    return chart;
  }


  chart 
  return chart;
}