let fields = []
let selectedFieldMap = {}


let colleges = []
let selectedCollegeMap = {}
let selectedColleges = []

let histChartMap = {1: {}}


$(document).ready(function() {

  init();

});

function init() {
  initDropdowns();
  getNumericFields();
  getColleges();

 
  showScatterplot({
      selector: "#scatterplot1",
      width: 900,
      height: 500,
      margin: {top: 20, bottom: 50, left: 70, right: 10},
      x:     {field: "usnews_2019_rank", label: "US News Rank"}, 
      y:     {field: "cost attendance academic_year", label: "Cost Attendance"}, 
      size:  {field: "enrollment_all", label: "Enrollment"}, 
      color: {field: "control", label: "Control", 
              labels: {1: 'Public', 2: 'Private', 3: 'Private for profit'}},
      filterFunction: function(rec) {
        return rec["usnews_2019_rank"];
      },
      colorScale: "ordinal",
      
      rank:       {field: "demographics median_hh_income", label: "Median household income"},
      carnegieug: {field: "median_debt_suppressed overall", label: "Median student debt"}
    });

    showScatterplot({
      selector: "#scatterplot2",
      width: 1000,
      height: 800,
      margin: {top: 20, bottom: 50, left: 70, right: 10},
      x:      {field: "demographics median_hh_income", label: "Median household income"}, 
      y:      {field: "median_debt_suppressed overall", label: "Median debt"}, 
      symbol: {field: "control", label: "Control",
        labels: { 1: {name: 'Public',  shape: d3.symbolCircle}, 
                  2: {name: 'Private', shape: d3.symbolSquare},
                  3: {name: 'Private for profit', shape: d3.symbolCross}
                },
        shapeFunction: function(d) {
          if (d["control"] == 1) {
            return d3.symbolCircle;
          } else if (d["control"] == 2) {
            return d3.symbolSquare;
          } else {
            return d3.symbolCross;
          }
        }
      },
      color: {field: "6_yrs_after_entry median", label: "Earnings 2 yrs after grad"},
      filterFunction: function(rec) {
        return rec["6_yrs_after_entry median"] 
          && rec["median_debt_suppressed overall"]
          && rec["demographics median_hh_income"] 
          && rec["carnegie_undergrad"] 
          && +rec["carnegie_undergrad"] > 5
          && rec["enrollment_all"] 
          && +rec["enrollment_all"] > 1000
      },
      colorScale: "quantize",

      rank:       {field: "usnews_2019_rank", label: "US News Rank"},
      carnegieug: {field: "carnegie_undergrad", label: "Carnegie Categories (undergrad)"},
      enrollment: {field: "enrollment_all", label: "Enrollment"}

    });
}


function promiseShowHistograms(rowNumber=1, collegeName) {

  return new Promise(function(resolve, reject) {

    let fieldNames = getSelectedFieldNames();
    promiseGetData(fieldNames)
    .then(function(data) {

      let chartContainerSelector  = "#chart-row-" + rowNumber + " .charts"
      let chartSelector           = "#chart-row-" + rowNumber + " .charts .hist"
      d3.selectAll(chartSelector).remove()
      histChartMap[rowNumber] = {}

      getSelectedFieldNames().forEach(function(selectedField) {
        let selectedFieldName = selectedField.split(" ").join("_");

        let selection = d3.select(chartContainerSelector).append("div").attr("class", "hist " + selectedFieldName);

        if (rowNumber == 1) {
          selection.append("span").attr("class", "chart-title").text(selectedField)

          let nonNullValues = data.filter(function(d) {
            return d[selectedField];
          })
          let nullRatio = ((data.length - nonNullValues.length) / data.length);
          let nullPct = nullRatio * 100;
          let nullPctLabel  = +(Math.round(nullPct + "e+" + 0)  + "e-" + 0);
          selection.append("span")
                   .attr("class", function() {
                      if (nullRatio > .25) {
                        return "chart-label danger"
                      } else {
                        return "chart-label"
                      }
                   })
                   .text(nullPctLabel + "% blank")

        }


        let histChart = histogram();
        histChart.width(160)
                 .height(160)
                 .margin({top: 20, bottom: 62, left: 35, right: 8})
        histChart.xValue(function(d) {
          return d[selectedField];
        })
        selection.datum(data)
        histChart(selection);

        histChartMap[rowNumber][selectedFieldName] = histChart;
      })
      resolve({rowNumber: rowNumber, collegeName: collegeName});


    })
  })

}

function addRow(rowNumber, collegeName) {


  d3.select(".chart-container").select("#chart-row-" + rowNumber).remove();

  var chartRow = d3.select(".chart-container")
    .append("div")
    .attr("id", "chart-row-" + rowNumber)
    .attr("class", "chart-row")

  chartRow.append("div")
          .attr("class", "college-title")
          .text(collegeName);

  chartRow.append("div")
    .attr("class", "charts")


}

function addChartRows() {


  var collegeNames = getSelectedCollegeNames();
  let rowNumber = 1
  let promises = []
  if (collegeNames.length > 0) {
    collegeNames.forEach(function(collegeName) {
      addRow(rowNumber, collegeName)
      let p = promiseShowHistograms(rowNumber, collegeName)
      promises.push(p)
      rowNumber++;
    })
    Promise.all(promises)
    .then(function() {
      rowNumber = 1;
      collegeNames.forEach(function(collegeName) {
        highlightHistograms(rowNumber, collegeName);
        rowNumber++;
      })
    })
  } else {
    addRow(1, "");
    promiseShowHistograms(1, "");
  }



}

function getSelectedFieldNames() {
  return fields.filter(function(field) {
    return selectedFieldMap[field.name];
  }).
  map(function(field) {
    return field.name;
  })

}

function getSelectedCollegeNames() {
  return selectedColleges;
}

function selectField(fieldName, checked) {
  selectedFieldMap[fieldName] = checked;
}

function selectCollege(collegeName, checked) {
  selectedCollegeMap[collegeName] = checked;
  if (checked) {
    if (selectedColleges.indexOf(collegeName) < 0) {
      selectedColleges.push(collegeName);
    }
  } else {
    let idx = selectedColleges.indexOf(collegeName);
    selectedColleges.slice(idx,1)
  }
}

function initDropdowns(rowNumber=1) {
  let fieldSelector = '#scorecard-select';
  if (rowNumber == 1) {
    $(fieldSelector).multiselect(
      { enableFiltering: true,
        includeSelectAllOption: true,
        enableCaseInsensitiveFiltering: true,
        nonSelectedText: "Select fields",
        onChange: function(options, checked) {

          if (options && options.length > 0) {
            if (Array.isArray(options)) {
              options.forEach(function(option) {
                let field = option[0].label
                selectField(field, checked);
              })
            } else {
              let field = options[0].label
              selectField(field, checked);
            }
          }
        },
        onDropdownHide: function(event) {
          addChartRows()
        },
        onSelectAll: function(event) {
          fields.forEach(function(field) {
            selectField(field, true);
          })

        },
        onDeselectAll: function(event) {
          fields.forEach(function(field) {
            selectField(field, false);
          })

        }

      });
    }

    let collegeSelector = '#scorecard-college-select';
    $(collegeSelector).multiselect(
    { enableFiltering: true,
      includeSelectAllOption: true,
      nonSelectedText: "Select college to highlight",
      enableCaseInsensitiveFiltering: true,
      enableClickableOptGroups: true,
      onChange: function(options, checked) {
        if (Array.isArray(options)) {
          options.forEach(function(option) {
            let college = option[0].label
            selectCollege(college, checked);
          })
        } else {
          let college = options[0].label
          selectCollege(college, checked);
        }

      },
      onDropdownHide: function(event) {
        addChartRows();
      },
      onSelectAll: function(event) {
        colleges.forEach(function(college) {
          selectCollege(college, true);
        })

      },
      onDeselectAll: function(event) {
        colleges.forEach(function(college) {
          selectCollege(college, false);
        })

      }

    });
}


function highlightHistograms(rowNumber=1, collegeName) {
  for (var key in histChartMap[rowNumber]) {
    let histChart = histChartMap[rowNumber][key];
    histChart.highlight()([collegeName]);
  }
}

function getColleges(rowNumber=1) {
  promiseGetData(["usnews_2019_rank", "control"])
  .then(function(data) {
    colleges = data;


    let optGroups = [];

    let options = colleges.filter(function(college) {
      return college["usnews_2019_rank"] != null
    })
    .sort(function(a,b) {
      return a["usnews_2019_rank"] - b["usnews_2019_rank"];
    })
    .map(function(college) {
      return { label: college.name, title: college.name, value: college.name };
    })
    optGroups.push( {label: 'US News top 200', children: options })

    let publicColleges = colleges.filter(function(college) {
      return college["control"] == 1
    })
    .sort(function(a,b) {
      return  a.name.localeCompare(b.name);
    })
    .map(function(college) {
      return { label: college.name, title: college.name, value: college.name };
    })
    optGroups.push( {label: 'Public colleges', children: publicColleges })


    optGroups.push( {label: 'Private colleges', children:
      colleges.filter(function(college) {
        return college["control"] == 2
      })
      .sort(function(a,b) {
        return  a.name.localeCompare(b.name);
      })
      .map(function(college) {
        return { label: college.name, title: college.name, value: college.name };
      })
    })

    optGroups.push( {label: 'Private for-profit', children:
      colleges.filter(function(college) {
        return college["control"] == 3
      })
      .sort(function(a,b) {
        return  a.name.localeCompare(b.name);
      })
      .map(function(college) {
        return { label: college.name, title: college.name, value: college.name };
      })
    })

    let collegeSelector = "#scorecard-college-select";
    $(collegeSelector).multiselect('dataprovider', optGroups);
  })
}

function getNumericFields() {
  d3.json("getFields",
  function (err, data) {
    if (err) {
      console.log(err)
    }
    fields = data.filter(function(field) {
      return field.type == 'numeric'
    });

    let options = []
    fields.forEach(function(field) {
      options.push({ label: field.name, title: field.name, value: field.name } );
    })

    let fieldSelector = "#scorecard-select";
    $(fieldSelector).multiselect('dataprovider', options);
  })
}

function promiseGetData(fieldNames) {
  return new Promise(function(resolve, reject) {

    if (fieldNames.length == 0) {
      resolve([])
    } else {
      fieldNames.push("name");

      d3.json("getData?fields=" + fieldNames.join(","),
      function (err, data) {
        if (err) {
          console.log(err)
          reject(err)
        }
        resolve(data)
      })
    }
  })

}

function getInfoFields(info) {
  let fields = [];
  for (var key in info) {
    if (info[key].field) {
      fields.push(info[key].field)
    }
  }
  return fields;
}


function showScatterplot(info) {
  promiseGetData(getInfoFields(info))
  .then(function(data) {

    let filteredColleges = info.filterFunction ? data.filter(info.filterFunction) : data;
    
    let scatterplotChart = scatterplot();
    scatterplotChart
      .width(info.width ? info.width : 900)
      .height(info.height ? info.height : 600)
      .margin(info.margin ? info.margin : {top: 20, bottom: 50, left: 70, right: 10})
      .xValue(function(d) {
        return d[info.x.field];
      })
      .yValue(function(d) {
        return d[info.y.field];
      })
      .colorValue(function(d) {
        return d[info.color.field];
      })

    if (info.size) {
      scatterplotChart
        .sizeValue(function(d) {
          let size = d[info.size.field]
          return size > 0 ? size : 1;
        })
        .sizeRange([2,12])
    }

    let color = null;
    if (info.colorScale) {
      let color = null;
      if (info.colorScale == "quantize") {
        color = d3.scaleQuantize()                
                  .domain(d3.extent(filteredColleges, d => d[info.color.field]))
                  .range(d3.quantize(d3.interpolateYlGnBu, 5));
      } else if (info.colorScale == "ordinal") {
        color = d3.scaleOrdinal(d3.schemeCategory20)
      }
      scatterplotChart.colorScale(color)
    }

    if (info.symbol && info.symbol.shapeFunction && info.symbol.labels) {
      scatterplotChart.shape(info.symbol.shapeFunction)
      scatterplotChart.symbolLabels(info.symbol.labels)
    }


    let labels = {x:     info.x.label,
                  y:     info.y.label,
                  color: info.color.label}

    if (info.size) {
      labels.size = info.size.label;
    }
    if (info.symbol) {
      labels.symbol = info.symbol.label;
    }
    scatterplotChart.labels(labels)

    scatterplotChart.colorLabels( info.color.labels)
    
    scatterplotChart.tooltipContent(function(d) {
      let buf =  d.name + 
           "<br>" + labels.x     + ": " + d[info.x.field] + 
           "<br>" + labels.y     + ": " + d[info.y.field] +
           "<br>" + labels.color + ": " + d[info.color.field];
      if (info.size) {
        buf += "<br>" + labels.size  + ": " + d[info.size.field];
      }
      return buf;     
    })


    let selection = d3.select(info.selector);
    selection.datum(filteredColleges)
    scatterplotChart(selection);
    if (info.size) {
      scatterplotChart.drawSizeLegend()();
    }
    scatterplotChart.drawColorLegend()();
    if (info.symbol && info.symbol.shapeFunction) {
      scatterplotChart.drawSymbolLegend()();
    }
  });

}
