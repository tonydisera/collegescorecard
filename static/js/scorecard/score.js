let fields = []
let selectedFieldMap = {}
let histChartMap = {};
let search = null;
let rankChart = null;
let metricCategories = ['selectivity', 'instruction', 'diversity', 'cost', 'outcome', 'rank']

let rankHeaderHeight    = 100;
let rankRowHeight       = 24;
let rankBarHeight       = 15;

let rankColPadding      = 10;
let rankColWidth        = 70;
let rankColWidthTotal   = 100;
let rankColWidthScore   = 10;
let rankNameWidth       = 275;
let rankColWidthRank    = 60;
let rankMaxNameLength   = 46;
let rankCategoryPadding = 0;

let slidebarClicks = 0;



$(document).ready(function() {

  init();  
  

});

function init() {

  initFieldDropdown();

  rankChart = rankchart();
  rankChart.margin( { top: 10, right: 5, bottom: 0, left: 0 } )

  rankChart.headerHeight(rankHeaderHeight);
  rankChart.rowHeight(rankRowHeight);
  rankChart.barHeight(rankBarHeight);
  rankChart.colWidth(rankColWidth);
  rankChart.weightHeight(14)
  rankChart.weightWidth(rankColWidth/4)
  rankChart.colWidthTotal(rankColWidthTotal);
  rankChart.nameWidth(rankNameWidth);
  rankChart.colWidthRank(rankColWidthRank);
  rankChart.maxNameLength(rankMaxNameLength);
  rankChart.categoryPadding(rankCategoryPadding)
  rankChart.colWidthScore(rankColWidthScore)
  rankChart.formatColumnHeader(function(d,i) {
    return formatRankColumnHeader(d)
  })
  rankChart.onRescale(function(data) {
    rankChart.initFieldDescriptors()()
    promiseShowHistograms();
    showRescaledRankings(data)
  })
  rankChart.onHover(function(record) {
    highlightHistogram(record.name, record.field)
  })
  rankChart.onHoverEnd(function(record) {
    unhighlightHistograms(record.name);
  })
  rankChart.onHoverRow(function(record) {
    highlightHistograms(record.name)
  })
  rankChart.onHoverRowEnd(function(record) {
    unhighlightHistograms(record.name);
  })  
  rankChart.onRowClicked(function(college) {
    showCollegeDetail(college)
  })

  d3.select('#loading').style("display", "initial")

  search = new Search();
  search.promiseInit()
  .then(function() {
    if (getSelectedCollegeIds().length > 0) {
      rankColleges();  
    }
  })


  $('input:radio[name="searchoption"]').change(function(){
      if($(this).val() === 'advanced_search'){
        $("#search-dialog").modal()
      }
  });


}

var capitalize = function(theString) {
  return theString.charAt(0).toUpperCase() + 
         theString.slice(1)
}

function formatRankColumnHeader(d) {
  if ( d == "_total") {
      return ""
  } else {
    let hdr = d.split("_").join(" ");
    let tokens = hdr.split("demographics ");
    if (tokens.length > 1) {
      return capitalize(tokens[1]);
    } else {
      return capitalize(hdr);
    }
  }
}

function rankColleges() {
  d3.select('#loading').style("display", "initial")
  search.close();
  
  d3.selectAll("#filter-badges badge").remove();
  d3.select("#filter-badges").html(search.getBadges())
  d3.select("#rank-college-count").text("Ranking " + getSelectedCollegeIds().length + " Colleges")

  promiseShowHistograms();
  promiseShowRankings(getSelectedCollegeIds())
  .then(function() {
      d3.select('#loading').style("display", "none")
  })
}

function onAdvancedSearch() {
  d3.select(".selections .btn-group .btn-sm.active").classed("active", false)
}

function promiseShowRankings(selectedCollegeIds) {


  return promiseGetCollegeData(selectedCollegeIds, getSelectedFieldNames())
  .then(function(selectedCollegeData) {

    let selection = d3.select("#rank-chart");
    rankChart.fieldDescriptors(getSelectedMetricFields())
    selection.datum(selectedCollegeData);
    rankChart(selection, d3.select("#rank-chart-heading"));


  })


}

function showRescaledRankings(data) {


  let selection = d3.select("#rank-chart");
  rankChart.fieldDescriptors(getSelectedMetricFields())
  selection.datum(data);
  rankChart(selection, d3.select("#rank-chart-heading"));


}

function promiseGetCollegeData(selectedCollegeIds, fieldNames) {
  return new Promise(function(resolve, reject) {
    promiseMetricGetData(fieldNames, selectedCollegeIds, {includeDefaultFields: true})
    .then(function(data) {

      /*
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
      */
      resolve(data);
    })    
  })

}



function promiseShowHistograms() {

  return new Promise(function(resolve, reject) {

    let fieldNames = getSelectedFieldNames();

    let fieldDescriptors = getSelectedMetricFields();
    let categories = []
    
    let category = null;
    fieldDescriptors.forEach(function(field,i) {
      if (i == 0 || field.category != fieldDescriptors[i-1].category) {
        if (category) {
          category.width -= rankColPadding;
        }
        category = {category: field.category, count: 1, width: 0}
        categories.push(category)
      } else {
        category.count++;
      }
      let theWidth = field.width ? (field.width+rankColPadding) : (rankColWidth+rankColPadding);
      category.width += theWidth;
    })

    let headerContainerSelector  = "#hist-chart-categories"
    let headerSelector  = "#hist-chart-categories .category-header"
    d3.select(headerContainerSelector).style("margin-left", (rankColWidthRank+rankNameWidth+rankColPadding+rankColWidthScore+rankColPadding+rankColWidthTotal) + "px");
    d3.selectAll(headerSelector).remove();


    categories.forEach(function(cat,i) {
      d3.select(headerContainerSelector)
        .append("span")
        .attr("class", "category-header")
        .style("min-width", function() {
          return cat.width + "px";
        })
        .style("margin-left", function() {
          if (i > 0) {
            return rankCategoryPadding+rankColPadding + "px";  
          }  else {
            return "0px"
          }         
        })
        .text(function(d,i) {
          return capitalize(cat.category);
        })
    })

    promiseMetricGetData(fieldNames, null, {includeDefaultFields: false, includeNameField: true})
    .then(function(data) {



      let chartContainerSelector  = "#hist-chart"
      d3.select(chartContainerSelector).style("margin-left", (rankColWidthRank + rankNameWidth+rankColPadding+rankColWidthScore+rankColPadding+rankColWidthTotal+rankColPadding) + "px");


      let chartSelector           = "#hist-chart .hist"
      d3.selectAll(chartSelector).remove()
      histChartMap = {};

      let prevCategory = null;

      getSelectedMetricFields().forEach(function(selectedField, i) {
        let selectedFieldName = selectedField.name.split(" ").join("_");

        let clazzes = "hist " + selectedFieldName + " " + selectedField.category;
        let selection = d3.select(chartContainerSelector).append("div").attr("class", clazzes);
        if (prevCategory != null && prevCategory != selectedField.category) {
          selection.style("margin-left", rankCategoryPadding + "px");
        }

        let nonNullValues = data.filter(function(d) {
          return d[selectedField.name];
        })


        let histChart = histogram();
        histChart.width(selectedField.width ? (selectedField.width+rankColPadding) : (rankColWidth+rankColPadding))
                 .height(70)
                 .margin({top: 10, bottom: 10, left: 0, right: rankColPadding})
                
        histChart.xValue(function(d) {
          return d[selectedField.name];
        })
        histChart.showAxis(false)
        histChart.rankDescending(selectedField.rankDescending)
        selection.datum(data)
        histChart(selection);

        histChartMap[selectedField.name] = histChart;

        prevCategory = selectedField.category;

      })
      d3.select(chartContainerSelector).select(".hint").style("display", "initial");

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

function getSelectedCollegeIds() {
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
    inheritClass: true,
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


function highlightHistograms(collegeName) {
  for (var key in histChartMap) {
    let histChart = histChartMap[key];
    histChart.highlight()([collegeName]);
  }
}

function unhighlightHistograms(collegeName) {
  for (var key in histChartMap) {
    let histChart = histChartMap[key];
    histChart.removeHighlight()([collegeName]);
  }
}

function highlightHistogram(collegeName, field) {
  let histChart = histChartMap[field.name];
  histChart.highlight()([collegeName]);
}

function getMetricFields() {
  d3.json("getMetricDataDictionary",
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

  })
}







