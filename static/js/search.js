class Search {
	constructor() {
		this.regionSelector = '#search-dialog #select-region';
	}

	init() {
    let self = this;
    $(self.regionSelector).multiselect(
    { enableFiltering: true,
      includeSelectAllOption: true,
      enableCaseInsensitiveFiltering: true,
      nonSelectedText: "Select regions"
    })

	}
}