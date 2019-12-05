class Swarm {
	constructor(containerSelector="#swarm-container",  height=90, radius=2) {
		this.container = d3.select(containerSelector)
		this.height = height;
		this.maxRadius = radius;
    this.swarm = null;
    this.fields = null;
	}


	load(data, fields) {
		let self = this;
    self.fields = fields;

    if (data == null || data.length == 0) {
      return;
    }
    
		self.container.selectAll("svg").remove();


    let prevCategory = null;
    fields.forEach(function(field, i) {

      var maxValue = d3.max(data, function(d) {
        if (d[field.name]) {
          return +d[field.name];
        } else {
          return 0;
        }
      })


      field.swarmScaleX = d3.scaleLinear()
        .domain(d3.extent([0, maxValue]))

      if (field.rankDescending) {
        field.swarmScaleX.range([field.width-(self.maxRadius*2), self.maxRadius])

      } else {
        field.swarmScaleX.range([self.maxRadius, field.width-(self.maxRadius*2)])

      }

      let margin = {left: 0, right: rankColPadding};
      if (prevCategory != null && prevCategory != field.category) {
        margin.left = rankCategoryPadding;
      }

    	self.drawSwarm(data, field, i, margin)

      prevCategory = field.category;

    })

	}

	drawSwarm(data, field, idx, margin) {
		let self = this;

		var maxHeight = self.height/2-self.maxRadius;


    var svg = self.container.append("svg")
      .attr("width", field.width)
      .attr("height", self.height)
      .style("margin-left", margin.left + "px")
      .style("margin-right", margin.right + "px")

    var axis = svg.append("line")
    	.attr("id", "axis");
    
    var nodeContainer = svg.append("g")
      .attr("id", idx)
      .attr("class", "node-container");
		

    axis.attr("x1", 0)
          .attr("y1", self.height/2)
          .attr("x2", field.width)
          .attr("y2", self.height/2);      

		var swarm = d3
		  .beeswarm()
		  .data(data.filter(function(d) {
		  	return d[field.name] > 0
		  })) // set the data to arrange
		  .distributeOn(function(d) {
		    // set the value accessor to distribute on
		    return field.swarmScaleX(d[field.name]); // evaluated once on each element of data
		  }) // when starting the arrangement
		  .radius(self.maxRadius) // set the radius for overlapping detection
		  .orientation('horizontal') // set the orientation of the arrangement
		  // could also be 'vertical'
		  .side('symetric') // set the side(s) available for accumulation
		  // could also be 'positive' or 'negative'
		  .arrange(); // launch arrangement computation;
	
	  var arrangementMax = -Infinity;
    swarm.forEach(function(bee) {
      if (arrangementMax < Math.abs(bee.y)) {
        arrangementMax = Math.abs(bee.y);
      }
    })		
		
		nodeContainer.selectAll("circle")
      .data(swarm)
      .enter()
      .append("circle")
      .attr("class", "point")
		  .attr('cx', function(bee) {
		    return bee.x;
		  })
		  .attr('cy', function(bee) {
		  	let extremeAccumulation = null;
	      if (arrangementMax <= maxHeight) {
	        extremeAccumulation = bee.y;
	      } else {
			  	extremeAccumulation = maxHeight*bee.y/arrangementMax;
	      }
	      return self.height/2 + extremeAccumulation;
			  
			})
		  .attr('r', self.maxRadius)
		 

	}

  highlight(name) {
    let self = this;

    self.container.selectAll('circle.highlight').remove();
    self.container.selectAll('text.highlight').remove();

    let data = self.container.selectAll('circle')
      .filter(function(d) { 
        return d.datum.name === name; 
      })
      .data();
    let elements = self.container.selectAll('circle')
      .filter(function(d) { 
        return d.datum.name === name; 
      })
    elements.nodes().forEach(function(element, i) {
      let svg = element.ownerSVGElement;
      let dataElem = data[i];

      let fieldIdx  = d3.select(svg).select("g.node-container").attr("id");
      let field     = self.fields[fieldIdx]

      let circle = d3.select(svg).append("circle")
        .attr("opacity", 0)
        .attr("class", "highlight")
        .attr("cx", dataElem.x  )
        .attr("cy", element.cy.baseVal.value)
        .attr("r", 1 )


      circle.transition()
        .duration(1000)
        .attr("opacity", "1")
        .attr("r", self.maxRadius + 1)

      circle.transition()
        .duration(1500)
        .attr("opacity", "1")
        .attr("r", self.maxRadius * 2)

      let xPosText = dataElem.x;
      if (xPosText < 18) {
        xPosText = 18;
      } else if (xPosText+18 > field.width) {
        xPosText = field.width - 18;
      }


      let label = d3.select(svg).append("text")
       .attr("class", "highlight")
       .attr("y", 10)
       .attr("x", xPosText)
       .attr("opacity", 0)
       .text(dataElem.datum[field.name])


      label.transition()
        .duration(1000)
        .attr("opacity", 1)

    })

  }

  unhighlight(name) {
    let self = this;
    //self.container.selectAll('circle.highlight').remove();
    //.container.selectAll('text.text').remove();
  }

}
	
		