class Search {
	constructor() {
		this.regionSelector = '#search-dialog #select-region';
    this.selectedRegions = []

	}

	init() {
    let self = this;
    $(self.regionSelector).multiselect(
    { enableCaseInsensitiveFiltering: true,
      nonSelectedText: "Select regions",
      onChange: function(options, checked) {
        if (Array.isArray(options)) {
          options.forEach(function(option) {
            let rec = option[0].label
            self.selectRegion(region, checked);
          })
        } else {
          let rec = options[0].label
          self.selectRegion(rec, checked);
        }

      },
      onDropdownHide: function(event) {
        
      }    
    })

	}

  selectRegion(regionName, checked) {
    let self = this;
    if (checked) {
      if (self.selectedRegions.indexOf(regionName) < 0) {
        self.selectedRegions.push(regionName);
      }
    } else {
      let idx = self.selectedRegions.indexOf(regionName);
      self.selectedRegions = self.selectedRegions.slice(idx,1)
    }
  }
}