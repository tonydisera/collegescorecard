let fields = []
let selectedFieldMap = {}
let histChartMap = {1: {}}
let search = null;
let rankChart = null;



$(document).ready(function() {

  init();

});

function init() {
  search = new Search();
  search.init();

  initFieldDropdown();

  rankChart = rankchart();
  rankChart.invertedScalesFor([
    "tuition in_state",
    "tuition out_of_state",
    "tuition academic_year",
    "cost attendance academic_year",
    "demographics avg_family_income",    
    "demographics median_family_income",
    "demographics median_hh_income",
    "median_debt_suppressed overall"
  ])
  
}

function rankColleges() {
  search.close();
  promiseShowRankings(getSelectedCollegeNames());
}

function promiseShowRankings(selectedCollegeNames) {


  promiseGetCollegeData(selectedCollegeNames, getSelectedFieldNames())
  .then(function(selectedCollegeData) {

    let selection = d3.select("#rank-chart");
    selection.datum(selectedCollegeData);
    rankChart(selection);


  })


}

function promiseGetCollegeData(selectedCollegeNames, fieldNames) {
  return new Promise(function(resolve, reject) {
    promiseGetData(fieldNames)
    .then(function(data) {

      let selectedColleges = [];
      selectedCollegeNames.forEach(function(collegeName) {
          var found = false;
          items = data.filter(function(item) {
              if(!found && item.name == collegeName) {
                  selectedColleges.push(item);
                  found = true;
                  return false;
              } else 
                  return true;
          })
      })

      resolve(selectedColleges)
    })    
  })

}



function promiseShowHistograms(rowNumber=1, collegeName) {

  return new Promise(function(resolve, reject) {

    let fieldNames = getSelectedFieldNames();
    promiseGetData(fieldNames)
    .then(function(data) {

      let chartContainerSelector  = "#histograms #chart-row-" + rowNumber + " .charts"
      let chartSelector           = "#histograms #chart-row-" + rowNumber + " .charts .hist"
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


  d3.select("#histograms.chart-container").select("#chart-row-" + rowNumber).remove();

  var chartRow = d3.select("#histograms.chart-container")
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
  d3.select("#histograms.chart-container").selectAll(".chart-row").remove();

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
      setTimeout(function() {
        collegeNames.forEach(function(collegeName) {
          highlightHistograms(rowNumber, collegeName);
          rowNumber++;
        })        
      },1000)
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
  return search.checkedColleges;
}

function selectField(fieldName, checked) {
  selectedFieldMap[fieldName] = checked;
}



function initFieldDropdown() {

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
      promiseShowRankings(getSelectedCollegeNames())
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
  

  getNumericFields();
  
}


function highlightHistograms(rowNumber=1, collegeName) {
  for (var key in histChartMap[rowNumber]) {
    let histChart = histChartMap[rowNumber][key];
    histChart.highlight()([collegeName]);
  }
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

    $(fieldSelector).multiselect('select', 
      ['cost attendance academic_year', 
       'instructional_expenditure_per_fte', 
       'faculty_salary',
       'ft_faculty_rate',
       'completion_rate_4yr_150nt',
       'demographics avg_family_income',
       '6_yrs_after_entry median',
       'median_debt_suppressed overall',
       'demographics race_ethnicity black',
       'demographics race_ethnicity hispanic'
       ], true)
  })
}




