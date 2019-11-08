let fields = []
let selectedFieldMap = {}
let histChartMap = {};
let search = null;
let rankChart = null;
let metricCategories = ['selectivity', 'instruction', 'diversity', 'cost', 'outcome', 'rank']

let rankHeaderHeight =  70;
let rankColPadding = 10;
let rankColWidth = 70;
let rankColWidthTotal = 250;
let rankNameWidth = 200;

$(document).ready(function() {

  init();

});

function init() {
  search = new Search();
  search.init();

  initFieldDropdown();

  rankChart = rankchart();
  rankChart.margin( { top: 10, right: 5, bottom: 90, left: 0 } )
  rankChart.headerHeight(rankHeaderHeight);
  rankChart.colWidth(rankColWidth);
  rankChart.colWidthTotal(rankColWidthTotal);
  rankChart.nameWidth(rankNameWidth);
  rankChart.formatColumnHeader(function(d,i) {
    return formatRankColumnHeader(d)
  })
  
}

function formatRankColumnHeader(d) {
  if ( d == "_total") {
      return "Overall score"
  } else {
    let hdr = d.split("_").join(" ");
    let tokens = hdr.split("demographics ");
    if (tokens.length > 1) {
      return tokens[1];
    } else {
      return hdr;
    }
  }
}

function rankColleges() {
  search.close();
  promiseShowHistograms();
  promiseShowRankings(getSelectedCollegeNames());
}

function promiseShowRankings(selectedCollegeNames) {


  promiseGetCollegeData(selectedCollegeNames, getSelectedFieldNames())
  .then(function(selectedCollegeData) {

    let selection = d3.select("#rank-chart");
    rankChart.fieldDescriptors(getSelectedMetricFields())
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



function promiseShowHistograms() {

  return new Promise(function(resolve, reject) {

    let fieldNames = getSelectedFieldNames();
    promiseGetData(fieldNames)
    .then(function(data) {

      let chartContainerSelector  = "#hist-chart"
      d3.select(chartContainerSelector).style("margin-left", (rankNameWidth+rankColPadding) + "px");

      let chartSelector           = "#hist-chart .hist"
      d3.selectAll(chartSelector).remove()
      histChartMap = {};

      getSelectedMetricFields().forEach(function(selectedField) {
        let selectedFieldName = selectedField.name.split(" ").join("_");

        let clazzes = "hist " + selectedFieldName + " " + selectedField.category;
        let selection = d3.select(chartContainerSelector).append("div").attr("class", clazzes);

        let nonNullValues = data.filter(function(d) {
          return d[selectedField.name];
        })
        

        let histChart = histogram();
        histChart.width(rankColWidth+rankColPadding)
                 .height(70)
                 .margin({top: 0, bottom: 10, left: 0, right: rankColPadding})
                
        histChart.xValue(function(d) {
          return d[selectedField.name];
        })
        histChart.showAxis(false)
        selection.datum(data)
        histChart(selection);

        histChartMap[selectedFieldName] = histChart;
      })
      resolve();


    })
  })

}


function getSelectedFieldNames() {
  return fields.filter(function(field) {
    return selectedFieldMap[field.name];
  }).
  map(function(field) {
    return field.name;
  })
}


function getSelectedMetricFields() {
  let selectedFields = []
  metricCategories.forEach(function(category) {
    let fieldsForCategory = fields.filter(function(field) {
      return selectedFieldMap[field.name] && field.name != 'name' && field.category == category;
    })
    fieldsForCategory.forEach(function(field,i) {
      field.categoryIdx = i;
      selectedFields.push(field)
    })
  })
  return selectedFields;
}

function getFieldCategory(fieldName) {
  let matched = fields.filter(function(field) {
    return field.name == fieldName;
  })
  if (matched && matched.length > 0) {
    return matched[0].category;
  } else {
    return "";
  }
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
            let field = option[0].value
            selectField(field, checked);
          })
        } else {
          let field = options[0].value
          selectField(field, checked);
        }
      }
    },
    onDropdownHide: function(event) {
      rankColleges();
    },
    onSelectAll: function(event) {
      fields.forEach(function(field) {
        selectField(field.name, true);
      })

    },
    onDeselectAll: function(event) {
      fields.forEach(function(field) {
        selectField(field.name, false);
      })

    }
    
  });
  

  getMetricFields();
  
}


function highlightHistograms(rowNumber=1, collegeName) {
  for (var key in histChartMap[rowNumber]) {
    let histChart = histChartMap[rowNumber][key];
    histChart.highlight()([collegeName]);
  }
}

function getMetricFields() {
  d3.json("getDataDictionary",
  function(err, data) {
    if (err) {
      console.log(err)
      return;
    }

    fields = data.filter(function(field) {
      return field.forRanking
    });

    

    optGroups = metricCategories.map(function(category) {
      let optGroup = {label: category, children: null};
      optGroup.children = fields.filter(function(field) {
        return field.category == category;
      })
      .map(function(field) {
        return { label: formatRankColumnHeader(field.name), 
                 title: field.name, 
                 value: field.name }
      })
      return optGroup;
    })

    let fieldSelector = "#scorecard-select";
    $(fieldSelector).multiselect('dataprovider', optGroups);

    let defaultFields = fields.filter(function(field) {
        return field.rankDefaultSelect;
    })
    .map(function(field) {
      return field.name;
    })
    $(fieldSelector).multiselect('select', defaultFields, true)

    let invertedScaleFields = fields.filter(function(field) {
      return field.rankDescending;
    })
    .map(function(field) {
      return field.name;
    })
    rankChart.invertedScalesFor(invertedScaleFields);

  })
}







