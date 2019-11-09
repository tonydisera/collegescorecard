function rankchart() {
  var margin = { top: 10, right: 10, bottom: 30, left: 0 },
    width = 0,
    height = 0,
    innerWidth = width - margin.left - margin.right,
    innerHeight = height - margin.top - margin.bottom;
   
  var scales = null;
  var color = null;
  var tooltip = null;
  var tooltipContent = function(d) {
    return d.name + "<br>" + d.field + ": " + d.value
  }
  var invertedScalesFor = [];

  var fieldDescriptors = [];



  var outerWidth = null;

  var container = null;
  var data = null;
  var stackedData = null;

  var headerHeight  = 70;
  var rowHeight     = 40;
  var barHeight     = 20;
  var colWidth      = 80;
  var colWidthTotal = 300;
  var colPadding    = 10;
  var nameWidth     = 250;
  var categoryPadding = 30;
  var weightHeight    = 20;

  var inverseBarMin = 2;

  let darkColors = ['#1b9e77','#d95f02','#7570b3','#e7298a','#66a61e','#e6ab02','#a6761d','#666666',
               '#22c796','#f79245', '#a7a3d1'];

  let tc = d3.scaleOrdinal(d3.schemeTableau10, 10);
  let tc0 = tc(4);
  let tc1 = tc(0);
  let tc2 = tc(5);
  let tc3 = tc(6);
  let tc4 = tc(1);

  var categoryColorMap1 = {
    'selectivity': ['#f7fbff','#deebf7','#c6dbef','#9ecae1','#6baed6','#4292c6','#2171b5','#084594'].reverse(),
    'outcome':     ['#ffffff','#f0f0f0','#d9d9d9','#bdbdbd','#969696','#737373','#525252','#252525'].reverse(),
    'cost':        ['#f7fcf5','#e5f5e0','#c7e9c0','#a1d99b','#74c476','#41ab5d','#238b45','#005a32'].reverse(),
    'instruction': ['#fcfbfd','#efedf5','#dadaeb','#bcbddc','#9e9ac8','#807dba','#6a51a3','#4a1486'].reverse(),
    'diversity':   ['#fff5eb','#fee6ce','#fdd0a2','#fdae6b','#fd8d3c','#f16913','#d94801','#8c2d04'].reverse(),
    'total':       ['#ffffff','#ffffff','#ffffff','#ffffff','#ffffff','#ffffff','#ffffff','#ffffff']
  }



  var categoryColorMap = {
    'selectivity': tc4,
    'outcome':     tc3,
    'cost':        tc2,
    'instruction': tc1,
    'diversity':   tc0,
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

      let totalCategoryPadding = 0;
      fieldDescriptors.forEach(function(field,i) {
        if (i > 0 && field.category != fieldDescriptors[i-1].category) {
          field.padding = categoryPadding;
          totalCategoryPadding += categoryPadding;
        } else {
          field.padding = 0;     
        }
        field.paddingCumulative = totalCategoryPadding;
        field.weights = [0,1,2,3].map(function(weight) {
          return {field: field, weight: weight};
        })
        field.currentWeight = 1;
      })
      // Add padding for total
      totalCategoryPadding += categoryPadding;


      data = theData;

      scales = fieldDescriptors.map(function(field,i) {
        let scale = d3.scaleLinear()
            .domain([d3.min(data, d => d[field.name]), d3.max(data, d => d[field.name])])
            .clamp(true)
        if (invertedScalesFor.length > 0 && invertedScalesFor.indexOf(field.name) >= 0) {
          scale.range([colWidth, 2])
        } else {
          scale.range([2, colWidth])
        }
        return scale;
      })
      scalesTotal = fieldDescriptors.map(function(field,i) {
        let scale = d3.scaleLinear()
            .domain([d3. min(data, d => d[field.name]), d3.max(data, d => d[field.name])])
            .clamp(true)
        if (invertedScalesFor.length > 0 && invertedScalesFor.indexOf(field.name) >= 0) {
          scale.range([colWidthTotal/fieldDescriptors.length, 2])
        } else {
          scale.range([2, colWidthTotal/fieldDescriptors.length])
        }
        return scale;
      })

      data.forEach(function(d) {
        let total = 0;
        fieldDescriptors.forEach(function(field, fieldIdx) {
          if (invertedScalesFor.length > 0 && invertedScalesFor.indexOf(field.name) >= 0 && d[field.name] == null) {
          } else {
            total += scales[fieldIdx](d[field.name]);
          }
        })
        d._total = total;
      })
      totalField = {name: '_total', category: 'total', categoryIdx: 0, padding: 0, paddingCumulative: totalCategoryPadding};
      totalField.weights = [];
      totalField.weight = 0;
      fieldDescriptors.push(totalField)
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

      let fieldNames = fieldDescriptors.map(function(field) {
        return field.name
      })
      stackedData = d3.stack()
        .keys(fieldNames)
        (data)

      height = headerHeight + (rowHeight * data.length) + margin.top + margin.bottom;
      width  = ((colWidth+colPadding) * fields.length-1) + nameWidth + colPadding + colWidthTotal + totalCategoryPadding + margin.left + margin.right;

      innerHeight = height - margin.top - margin.bottom;
      innerWidth =  width - margin.left - margin.right;



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

      var headerRow = g.selectAll(".col-header-row").data([fieldDescriptors]);
      headerRow.exit().remove();
      let headerRowEnter = headerRow.enter()
        .append("g")
        .attr("class", "col-header-row")

      var colHeaders = headerRow
        .merge(headerRowEnter)
        .selectAll(".col-header").data(fieldDescriptors,function(d,i) {
          return d.name + "-" + i;
        });

      colHeaders.exit().remove();
      var colHeadersEnter = colHeaders
        .enter()
        .append("g")
        .attr("class", "col-header")
        .attr("transform", function(d,i) {
          return "translate(" + ((nameWidth + colPadding + d.paddingCumulative) + ((colWidth+colPadding)*i)) + ",0)";
        })
      colHeadersEnter
        .append("text")
        .attr("dx", 0)
        .attr("dy", 0)
        .text(function(d,i) {
          return formatColumnHeader(d.name,i);
        })
        .call(wrap, colWidth +3)

      let weightGroup = colHeadersEnter.selectAll("g.weights")
        .data(function(fieldDescriptor) {
          return [fieldDescriptor.weights];
        })

      weightGroup.exit().remove();

      let weightGroupEnter = weightGroup
        .enter()
        .append("g")
        .attr("transform", "translate(0," + (headerHeight-(colWidth/4)-40) + ")")
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
          if (weightObject.weight == weightObject.field.currentWeight-1) {
            return "weight selected";
          } else {
            return "weight"
          }
        })
        .attr("x", function(weightObject) {
          return weightObject.weight*(colWidth/4)
        })
        .attr("y", "0")
        .attr("width", function(weightObject) {
          if (weightObject.field.name != "_total") {
            return colWidth/4;
          } else {
            return "0";
          }
        })
        .attr("height", colWidth/4)
        .on("click", function(weightObject) {
          weightObject.field.currentWeight = weightObject.weight+1;

          d3.select(d3.select(this).node().parentNode)
            .selectAll("rect")
            .each(function(childWeightObject) {

            d3.select(this).classed("selected", childWeightObject.weight <= weightObject.weight)

          })

        })


      var rows = g.selectAll(".row").data(data,
      function(d,i) {
        return d.name + "-" + i;
      });

      rows.exit().remove();

      let rowsEnter  = rows.enter()
        .append('g')
        .attr('class', 'row')
        .attr('transform',function(d,i){ 
          return "translate(0,0)";
        })

      rowsEnter
        .append("text")
        .attr("dx", 0)
        .attr("dy", 0)
        .text(function (d,i) {
          return i+1 
        })

      rowsEnter
        .append("g")
        .attr("transform", "translate(33,0)")
        .append("text")
        .attr("dx", 0)
        .attr("dy", 0)
        .text(function (d,i) {
          return d.name
        })
        .call(wrap, nameWidth - 33)

      var cols = rows
        .merge(rowsEnter)
        .selectAll(".col").data(function(d,i) {
          return stackedData.map(function(layer, layerIdx) {
            let isInverseScale = false;
            let fieldDescriptor = fieldDescriptors[layerIdx];

            if (invertedScalesFor.length > 0 && invertedScalesFor.indexOf(fieldDescriptor.name) >= 0) {
              isInverseScale = true;
            }
            return {row: i,
                    name:              data[i].name,
                    layerIdx:          layerIdx, 
                    paddingCumulative: fieldDescriptor.paddingCumulative,
                    field:             fieldDescriptor.name, 
                    category:          fieldDescriptor.category,
                    categoryIdx:       fieldDescriptor.categoryIdx,
                    value:             data[i][fieldDescriptor.name],
                    scale:             scales[layerIdx], 
                    scaleTotal:        scalesTotal[layerIdx], 
                    isInverseScale:    isInverseScale,
                    layer:             layer[i]};
          })
        }, function(d,i) {
          return d.name + "-" + d.field + "-" + i;
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
        })
        .attr("transform", function(d,i) {
          return "translate(" + (nameWidth+colPadding+d.paddingCumulative + (i*(colWidth+colPadding))) + ",0)";
        })

      colsEnter
        .append("rect")
        .attr("class", "bar")
        .attr("x", 0)
        .attr("y", -10)
        .attr("height", barHeight)
        .attr("width", function(d,i) {
          if (d.isInverseScale && (d.layer[1] - d.layer[0] == 0)) {
            return 0;
          } else if (d.isInverseScale && (d.scale(d.layer[1] - d.layer[0]) == 0)) {
            return inverseBarMin;
          } else {
            return d.scale(d.layer[1] - d.layer[0]);
          }
        })
        .attr("fill", function(d,i) {
          if (d.layerIdx == fields.length-1) {
            return "white";
          } else {

            return getColor(d.category, d.categoryIdx);
          }
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
          if (invertedScalesFor.length > 0 && invertedScalesFor.indexOf(field.name) >= 0 &&
              record[field.name] == null) {
            scaledRec[field.name] = 0;

          } else {
            scaledRec[field.name] = scalesTotal[i](record[field.name])

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
            .attr("class", "bar")
            .attr("x", function(d,i) {
              return fieldInfo[0][0]
            })
            .attr("y", -10)
            .attr("height", barHeight)
            .attr("width", function(d,i) {
              return fieldInfo[0][1] - fieldInfo[0][0];
            })
            .attr("fill", function(d,i) {
              return getColor(fieldDescriptor.category, fieldDescriptor.categoryIdx);
            })
        })
      })
         
        



      g.selectAll(".row")
          .transition()
           .duration(1200)
           .ease(d3.easeSin)
           .attr('transform',function(d,i){ 
             return "translate(0 ," + ((rowHeight * i) + headerHeight) + ")";
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
    if (k % 4 == 0) {
      return darken(color,k)
    } else if (k % 3 == 0) {
      return saturate(color,k)
    } if (k % 2 == 0) {
      return desaturate(color,k)
    } else {
      return lighten(color,k)
    }
  }

  var darken = function(color, k = 1) {
    const {l, c, h} = d3.lch(color);
    return d3.lch(l - 10 * k, c, h);
  }

  var lighten = function(color, k = 1) {
    const {l, c, h} = d3.lch(color);
    return d3.lch(l + 18 * k, c, h);
  }

  var saturate = function(color, k = 1) {
    const {l, c, h} = d3.lch(color);
    return d3.lch(l, c + 6 * k, h);
  }

  var desaturate = function(color, k = 1) {
    const {l, c, h} = d3.lch(color);
    return d3.lch(l, c - 6 * k, h);
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
  chart.invertedScalesFor = function(_) {
    if (!arguments.length) return invertedScalesFor;
    invertedScalesFor = _;
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
    colWidth = _;
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
  chart 
  return chart;
}