
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