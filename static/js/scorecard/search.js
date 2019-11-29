class Search {
	constructor() {
    this.filteredCollegesSelector = "#search-dialog #filtered-colleges";
    this.usnewsSelector = "#search-dialog #usnews-cb";

    this.selectAllSelector = "#search-dialog #select-all-cb";
    this.selectAll = true;

    this.selectedColleges = []
    
    this.selectedDegreeLevel = []
    this.selectedDegreeLevelLabels = []

    this.selectedRegions = []

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
      '1': 'Certificate',
      '2': 'Associates',
      '3': 'Bachelors'
    }
    this.controls = {
      '1': 'Public',
      '2': 'Private',
      '3': 'Private for profit'
    }

    this.RANK_COLLEGE_LIMIT = 400;


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


      $('input:checkbox[name="control_option"]').change(function(){
        let key = $(this).val();
        let checked = d3.select(this).property("checked");
        self.selectControl(key, self.controls[key], checked)
        self.filterColleges();
      });




      $('#minACT').on("focusout", function(event) {
        self.minACT = $('#minACT').val();
        if (self.minACT == "") {
          self.minACT = null;
        }
        d3.select("#minACT").classed("has-value", self.minACT != null)
        self.filterColleges();
      })
      $('#maxACT').on("focusout", function(event) {
        self.maxACT = $('#maxACT').val();
        if (self.maxACT == "") {
          self.maxACT = null;
        }
        d3.select("#maxACT").classed("has-value", self.maxACT != null)
        self.filterColleges();
      })


      promiseGetDegreesOffered()
      .then( function(programs) {


        
        let programOptions = []
        programs.forEach(function(program) {
          if (self.fieldNames.indexOf(program) < 0) {
            self.fieldNames.push(program)
          }

          let tokens = program.split("program_bachelors");
          let display = tokens[1].substring(1, tokens[1].length)
          display = display.split("_").join(" ");
          display = display[0].toUpperCase() + display.slice(1); 
          programOptions.push({ id: program, text: display  } );

        })

        $('#select2-programs')
          .select2(
            {
              dropdownParent: $('#search-dialog'),
              placeholder: "Select field of study...",
              allowClear: true,
              data: programOptions
            }
          )
          .on('change', function (e) {
            var data = $('#select2-programs').select2('data');
            self.selectedPrograms = data.map(function(elem) {
              return {id: elem.id, name: elem.text};
            })
          })
          .on('select2:close', function(e) {
            self.filterColleges();
          })

        promiseMetricGetData(self.fieldNames, null, {includeDefaultFields: false})
        .then(function(colleges) {
          self.allColleges = colleges.sort(function(a,b) {
            return a.name.localeCompare(b.name);
          })
           self.filterColleges({selectAll: true});
           self.selectAllColleges();

          resolve();
        })
      })

      $('#select2-colleges')
      .select2(
        {
          dropdownParent: $('#search-dialog'),
          placeholder: "Enter college name to search...",
          allowClear: true,
          ajax: {
            url: "getMetricData",
            data: function (params) {
              var query = {
                search: params.term,
                fields: self.fieldNames.join(",")
              }

              // Query parameters will be ?search=[term]&type=public
              return query;
            },
            processResults: function (response) {
           
              let data = JSON.parse(response)
              let colleges = data.map(function(college) {
                return {id: college.id, text: college.name}
              })
              // Transforms the top-level key of the response object from 'items' to 'results'
              return {
                results: colleges
              };                
            

            }
          }
        }
      )
      .on('change', function (e) {
        var data = $('#select2-colleges').select2('data');
        self.selectedColleges = data.map(function(elem) {
          return elem.text;
        })
      })
      .on('select2:close', function(e) {
        self.filterColleges();
      })


      $('#select2-regions')
      .select2(
        {
          dropdownParent: $('#search-dialog'),
          placeholder: "Select regions...",
          allowClear: true,
        }
      )
      .on('change', function (e) {
        var data = $('#select2-regions').select2('data');
        self.selectedRegions = data.map(function(elem) {
          return {id: elem.id, name: elem.text};
        })
      })
      .on('select2:close', function(e) {
        self.filterColleges();
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
      buf += self.formatBadge(self.selectedPrograms.map(function(program) {
        return program.name;
      }));
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
    if (self.selectedRegions.length > 0) {
      return "<span class='badge badge-secondary'>" +  
      self.selectedRegions.map(function(region) {
        return region.name;
      }).join(", ") 
      + "</span>";
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

    d3.selectAll("#control-buttons.btn-group .btn-sm.active").classed("active", false)

    $(self.usnewsSelector).prop( "checked", false );

    $(self.programSelector).multiselect('deselect', self.selectedPrograms, false);
    $('#select2-regions').val(null).trigger('change');
    $('#select2-colleges').val(null).trigger('change');
    $('#select2-programs').val(null).trigger('change');

    $('#minACT').val("");
    $('#maxACT').val("");
    self.minACT = null;
    self.maxACT = null;
    d3.select("#minACT").classed("has-value", self.minACT != null)
    d3.select("#maxACT").classed("has-value", self.maxACT != null)


    self.selectedColleges = []
    self.selectedDegreeLevel = []
    self.selectedDegreeLevelLabels = []
    self.selectedRegions = []
    self.selectedPrograms = []
    self.selectedControl = []
    self.selectedControlLabels = []
    self.usnewsChecked = false;


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

      d3.selectAll("#control-buttons.btn-group #control-public input").property("checked", true)
      d3.selectAll("#control-buttons.btn-group #control-public").classed("active", true)
      self.selectControl("1", "Public", true)


      $('#minACT').val("30");
      self.minACT = 30;
      d3.select("#minACT").classed("has-value", self.minACT != null)

      self.filterColleges({selectAll: true});
    } else if (customFilter == "west_coast") {
      self.resetFilters();

      $('#select2-regions').val('8'); 
      $('#select2-regions').trigger('change'); 

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
    d3.select("#limit-exceeded").classed("hide", true)

  

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
            let matched = self.selectedRegions.filter(function(region) {
              return college.region == region.id;
            })
            matchesRegion = matched.length > 0;
          }
        } 


        let matchesProgram = self.selectedPrograms.length == 0;
        if (self.selectedPrograms.length > 0) {
          let matched = self.selectedPrograms.filter(function(program) {
            return college[program.id] == 1;
          })
          matchesProgram = matched.length > 0;
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
            return (matchesUsnews && matchesDegreeLevel && matchesRegion 
              && matchesProgram 
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
      d3.select("#limit-exceeded").classed("hide", self.filteredColleges.length <= self.RANK_COLLEGE_LIMIT)
      $("#search-dialog  #rank-button").attr("disabled", self.filteredColleges.length > self.RANK_COLLEGE_LIMIT); 
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
      d3.select("#limit-exceeded").classed("hide", self.checkedColleges.length <= self.RANK_COLLEGE_LIMIT)
      $("#search-dialog  #rank-button").attr("disabled", self.checkedColleges.length > self.RANK_COLLEGE_LIMIT); 
    } else {
      $("#search-dialog  #rank-button").attr("disabled", true);

    }
  }
  close() {
    $('#search-dialog ').modal('hide')
  }

}