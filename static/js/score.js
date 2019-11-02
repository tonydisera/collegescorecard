let fields = []
let selectedFieldMap = {}


let colleges = []
let selectedCollegeMap = {}
let selectedColleges = []

let histChartMap = {1: {}}

let search = null;


$(document).ready(function() {

  init();

});

function init() {
  search = new Search();
  search.init();

  initDropdowns();
  getNumericFields();
  getColleges();

 
}

function rankColleges() {
  search.close();
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
    selectedColleges.splice(idx,1)
  }
}

function initDropdowns() {
  let fieldSelector = '#scorecard-select';
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




