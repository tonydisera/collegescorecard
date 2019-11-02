class Search {
	constructor() {
    this.collegeSelector   = '#search-dialog #select-college';
		this.regionSelector   = '#search-dialog #select-region';
    this.programSelector  = '#search-dialog #select-program';
    this.controlSelector  = '#search-dialog #select-control';
    this.selectedColleges = []
    this.selectedRegions = []
    this.selectedPrograms = []
    this.selectedControl = []

    this.allColleges = []
    this.filteredColleges = []

    this.fieldNames = ["usnews_2019_rank", "control", "region"]

	}

	init() {
    let self = this;


    $(self.collegeSelector).multiselect(
    { enableCaseInsensitiveFiltering: true,
      enableFiltering: true,
      nonSelectedText: "Select colleges",
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
        
      }    
    })

    $(self.regionSelector).multiselect(
    { enableCaseInsensitiveFiltering: true,
      nonSelectedText: "Select regions",
      onChange: function(options, checked) {
        if (Array.isArray(options)) {
          options.forEach(function(option) {
            let rec = option[0].value
            self.selectRegion(rec, checked);
          })
        } else {
          let rec = options[0].value
          self.selectRegion(rec, checked);
        }

      },
      onDropdownHide: function(event) {
        
      }    
    })

    $(self.programSelector).multiselect(
    { enableCaseInsensitiveFiltering: true,
      nonSelectedText: "Select degrees offered",
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
        
      }    
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

      promiseGetData(self.fieldNames)
      .then(function(colleges) {
        self.allColleges = colleges;
        let options = []
        colleges.forEach(function(college) {
          options.push({ label: college.name, title: college.name, value: college.name } );
        })
        $(self.collegeSelector).multiselect('dataprovider', options);
      })

    })

    $(self.controlSelector).multiselect(
    { enableCaseInsensitiveFiltering: true,
      nonSelectedText: "Control",
      onChange: function(options, checked) {
        if (Array.isArray(options)) {
          options.forEach(function(option) {
            let rec = option[0].value
            self.selectControl(rec, checked);
          })
        } else {
          let rec = options[0].value
          self.selectControl(rec, checked);
        }

      },
      onDropdownHide: function(event) {
        
      }    
    })


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
  }
  selectRegion(regionKey, checked) {
    let self = this;
    if (checked) {
      if (self.selectedRegions.indexOf(regionKey) < 0) {
        self.selectedRegions.push(regionKey);
      }
    } else {
      let idx = self.selectedRegions.indexOf(regionKey);
      self.selectedRegions.splice(idx,1)
    }
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
  }
  selectControl(controlKey, checked) {
    let self = this;
    if (checked) {
      if (self.selectedControl.indexOf(controlKey) < 0) {
        self.selectedControl.push(controlKey);
      }
    } else {
      let idx = self.selectedControl.indexOf(controlKey);
      self.selectedControl.splice(idx,1)
    }
  }

  filterColleges() {
    let self = this;
    self.filteredColleges = self.allColleges.filter(function(college) {
      let matchesCollege = false;
      if (self.selectedColleges.length > 0) {
        if (self.selectedColleges.indexOf(college.name) >= 0) {
          matchesCollege = true;
        }
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

      if (matchesCollege) {
        return true;
      } else {
        return matchesRegion && matchesProgram && matchesControl;
      }

    })
  }
}