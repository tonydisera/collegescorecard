let fields = []
let selectedFieldMap = {}
let histChartMap = {};
let search = null;
let rankChart = null;
let metricCategories = ['selectivity', 'instruction', 'cost', 'outcome', 'diversity', 'rank']

let rankHeaderHeight    = 100;
let rankRowHeight       = 24;
let rankBarHeight       = 15;

let rankColPadding      = 20;
let rankColWidth        = 80;
let rankColWidthTotal   = 130;
let rankColWidthScore   = 10;
let rankNameWidth       = 275;
let rankColWidthRank    = 60;
let rankMaxNameLength   = 46;
let rankCategoryPadding = 0;

let slidebarClicks = 0;

let tippyShowCount = 0;
let tippyDeltaCount = 0;


let rankedCollegeData = null;
let allCollegeData = null;
let swarm = null;

let distributionOption = 'ranked';



$(document).ready(function() {

  init();  
  

});

function init() {

  $(document).on('click', '.yamm .dropdown-menu', function(e) {
    e.stopPropagation()
  })

  swarm = new Swarm("#swarm-container", 80, 2);


  initFieldDropdown();

  rankChart = rankchart();
  rankChart.margin( { top: 60, right: 5, bottom: 0, left: 0 } )

  rankChart.headerHeight(rankHeaderHeight);
  rankChart.colWidth(rankColWidth);
  rankChart.colPadding(rankColPadding)
  rankChart.rowHeight(rankRowHeight);
  rankChart.barHeight(rankBarHeight);
  rankChart.weightHeight(14)
  rankChart.weightWidth(rankColWidth/4)
  rankChart.colWidthTotal(rankColWidthTotal);
  rankChart.nameWidth(rankNameWidth);
  rankChart.colWidthRank(rankColWidthRank);
  rankChart.maxNameLength(rankMaxNameLength);
  rankChart.categoryPadding(rankCategoryPadding)
  rankChart.colWidthScore(rankColWidthScore)
  rankChart.onRescale(function(data) {
    rankChart.initFieldDescriptors()()
    showCategoryHeadings();
    promiseShowHistogramCharts();
    showSwarm();
    showRescaledRankings(data)
  })
  rankChart.onHover(function(record) {
    highlightHistogram(record.name, record.field)
    swarm.highlight(record.name)
  })
  rankChart.onHoverEnd(function(record) {
    unhighlightHistograms(record.name);
    swarm.unhighlight()
  })
  rankChart.onHoverRow(function(record) {
    highlightHistograms(record.name)
    swarm.highlight(record.name)
  })
  rankChart.onHoverRowEnd(function(record) {
    unhighlightHistograms(record.name);
    swarm.unhighlight()
  })  
  rankChart.onRowClicked(function(college) {
    swarm.highlight(college.name)
    showCollegeDetail(college)
  })

  d3.select('#loading').style("display", "initial")

  search = new Search();
  search.promiseInit()
  .then(function() {
    search.applyCustomFilter("usnews_top_200");
    rankColleges();
    setTimeout(function() {
      pulsateTourButton();
    }, 5000)
  })

  $('#search-dialog').on('hidden.bs.modal', function (e) {
    deselectFilterButtons();
  })

  $('#search-colleges-button').click(function() {
    deselectFilterButtons();
    if (search.customFilter != null) {
      search.resetFilters();
    }
    search.customFilter = null; 
    $("#search-dialog").modal()
  })

  $('input:radio[name="searchoption"]').change(function(){
      let option = $(this).val();

      search.applyCustomFilter(option);
      rankColleges();
  });


  $('#distribution-controls input:radio[name="distoption"]').change(function(){
    let key = $(this).val();
    let checked = d3.select(this).property("checked");
    if (checked) {
      distributionOption = key;
      if (distributionOption == 'all') {
        hideSwarm();
        promiseShowHistogramCharts();
      } else if (distributionOption == 'ranked') {
        hideHistograms();
        showSwarm();
      } else if (distributionOption == 'none') {
        hideHistograms();
        hideSwarm();
      }
    } else {
      distributionOption = 'none';
    }

  });


}

var hideSwarm = function() {
  d3.select("#distribution-display").text("")
  d3.select("#swarm-container").classed("hide", true)
  d3.select ("#distribution-display").classed("hide", true)
}

var showSwarm = function() {
  if (distributionOption == 'ranked') {
    d3.select("#swarm-container").classed("hide", false)
    d3.select ("#distribution-display").classed("hide", false)
    d3.select("#distribution-container").style("padding-left", 
       (rankColWidthRank 
          + rankNameWidth 
          + rankColPadding 
          + rankColWidthScore 
          + rankColWidthTotal - 120) + "px");
    d3.select("#distribution-display").text("Summary across ranked colleges")
    swarm.load(rankedCollegeData, getSelectedMetricFields())    
  }
}

hideHistograms  = function() {
  d3.select("#distribution-display").text("")
  d3.select("#hist-chart-container").classed("hide", true)
  d3.select ("#distribution-display").classed("hide", true)

}

promiseShowHistogramCharts = function() {
  return new Promise(function(resolve, reject) {
    if (distributionOption == 'all') {
      d3.select("#distribution-display").text("Summary across all colleges")
      d3.select ("#distribution-display").classed("hide", false)

      d3.select("#hist-chart-container").classed("hide", false)

      let fieldNames = getSelectedFieldNames();
      promiseMetricGetData(fieldNames, null, {includeDefaultFields: false, includeNameField: true})
      .then(function(data) {

        allCollegeData = data;


        d3.select("#distribution-container").style("padding-left", 
          (rankColWidthRank 
          + rankNameWidth 
          + rankColPadding 
          + rankColWidthScore 
          + rankColWidthTotal - 120) + "px");


        let chartSelector           = "#hist-chart-container .hist"
        let chartContainerSelector  = "#hist-chart-container"
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
                   .height(50)
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
    } else {
      resolve();
    }

  })
}

var pulsateTourButton = function() {
    $('#tour-button').pulsate({
    color: "rgb(78, 121, 167)",
    reach:   13,
    pause:   700,
    speed:   1300,
    glow:    true,
    repeat:  4 });
}

var startTour = function() {
  introJs().start();

}

var capitalize = function(theString) {
  return theString.charAt(0).toUpperCase() + 
         theString.slice(1)
}


function deselectFilterButtons() {
  d3.select("#search-colleges-container .btn-group .btn-sm.active").classed("active", false)
}

function rankCollegesAdvancedSearch() {
  deselectFilterButtons();
  search.customFilter = null;
  rankColleges();
}

function rankColleges() {
  d3.select('#loading').style("display", "initial")
  search.close();
  
  d3.selectAll("#filter-badges badge").remove();
  d3.select("#filter-badges").html(search.getBadges())
  d3.select("#rank-college-count").text("Ranking " + getSelectedCollegeIds().length + " Colleges")

  showCategoryHeadings();

  promiseShowHistogramCharts()
  .then(function() {
    promiseShowRankings(getSelectedCollegeIds())
    .then(function() {
        showSwarm();

        d3.select('#loading').style("display", "none")

        if (tippyShowCount < 2) {
          tippyShowCount++
          setTimeout(function() {
            tippy('#rank-chart #row-0 text.name', {
              content: 'Hover over or click on row for more info',
              placement: 'top',
              theme: 'blue',
            });
            document.querySelector('#rank-chart #row-0 text.name')._tippy.show();

            setTimeout(function() {
              if (document.querySelector('#rank-chart #row-0 text.name')._tippy) {
                document.querySelector('#rank-chart #row-0 text.name')._tippy.hide();
              }  

              tippy('.col-header#col-metric-1 rect#weight-square-1', {
                content: 'Click on squares to adjust weight',
                placement: 'bottom',
                theme: 'blue'
              });
              document.querySelector('.col-header#col-metric-1 rect#weight-square-1')._tippy.show();
              setTimeout(function() {
                if (document.querySelector('.col-header#col-metric-1 rect#weight-square-1')._tippy) {
                  document.querySelector('.col-header#col-metric-1 rect#weight-square-1')._tippy.hide();
                }
              }, 2000)



            }, 2000)

          },1000)

        }

    


    })
  })


}


function promiseShowRankings(selectedCollegeIds) {


  return promiseGetCollegeData(selectedCollegeIds, getSelectedFieldNames())
  .then(function(selectedCollegeData) {
    rankedCollegeData = selectedCollegeData;

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

  if ($('#rank-chart .delta text') && $('#rank-chart .delta text').length > 0) {
    if (tippyDeltaCount < 2) {
      tippyDeltaCount++
  
      setTimeout(function() {
        tippy('#rank-chart .delta text', {
          content: 'See how rank changed after weights are adjusted',
          placement: 'top',
          theme: 'blue',
        });
        document.querySelector('#rank-chart .delta text')._tippy.show();

        setTimeout(function() {
          if (document.querySelector('#rank-chart .delta text') && document.querySelector('#rank-chart .delta text')._tippy) {
            document.querySelector('#rank-chart .delta text')._tippy.hide();
          }
        }, 5000)
      } ,1000)

    }
  
  }

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



function showCategoryHeadings() {


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
  d3.select(headerContainerSelector).style("margin-left", 
    (rankColWidthRank 
      + rankNameWidth 
      + rankColPadding 
      + rankColWidthScore 
      + rankColWidthTotal)
     + "px");

  
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
    buttonText: function(options, select) 
    {
      if (options.length === 0) {
        return 'Pick Metrics';
      }
      else  {
        return 'Pick Metrics';
      }         
    },
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
      let optGroup = {label: capitalize(category), children: null};
      optGroup.children = fields.filter(function(field) {
        return field.category == category;
      })
      .map(function(field) {
        return { label: field.display, 
                 title: field.display, 
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








