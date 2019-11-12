$(document).ready(function() {
  
  
  init();
  
});

function init() {
  
  showScatterplot({
      selector: "#scatterplot1",
      width: 500,
      height: 400,
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
    width: 800,
    height: 600,
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



