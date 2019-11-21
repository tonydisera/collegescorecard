class Search {
	constructor() {
    this.collegeSelector   = '#search-dialog #select-college';
    this.degreeLevelSelector   = '#search-dialog #select-degree-level';
		this.regionSelector   = '#search-dialog #select-region';
    this.programSelector  = '#search-dialog #select-program';
    this.controlSelector  = '#search-dialog #select-control';
    this.filteredCollegesSelector = "#search-dialog #filtered-colleges";
    this.usnewsSelector = "#search-dialog #usnews-cb";

    this.selectAllSelector = "#search-dialog #select-all-cb";
    this.selectAll = true;

    this.selectedColleges = []
    
    this.selectedDegreeLevel = ["3"]
    this.selectedDegreeLevelLabels = ["Bachelors"]

    this.selectedRegions = []
    this.selectedRegionLabels = []

    this.selectedPrograms = []

    this.selectedControl = ["1"]
    this.selectedControlLabels = ["Public"]

    this.usnewsChecked = false;
    this.minACT = 30;
    this.maxACT = null;

    this.allColleges = []
    this.filteredColleges = []
    this.checkedColleges = []


    this.fieldNames = ["usnews_2019_rank", "control", "region", 
                       "degrees_awarded predominant_recoded", "city", "state"]



	}

	promiseInit() {
    let self = this;

    return new Promise(function(resolve, reject) {


      $(self.selectAllSelector).on("change", 
      function(d,i) {
          let checked = d3.select(this).property("checked");
          self.selectAll = checked;
          self.selectAllColleges();
      })

      $(self.usnewsSelector).on("change", 
      function(d,i) {
          let checked = d3.select(this).property("checked");
          self.usnewsChecked = checked;
          d3.select("#usnews-cb-label").classed("is-checked", self.usnewsChecked)
          self.filterColleges();
      })

      $(self.degreeLevelSelector).multiselect(
      { 
        buttonWidth: '400px',
        nonSelectedText: "Predominant Degree Awarded",
        onChange: function(options, checked) {
          if (Array.isArray(options)) {
            options.forEach(function(option) {
              let key = option[0].value
              let label = option[0].label
              self.selectDegreeLevel(key, label, checked);
            })
          } else {
            let key = options[0].value
            let label = options[0].label
            self.selectDegreeLevel(key, label, checked);
          }

        },
        onDropdownHide: function(event) {
          self.filterColleges();
        }    
      })
       $(self.degreeLevelSelector).multiselect('select', ['3'], true)

      $(self.collegeSelector).multiselect(
      { enableCaseInsensitiveFiltering: true,
        enableFiltering: true,
        buttonWidth: '400px',
        nonSelectedText: "Search specific colleges",
        onChange: function(options, checked) {
          if (Array.isArray(options)) {
            options.forEach(function(option) {
              let rec = option[0].label
              self.selectCollege(rec, checked);
            })
          } else {
            let rec = options[0].label
            self.selectCollege(rec, checked);
          }

        },
        onDropdownHide: function(event) {
          self.filterColleges();
        }    
      })

      $(self.regionSelector).multiselect(
      { enableCaseInsensitiveFiltering: true,
        buttonWidth: '400px',
        nonSelectedText: "Select regions",
        onChange: function(options, checked) {
          if (Array.isArray(options)) {
            options.forEach(function(option) {
              let key = option[0].value;
              let label = option[0].label;
              self.selectRegion(key, label, checked);
            })
          } else {
            let key = options[0].value;
            let label = options[0].label;
            self.selectRegion(key, label, checked);
          }

        },
        onDropdownHide: function(event) {
          self.filterColleges();
        }    
      })

      $(self.programSelector).multiselect(
      { enableCaseInsensitiveFiltering: true,
        buttonWidth: '400px',
        nonSelectedText: "Select 4 yr degrees offered",
        onChange: function(options, checked) {
          if (Array.isArray(options)) {
            options.forEach(function(option) {
              let rec = option[0].value
              self.selectProgram(rec, checked);
            })
          } else {
            let rec = options[0].value
            self.selectProgram(rec, checked);
          }

        },
        onDropdownHide: function(event) {
          self.filterColleges();
        }    
      })

      $(self.controlSelector).multiselect(
      { enableCaseInsensitiveFiltering: true,
        nonSelectedText: "Control",
        buttonWidth: '400px',
        onChange: function(options, checked) {
          if (Array.isArray(options)) {
            options.forEach(function(option) {
              let key = option[0].value
              let label = option[0].label
              self.selectControl(key, label, checked);
            })
          } else {
            let key = options[0].value
            let label = options[0].label
            self.selectControl(key, label, checked);
          }

        },
        onDropdownHide: function(event) {
          self.filterColleges();
        }    
      })
      $(self.controlSelector).multiselect('select', ['1'], true)


      $('#minACT').on("focusout", function(event) {
        self.minACT = $('#minACT').val();
        if (self.minACT == "") {
          self.minACT = null;
        }
        d3.select("#labelACT").classed("has-value", self.minACT != null || self.maxACT != null)
        self.filterColleges();
      })
      $('#maxACT').on("focusout", function(event) {
        self.maxACT = $('#maxACT').val();
        if (self.maxACT == "") {
          self.maxACT = null;
        }
        d3.select("#labelACT").classed("has-value", self.minACT != null || self.maxACT != null)
        self.filterColleges();
      })


      promiseGetDegreesOffered()
      .then( function(programs) {
        
        let options = []
        programs.forEach(function(program) {
          if (self.fieldNames.indexOf(program) < 0) {
            self.fieldNames.push(program)
          }

          let tokens = program.split("program_bachelors");
          let display = tokens[1].substring(1, tokens[1].length)
          display = display.split("_").join(" ");
          display = display[0].toUpperCase() + display.slice(1); 
          options.push({ label: display, title: display, value: program } );

        })
        $(self.programSelector).multiselect('dataprovider', options);

        promiseMetricGetData(self.fieldNames)
        .then(function(colleges) {
          self.allColleges = colleges.sort(function(a,b) {
            return a.name.localeCompare(b.name);
          })
          let options = []
          colleges.forEach(function(college) {
            options.push({ label: college.name, title: college.name, value: college.name } );
          })
          $(self.collegeSelector).multiselect('dataprovider', options);


            self.filterColleges();
            self.selectAllColleges();

            resolve();


        })

      })



    })


	}

  getBadges() {
    let self = this;

    let buf = "";

    buf += self.formatBadgeUSNews();
    buf += self.formatBadge(self.selectedColleges);
    buf += self.formatDegreeLevelBadge();
    buf += self.formatRegionBadge();
    buf += self.formatControlBadge();
    buf += self.formatBadge(self.selectedPrograms);
    buf += self.formatBadgeACT();

    return buf;
  }

  formatBadge(items) {
    let self = this;
    if (items.length > 0) {
      return "<span class='badge badge-secondary'>" + items.join(", ").split("_").join(" ") + "</span>";
    } else {
      return "";
    }
  }

  formatRegionBadge() {
    let self = this;
    if (self.selectedRegionLabels.length > 0) {
      return "<span class='badge badge-secondary'>" +  self.selectedRegionLabels.join(", ") + "</span>";
    } else {
      return "";
    }
  }

  formatControlBadge() {
    let self = this;
    if (self.selectedControlLabels.length > 0) {
      return "<span class='badge badge-secondary'>" +  self.selectedControlLabels.join(", ") + "</span>";
    } else {
      return "";
    }
  }

  formatDegreeLevelBadge() {
    let self = this;
    if (self.selectedDegreeLevelLabels.length > 0) {
      return "<span class='badge badge-secondary'>" +  self.selectedDegreeLevelLabels.join(", ") + "</span>";
    } else {
      return "";
    }
  }

  formatBadgeACT(title, items) {
    let self = this;
    if (self.minACT != null && self.maxACT != null) {
      return "<span class='badge badge-secondary'>" + "ACT between " + self.minACT + "-" + self.maxACT + "</span>";
    } else if (self.minACT != null) {
      return "<span class='badge badge-secondary'>" + "ACT at least " + self.minACT + "</span>";
    } else if (self.maxACT != null) {
      return "<span class='badge badge-secondary'>" + "ACT lower or equal to " + self.maxACT + "</span>";
    } else {
      return "";
    }
  }

  formatBadgeUSNews(title, items) {
    let self = this;
    if (self.usnewsChecked) {
      return "<span class='badge badge-secondary'>" + "US News top 200 " + "</span>";
    }else {
      return "";
    }
  }

  selectAllColleges() {
    let self = this;
    for (var i=0; i < self.filteredColleges.length; i++) {
      $("#college-cb-" + i).prop("checked", self.selectAll);
      self.checkCollege(self.filteredColleges[i].name, self.selectAll)
    }
  }


  selectCollege(collegeName, checked) {
    let self = this;
    if (checked) {
      if (self.selectedColleges.indexOf(collegeName) < 0) {
        self.selectedColleges.push(collegeName);
      }
    } else {
      let idx = self.selectedColleges.indexOf(collegeName);
      self.selectedColleges.splice(idx,1)
    }
    d3.select(d3.select(self.collegeSelector).node().parentElement)
      .select('.multiselect-selected-text')
      .classed('has-selections', self.selectedColleges.length > 0);

  }
  selectRegion(regionKey, regionLabel, checked) {
    let self = this;
    if (checked) {
      if (self.selectedRegions.indexOf(regionKey) < 0) {
        self.selectedRegions.push(regionKey);
        self.selectedRegionLabels.push(regionLabel);
      }
    } else {
      let idx = self.selectedRegions.indexOf(regionKey);
      self.selectedRegions.splice(idx,1)
      self.selectedRegionLabels.splice(idx,1)
    }
    d3.select(d3.select(self.regionSelector).node().parentElement)
      .select('.multiselect-selected-text')
      .classed('has-selections', self.selectedRegions.length > 0);

  }
  selectProgram(programKey, checked) {
    let self = this;
    if (checked) {
      if (self.selectedPrograms.indexOf(programKey) < 0) {
        self.selectedPrograms.push(programKey);
      }
    } else {
      let idx = self.selectedPrograms.indexOf(programKey);
      self.selectedPrograms.splice(idx,1)
    }
    d3.select(d3.select(self.programSelector).node().parentElement)
      .select('.multiselect-selected-text')
      .classed('has-selections', self.selectedPrograms.length > 0);

  }
  selectControl(controlKey, controlLabel, checked) {
    let self = this;
    if (checked) {
      if (self.selectedControl.indexOf(controlKey) < 0) {
        self.selectedControl.push(controlKey);
        self.selectedControlLabels.push(controlLabel);
      }
    } else {
      let idx = self.selectedControl.indexOf(controlKey);
      self.selectedControl.splice(idx,1)
      self.selectedControlLabels.splice(idx,1)
    }

    d3.select(d3.select(self.controlSelector).node().parentElement)
      .select('.multiselect-selected-text')
      .classed('has-selections', self.selectedControl.length > 0);

  }
  selectDegreeLevel(degreeLevelKey, degreeLevelLabel, checked) {
    let self = this;
    if (checked) {
      if (self.selectedDegreeLevel.indexOf(degreeLevelKey) < 0) {
        self.selectedDegreeLevel.push(degreeLevelKey);
        self.selectedDegreeLevelLabels.push(degreeLevelLabel);
      }
    } else {
      let idx = self.selectedDegreeLevel.indexOf(degreeLevelKey);
      self.selectedDegreeLevel.splice(idx,1)
      self.selectedDegreeLevelLabels.splice(idx,1)
    }

    d3.select(d3.select(self.degreeLevelSelector).node().parentElement)
      .select('.multiselect-selected-text')
      .classed('has-selections', self.selectedDegreeLevel.length > 0);
    
  }
  resetFilters() {

    let self = this;


    $(self.usnewsSelector).prop( "checked", false );

    $(self.programSelector).multiselect('deselect', self.selectedPrograms, false);
    $(self.collegeSelector).multiselect('deselect', self.selectedColleges, false);
    $(self.regionSelector).multiselect('deselect', self.selectedRegions, false);
    $(self.degreeLevelSelector).multiselect('deselect', self.selectedDegreeLevel, false);
    $(self.controlSelector).multiselect('deselect', self.selectedControl, false);


    $('#minACT').val("");
    $('#maxACT').val("");
    self.minACT = null;
    self.maxACT = null;
    d3.select("#labelACT").classed("has-value", self.minACT != null || self.maxACT != null)


    self.selectedColleges = []
    self.selectedDegreeLevel = []
    self.selectedDegreeLevelLabels = []
    self.selectedRegions = []
    self.selectedRegionLabels = []
    self.selectedPrograms = []
    self.selectedControl = []
    self.selectedControlLabels = []
    self.usnewsChecked = false;


/*
    $(self.programSelector).multiselect('refresh');
    $(self.collegeSelector).multiselect('refresh');
    $(self.regionSelector).multiselect('refresh');
    $(self.controlSelector).multiselect('refresh');
    $(self.degreeLevelSelector).multiselect('refresh');
*/

    d3.select(d3.select(self.programSelector).node().parentElement)
      .select('.multiselect-selected-text')
      .classed('has-selections', self.selectedPrograms.length > 0);
    d3.select(d3.select(self.collegeSelector).node().parentElement)
      .select('.multiselect-selected-text')
      .classed('has-selections', self.selectedColleges.length > 0);
    d3.select(d3.select(self.regionSelector).node().parentElement)
      .select('.multiselect-selected-text')
      .classed('has-selections', self.selectedRegions.length > 0);
    d3.select(d3.select(self.controlSelector).node().parentElement)
      .select('.multiselect-selected-text')
      .classed('has-selections', self.selectedControl.length > 0);
    d3.select(d3.select(self.degreeLevelSelector).node().parentElement)
      .select('.multiselect-selected-text')
      .classed('has-selections', self.selectedDegreeLevel.length > 0);

    self.filterColleges();

  }
  filterColleges() {
    let self = this;

    $(self.selectAllSelector).prop( "checked", false );
    self.checkedColleges = []
    $("#search-dialog  #rank-button").attr("disabled", true);
  

    if (self.selectedColleges.length == 0 &&
        self.selectedPrograms.length == 0 &&
        self.selectedRegions.length == 0 &&
        self.selectedControl.length == 0 &&
        self.selectedDegreeLevel.length == 0 &&
        !self.usnewsChecked &&
        self.minACT == null &&
        self.maxACT == null) {
      self.filteredColleges = [];
    } else {
      self.filteredColleges = self.allColleges.filter(function(college) {

        let matchesCollege = false;
        if (self.selectedColleges.length > 0) {
          if (self.selectedColleges.indexOf(college.name) >= 0) {
            matchesCollege = true;
          }
        } 

        let matchesUsnews = !self.usnewsChecked;
        if (self.usnewsChecked && college["usnews_2019_rank"]) {
          matchesUsnews = true;
        }

        let matchesRegion = self.selectedRegions.length == 0;
        if (self.selectedRegions.length > 0) {
          if (college.region) {
            if (self.selectedRegions.indexOf(college.region.toString()) >= 0) {
              matchesRegion = true;
            }

          }
        } 

        let matchesProgram = self.selectedPrograms.length == 0;
        if (self.selectedPrograms.length > 0) {
          self.selectedPrograms.forEach(function(programKey) {
            if (!matchesProgram && college[programKey] == 1) {
              matchesProgram = true;
            }
          })
        } 

        let matchesControl = self.selectedControl.length == 0;
        if (self.selectedControl.length > 0) {
          if (self.selectedControl.indexOf(college.control.toString()) >= 0) {
            matchesControl = true;
          }
        } 


        let matchesDegreeLevel = self.selectedDegreeLevel.length == 0;
        if (self.selectedDegreeLevel.length > 0 && college["degrees_awarded predominant_recoded"]) {
          if (self.selectedDegreeLevel.indexOf(college["degrees_awarded predominant_recoded"].toString()) >= 0) {
            matchesDegreeLevel = true;
          }
        } 

        let matchesACTMin = self.minACT == null;
        if (self.minACT != null) {
          if (college["act_scores midpoint cumulative"] >= self.minACT) {
            matchesACTMin = true;
          }
        }
        let matchesACTMax = self.maxACT == null;
        if (self.maxACT != null) {
          if (college["act_scores midpoint cumulative"] <= self.maxACT) {
            matchesACTMax = true;
          }
        }

        if (matchesCollege) {
          return matchesCollege
        } else {
          if (self.selectedDegreeLevel.length > 0 ||
              self.selectedPrograms.length > 0 ||
              self.selectedRegions.length > 0 ||
              self.selectedControl.length > 0 ||
              self.usnewsChecked ||
              self.minACT ||
              self.maxACT) {
            return (matchesUsnews && matchesDegreeLevel && matchesRegion && matchesProgram && matchesControl && matchesACTMin && matchesACTMax);
          } else {
            return false;
          }
        }
      })      
    }
    self.filteredColleges.sort(function(a,b) {
      if (self.usnewsChecked && a["usnews_2019_rank"] && b["usnews_2019_rank"]) {
        return a["usnews_2019_rank"] - b["usnews_2019_rank"];
      } else {
        return a.name.localeCompare(b.name);
      }
    })
    self.showFilteredColleges()
  }

  showFilteredColleges() {
    let self = this;
    self.checkedColleges = [];
    d3.select("#filtered-college-count").text(self.filteredColleges.length)

    d3.select(self.filteredCollegesSelector).select(".list-group").remove();
    let listGroup = d3.select(self.filteredCollegesSelector)
      .append("ul")
      .attr("class", "list-group")
      .data([self.filteredColleges])

    var items = listGroup.selectAll(".list-group-item").data(function(d) {
        return d;
    });

    items.enter()
      .append("li")
      .attr("class", "list-group-item");

    let itemForms = listGroup.selectAll(".list-group-item")
       .append("div")
       .attr("class", "form-check");

    itemForms
      .append("input")
      .attr("type", "checkbox")
      .attr("id", function(d,i) {
        return "college-cb-" + i;
      })
      .attr("class", "form-checked-input")
      .on("change", function(d,i) {
        let checked = d3.select(this).property("checked");
        self.checkCollege(d.name, checked)
      })

    itemForms
      .append("label")
      .attr("class", "form-check-label")
      .attr("for", function(d,i) {
        return "college-cb-" + i;
      })
      .text(function(d,i) {
        return (i+1) + ".  " +  d.name
      })

  }
  checkCollege(collegeName, checked) {
    let self = this;
    if (checked) {
      if (self.checkedColleges.indexOf(collegeName) < 0) {
        self.checkedColleges.push(collegeName);
      }
    } else {
      let idx = self.checkedColleges.indexOf(collegeName);
      self.checkedColleges.splice(idx,1)
    }
    
    if (self.checkedColleges.length > 0) {
      $("#search-dialog  #rank-button").attr("disabled", false);
    } else {
      $("#search-dialog  #rank-button").attr("disabled", true);

    }
  }
  close() {
    $('#search-dialog ').modal('hide')
  }

}