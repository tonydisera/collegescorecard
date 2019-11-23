let defaultMetricFieldNames = [
  "id",
  "name",
  "admission_rate overall",
  "act_scores midpoint cumulative",
  "act_scores 75th_percentile cumulative",
  "faculty_salary",
  "ft_faculty_rate",
  "instructional_expenditure_per_fte",
  "demographics race_ethnicity black",
  "demographics race_ethnicity hispanic",
  "demographics race_ethnicity asian",
  "demographics median_family_income",
  "tuition in_state",
  "tuition out_of_state",
  "cost attendance academic_year",
  "median_debt_suppressed overall",
  "completion_rate_4yr_150nt",
  "retention_rate four_year full_time",
  "6_yrs_after_entry median",
  "10_yrs_after_entry working_not_enrolled mean_earnings",
  "act_scores midpoint cumulative"
]
let currentCollege = null;

function promiseGetData(fieldNames) {
  return new Promise(function(resolve, reject) {

    if (fieldNames.length == 0) {
      resolve([])
    } else {


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

function promiseMetricGetData(fieldNames, collegeIds) {
  return new Promise(function(resolve, reject) {

    if (fieldNames.length == 0) {
      resolve([])
    } else {
      defaultMetricFieldNames.forEach(function(defaultFieldName) {
        if (fieldNames.indexOf(defaultFieldName) < 0) {
          fieldNames.push(defaultFieldName);
        }

      })

      let url = "getMetricData?fields=" + fieldNames.join(",");
      if (collegeIds && collegeIds.length > 0) {
        url += "&ids=" + collegeIds.join(",")
      }

      d3.json(url,
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
        if (d[info.y.field] == 'PrivacySuppressed') {
          return null;
        } else {
          return d[info.y.field];        
        }
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


function promiseGetDegreesOffered() {
  return new Promise(function(resolve, reject) {

    d3.json("getDegreesOffered",
    function (err, data) {
      if (err) {
        console.log(err)
        reject(err)
      }
      let records = data.map(function(rec) {
        return rec[0];
      })
      resolve(records)
    })
  })

}

function showCollegeDetail(college) {
  if (college == currentCollege && ($("#college-detail.sb-active").length == 1)) {
    currentCollege = null;
    setTimeout(function() {
      $("#slide-right-button").click();      

    })

  } else {
    currentCollege = college;

    $('#college-detail #name').text(college.name)
    $('#college-detail #admission-rate').text(college["admission_rate overall"])
    $('#college-detail #act-midpoint').text(college["act_scores midpoint cumulative"])
    $('#college-detail #act-75pctl').text(college["act_scores 75th_percentile cumulative"])
    $('#college-detail #faculty-salary').text(college["faculty_salary"])
    $('#college-detail #full-time-faculty-ratio').text(college["ft_faculty_rate"])
    $('#college-detail #instructional-cost-per-fte').text(college["instructional_expenditure_per_fte"])
    $('#college-detail #diversity-pct-black').text(college["demographics race_ethnicity black"])
    $('#college-detail #diversity-pct-hispanic').text(college["demographics race_ethnicity hispanic"])
    $('#college-detail #diversity-pct-asian').text(college["demographics race_ethnicity asian"])
    $('#college-detail #median-hh-income').text(college["demographics median_family_income"])
    $('#college-detail #tuition-in-state').text(college["tuition in_state"])
    $('#college-detail #tuition-out-of-state').text(college["tuition out_of_state"])
    $('#college-detail #cost').text(college["cost attendance academic_year"])
    $('#college-detail #median-debt').text(college["median_debt_suppressed overall"])
    $('#college-detail #completion-rate').text(college["completion_rate_4yr_150nt"])
    $('#college-detail #retention-rate').text(college["retention_rate four_year full_time"])
    $('#college-detail #median-salary-6-yrs').text(college["6_yrs_after_entry median"])
    $('#college-detail #median-salary-10-yrs').text(college["10_yrs_after_entry working_not_enrolled mean_earnings"])

    setTimeout(function(){
      
      if ($("#college-detail.sb-active").length == 0) {
        $("#slide-right-button").click();                
      }

    },1);

  }
  


}