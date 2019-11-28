class Search {
	constructor() {
    this.collegeSelector   = '#search-dialog #select-college';
		this.regionSelector   = '#search-dialog #select-region';
    this.programSelector  = '#search-dialog #select-program';
    this.controlSelector  = '#search-dialog #select-control';
    this.filteredCollegesSelector = "#search-dialog #filtered-colleges";
    this.usnewsSelector = "#search-dialog #usnews-cb";

    this.selectAllSelector = "#search-dialog #select-all-cb";
    this.selectAll = true;

    this.selectedColleges = []
    
    this.selectedDegreeLevel = []
    this.selectedDegreeLevelLabels = []

    this.selectedRegions = []
    this.selectedRegionLabels = []

    this.selectedPrograms = []

    this.selectedControl = []
    this.selectedControlLabels = []

    this.usnewsChecked = false;
    this.minACT = null;
    this.maxACT = null;

    this.allColleges = []
    this.filteredColleges = []
    this.checkedColleges = []

    this.degrees = {
      '1': 'certificate',
      '2': 'associates',
      '3': 'bachelors'
    }


    this.fieldNames = ["id", "name", "usnews_2019_rank", "control", "region", 
                       "degrees_awarded predominant_recoded", "city", "state",
                       "act_scores midpoint cumulative"]

    this.customFilter = null;

    this.ivySchools = [
      "Harvard University",
      "Yale University",
      "University of Pennsylvania",
      "Princeton University",
      "Columbia University in the City of New York",
      "Brown University",
      "Dartmouth College",
      "Cornell University"
    ]

    this.ivyPlusSchools = [
      "Harvard University",
      "Yale University",
      "University of Pennsylvania",
      "Princeton University",
      "Columbia University in the City of New York",
      "Brown University",
      "Dartmouth College",
      "Cornell University",
      "Massachusetts Institute of Technology",
      "Stanford University",
      "Duke University",
      "University of Chicago",
      "Johns Hopkins University"
     ]


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

      $('input:radio[name="degree_option"]').change(function(){
        let key = $(this).val();
        self.selectDegreeLevel(key, self.degrees[key], true)
        self.filterColleges();
      });



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
          //if (self.fieldNames.indexOf(program) < 0) {
          //  self.fieldNames.push(program)
          //}

          let tokens = program.split("program_bachelors");
          let display = tokens[1].substring(1, tokens[1].length)
          display = display.split("_").join(" ");
          display = display[0].toUpperCase() + display.slice(1); 
          options.push({ label: display, title: display, value: program } );

        })
        $(self.programSelector).multiselect('dataprovider', options);

        promiseMetricGetData(self.fieldNames, null, {includeDefaultFields: false})
        .then(function(colleges) {
          self.allColleges = colleges.sort(function(a,b) {
            return a.name.localeCompare(b.name);
          })
          let options = []
          colleges.forEach(function(college) {
            options.push({ label: college.name, title: college.name, value: college.name } );
          })
          $(self.collegeSelector).multiselect('dataprovider', options);


            self.filterColleges({selectAll: true});
            self.selectAllColleges();


            resolve();


        })

      })



    })


	}

  getBadges() {
    let self = this;

    let buf = "";

    if (self.customFilter == "ivy") {
      buf = self.formatBadge(["Ivy League colleges"])
    } else if (self.customFilter == "ivy_plus") {
      buf = self.formatBadge(["Ivy League + colleges"])
    } else {
      buf += self.formatBadgeUSNews();
      if (self.selectedColleges.length > 3) {
        buf += self.formatBadge(self.selectedColleges.slice(0,2), ", ...");

      } else {
        buf += self.formatBadge(self.selectedColleges);
      }
      buf += self.formatDegreeLevelBadge();
      buf += self.formatRegionBadge();
      buf += self.formatControlBadge();
      buf += self.formatBadge(self.selectedPrograms);
      buf += self.formatBadgeACT();

    }


    return buf;
  }

  formatBadge(items, appendString="") {
    let self = this;
    if (items.length > 0) {
      return "<span class='badge badge-secondary'>" + items.join(", ").split("_").join(" ") + appendString + "</span>";
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
      self.checkCollege(self.filteredColleges[i].id, self.selectAll)
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
        self.selectedDegreeLevel = []
        self.selectedDegreeLevelLabels = []
        self.selectedDegreeLevel.push(degreeLevelKey);
        self.selectedDegreeLevelLabels.push(degreeLevelLabel);
      }
    } else {
      let idx = self.selectedDegreeLevel.indexOf(degreeLevelKey);
      self.selectedDegreeLevel.splice(idx,1)
      self.selectedDegreeLevelLabels.splice(idx,1)
    }

  }
  resetFilters() {

    let self = this;

    d3.select("#degree-radio-buttons.btn-group .btn-sm.active").classed("active", false)


    $(self.usnewsSelector).prop( "checked", false );

    $(self.programSelector).multiselect('deselect', self.selectedPrograms, false);
    $(self.collegeSelector).multiselect('deselect', self.selectedColleges, false);
    $(self.regionSelector).multiselect('deselect', self.selectedRegions, false);
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
   
    self.filterColleges();

  }

  applyCustomFilter(customFilter) {
    let self = this;
    self.customFilter = customFilter;
    if (customFilter == "usnews_top_200") {
      self.resetFilters();
      $(self.usnewsSelector).prop( "checked", true );
      self.usnewsChecked = true;
      self.filterColleges({selectAll: true});
    } else if (customFilter == "public_high_act") {
      self.resetFilters();
      d3.select("#degree-radio-buttons.btn-group .btn-sm.active").classed("active", false)
      d3.select("#degree-radio-buttons.btn-group #degree-bachelors-radio").classed("active", true)
      $(self.controlSelector).multiselect('select', ['1'], true)
      $('#minACT').val("30");
      self.minACT = 30;
      self.filterColleges({selectAll: true});
    } else if (customFilter == "west_coast") {
      self.resetFilters();
      $(self.regionSelector).multiselect('select', ['8'], true)
      d3.select("#degree-radio-buttons.btn-group .btn-sm.active").classed("active", false)
      d3.select("#degree-radio-buttons.btn-group #degree-bachelors-radio").classed("active", true)
      self.filterColleges({selectAll: true});
    } else if (customFilter == "ivy_plus") {
      self.resetFilters();
      self.selectedColleges = self.ivyPlusSchools;
      self.filterColleges({selectAll: true});
    } 
  }
  filterColleges(options={selectAll:false}) {
    let self = this;

    $(self.selectAllSelector).prop( "checked", false );
    self.checkedColleges = []
    $("#search-dialog  #rank-button").attr("disabled", true);
  

    if (self.selectedColleges.length == 0 &&
        //self.selectedPrograms.length == 0 &&
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

/*
        let matchesProgram = self.selectedPrograms.length == 0;
        if (self.selectedPrograms.length > 0) {
          self.selectedPrograms.forEach(function(programKey) {
            if (!matchesProgram && college[programKey] == 1) {
              matchesProgram = true;
            }
          })
        } 
*/

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
              //self.selectedPrograms.length > 0 ||
              self.selectedRegions.length > 0 ||
              self.selectedControl.length > 0 ||
              self.usnewsChecked ||
              self.minACT ||
              self.maxACT) {
            return (matchesUsnews && matchesDegreeLevel && matchesRegion 
              //&& matchesProgram 
              && matchesControl && matchesACTMin && matchesACTMax);
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


    self.showFilteredColleges(options)
  }

  showFilteredColleges(options) {
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
      .attr("checked", function(d,i) {
        if (options && options.selectAll) {
          return "checked";
        } else {
          return null;
        }
      })
      .on("change", function(d,i) {
        let checked = d3.select(this).property("checked");
        self.checkCollege(d.id, checked)
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


    if (options && options.selectAll) {
      $(self.selectAllSelector).prop( "checked", true );
      self.filteredColleges.forEach(function(college) {
        self.checkedColleges.push(college.id);
      })     
      $("#search-dialog  #rank-button").attr("disabled", false); 
      $(self.selectAllSelector).prop( "checked", true );
    }

  }
  checkCollege(collegeId, checked) {
    let self = this;
    if (checked) {
      if (self.checkedColleges.indexOf(collegeId) < 0) {
        self.checkedColleges.push(collegeId);
      }
    } else {
      let idx = self.checkedColleges.indexOf(collegeId);
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