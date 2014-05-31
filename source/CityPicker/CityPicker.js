/*
|| 27-NOV-2011 - George Mari
|| Copyright George Mari - all rights reserved.
*/
enyo.kind({
	name: "CityPickerView",
	kind: enyo.VFlexBox,
	events: {
		onBack: ""
	},
	components: [
      {name: "TypePane", kind: "Pane", flex: 1, transitionKind: "enyo.transitions.Fade", components: [
         {kind: "VFlexBox", components: [
            {name: "CitySearchRowGroup", kind: "RowGroup", flex: 0, caption: "City Name Search", defaultKind: "HFlexBox", components: [
               {name: "searchCityName", kind: "Input", hint: "Enter city or town name...", oninput: "locationSearch"}
            ]},
            {name: "locSearchResultsVR", kind: "VirtualList", flex: 1, onSetupRow: "locSearchSetupRow", components: [
               {name: "locSearchItem", kind: "Item", locationKind: "HFlexLayout", onclick: "locSearchRowClick", tapHighlight: true, components: [
                  {name: "locSearchRowCaption", flex: 1}
               ]}
            ]},
            {kind: "Toolbar", components: [
               {kind: "GrabButton", onclick: "clickDone"},
               {caption: "Done", onclick: "clickDone"}
            ]}
         ]}
      ]},
      {name: "cpLoadFile",
      kind: "WebService",
      onSuccess: "cpLoadFileSuccess",
      onFailure: "cpLoadFileFailure"
      }

   ],
	create: function() {
		enyo.log("SearchWindow create function started.");
		this.inherited(arguments);
		this.locSearchResults = [];
		this.cityLocations = [];
		this.countyZones = [];
		// open the database
		this.wbDB = openDatabase("ext:WeatherBulletinDB", "1", "", "25000000");
		enyo.log("wbDB: " + enyo.json.stringify(this.wbDB));

		// Load the contents of the countyZone table into an array
		// for later use when we are returning results from the city search.
		// The zone name and number need to be combined with the city search
		// results and displayed on the screen to the user, and also stored in 
		// the preferences for each city the user selects.
		var that = this;
		this.wbDB.transaction(
			function(transaction) {
			transaction.executeSql(
				"SELECT countyZone.county_fips, countyZone.zone_no, countyZone.zone_name " +
					"FROM countyZone " +
				"ORDER BY countyZone.county_fips ASC;",
				[],
				that.handlezoneQueryDBResult.bind(that), that.handleDBError);
			}
		);
		enyo.log("SearchWindow create function completed.");
	},
	
	clickDone: function() {
		enyo.log("Executing clickDone from CityPickerView.");
      this.cleanUp();
      // Return
		this.doBack();
	},
	
   cleanUp: function() {
      // Clean-up
	   this.$.searchCityName.setValue("");
      this.locSearchResults.splice(0);
      this.$.locSearchResultsVR.refresh();
   },
   
   locSearchSetupRow: function(inSender, inIndex) {
      var locCityStateString;
      
      // Search results are stored in the arry named locSearchResults.
      if (inIndex < this.locSearchResults.length && inIndex >= 0)
         {
         // enyo.log("Setting up search results location list row " + inIndex);
         // enyo.log("Location search results: " + this.locSearchResults);
         locCityStateString = this.locSearchResults[inIndex].city_name + ", " + this.locSearchResults[inIndex].state +
										" (" + this.locSearchResults[inIndex].county_name + " county, " + 
										this.locSearchResults[inIndex].zone_name + ")";
         this.$.locSearchRowCaption.setContent(locCityStateString);
         return true;
         }
   },

	handleDBError: function(transaction, error) {
		enyo.log("SQL error: " + "[" + error.code + "] " + error.message);
	},

	handlezoneQueryDBResult: function(transaction, results) {
		// Clear out the the array this.countyZones before re-populating it.
		this.countyZones.splice(0);

		// Each row is an array indexed by column names.
		var i;
		for (i=0; i < results.rows.length; i++) {
			var row = results.rows.item(i);
			// Make an object out this row array, to add to the
			// countyZones array, which is an array of objects.
			var resultObject = {zone_no: row.zone_no, zone_name: row.zone_name};
			// enyo.log("DB search result: " + enyo.json.stringify(resultObject));
         this.countyZones[row.county_fips] = resultObject;
		}
      // Now that we have the search results from the database, 
      // re-render the search results list.
		// this.$.locSearchResultsVR.refresh();
	},
	
	locationFindStart: function(searchFragment) {
		// Perform a binary search to find the array index
		// of the first location in our sorted array (this.cityLocations)
		// that matches our search fragment.
		// Return value of null indicates search text does not exist.
		var firstSearchFragmentIndex = null;
		var low = 0;
		var high = this.cityLocations.length - 1;
		var mid = Math.round((high + low + 1) / 2);
		var arrayValue = '';
		var searchResult = 0;
		var prev_searchResult = 0;
		var prev_arrayValue = '';

		searchFragment = searchFragment.toLocaleLowerCase();
		while (low < high) {
			mid = Math.round((low + high + 1) / 2);
			arrayValue = this.cityLocations[mid].substr(0, searchFragment.length).toLocaleLowerCase();
			// arrayValue = this.cityLocations[mid].split("|", 1)[0].toLocaleLowerCase();
			searchResult = arrayValue.localeCompare(searchFragment);
			enyo.log("locationFindStart: " + low + ":" + mid + ":" + high + " - " + arrayValue + ":" + searchFragment + ":" + searchResult);
			// prev_arrayValue = this.cityLocations[mid - 1].split("|",1)[0].toLocaleLowerCase();
			prev_arrayValue = this.cityLocations[mid - 1].substr(0, searchFragment.length).toLocaleLowerCase();
			prev_searchResult = prev_arrayValue.localeCompare(searchFragment);
			if (searchResult === 0 && prev_searchResult < 0) {
				high = low;
				}
			else if (searchResult < 0) {		// array value "less than" what we're searching for...
				low = mid;	// move low up to mid
				}
			else {
				high = mid - 1;	// move high down to mid - 1
				}
			}
		// mid = Math.round((low + high + 1) / 2);
		// arrayValue = this.cityLocations[mid].split("|", 1)[0].toLocaleLowerCase();
		// Our algorithm above is incapable of returning a value of 0 for mid.  In case it returns 1, 
		// see if mid should really be 0.
		if (mid === 1 && prev_searchResult === 0) {
			mid = 0;
			}
		arrayValue = this.cityLocations[mid].substr(0, searchFragment.length).toLocaleLowerCase();
		searchResult = arrayValue.localeCompare(searchFragment);
		enyo.log("locationFindStart: " + low + ":" + mid + ":" + high + " - " + arrayValue + ":" + searchFragment + ":" + searchResult);
		if (searchResult === 0) {
			firstSearchFragmentIndex = mid;
			}
		else {
			firstSearchFragmentIndex = null;
			}
		
		return firstSearchFragmentIndex;
	},

   locationSearch: function() {
		var oneLine = '';
		var temp_c_fips = '';
		var resultObject = {};
      var searchText = this.$.searchCityName.getValue();
      enyo.log("City name search text is: " + searchText);
		
      // Always start by emptying our search results array.
      this.locSearchResults.splice(0);
		if (searchText.length === 1)
			{
			// When the user has type the first character,
			// we can go load the 1 file of cities that all start with that letter.
			this.$.cpLoadFile.setUrl('CityPicker/cp_data/' + searchText.toUpperCase() + '.txt');
			this.$.cpLoadFile.call();
			}
		else if (searchText.length >= 3 && this.cityLocations.length > 0)
	      // Only search and retrieve results
			// if our search input string is at least 3 characters long,
			// and our array of cities has finished loading from the corresponding file.
			// (The this.cityLocations array will have a length of > 0.)
         {
         enyo.log("Search text length is now: " + searchText.length);
			searchText = searchText.toLocaleLowerCase();
         // search for cities starting with our search text.
			var i = this.locationFindStart(searchText);
			if (i !== null) {
				enyo.log("Search index was " + i);
            while (this.cityLocations[i].substr(0, searchText.length).toLocaleLowerCase() === searchText)
               {
					oneLine = this.cityLocations[i].split("|");
					// enyo.log("oneLine: " + oneLine);
					temp_c_fips = oneLine[3]+oneLine[5];
					// enyo.log("temp_c_fips: " + temp_c_fips);
					// We need the zone number and name from the array, which is indexed by
					// the county fips number from our city array.  But not every county fips
					// from the city array exists in our countyZones array, so for now, ignore
					// the cities with non-existant zones, and don't add them to the results.
					if (this.countyZones[temp_c_fips] !== undefined) {
						resultObject = {state: oneLine[2], city_name: oneLine[0], 
										  zone_no: this.countyZones[temp_c_fips].zone_no, 
										  zone_name: this.countyZones[temp_c_fips].zone_name,
										  county_fips: temp_c_fips, county_name: oneLine[4],
										  latitude: oneLine[8], longitude: oneLine[9],
											UgcCounty: oneLine[2]+'C'+temp_c_fips.slice(-3),
											UgcZone: oneLine[2]+'Z'+this.countyZones[temp_c_fips].zone_no};
						this.locSearchResults.push(resultObject);
						}
					if (i < this.cityLocations.length - 1) {
						i = i + 1;
						}
					else {
						break;
						}
               }
            }
			else {
			   enyo.log("Search text was not found.");
				}
			// Re-render our search results list on the screen
			// with the new search results.
			this.$.locSearchResultsVR.refresh();
			}
      else
         {
         // Our search text is less than the minimum, so delete/erase the locSearchResults array.
         this.locSearchResults.splice(0);
			this.$.locSearchResultsVR.refresh();
         }
   },
   
   locSearchRowClick: function(inSender, inEvent) {
		// This gets called when the user selects a city from the list.
		// We need to get related information before we return - 
		// the nearest stations for current weather observations and radar.
      enyo.log("Clicked on results row: " + inEvent.rowIndex);
		this.selectedCityIndex = inEvent.rowIndex;
      var returnCity = this.locSearchResults[inEvent.rowIndex];
		this.queryStations(returnCity.latitude, returnCity.longitude);
      
      // this.cleanUp();
      // Return
		// this.doBack(returnCity);
   },

	queryStations: function(cityLatitude, cityLongitude) {
		// Once the user selects a single city from the list,
		// we need to query the database for the nearest station for
		// radar and current observations.  (One query for each)
		enyo.log("queryStations: lat - " + cityLatitude + "long - " + cityLongitude);
		var that = this;
		this.wbDB.transaction(
			function(transaction) {
			transaction.executeSql(
				"SELECT state, intl_id, latitude, longitude, " + 
				"((latitude - ?) * (latitude - ?)) + ((longitude - ?) * (longitude - ?)) distance " +
					"FROM weatherStation " +
				" WHERE ((latitude - ?) * (latitude - ?)) + ((longitude - ?) * (longitude - ?)) = " +
					"(SELECT MIN(((latitude - ?) * (latitude - ?)) + ((longitude - ?) * (longitude - ?))) " +
					"FROM weatherStation WHERE metar = 'Y')" +
					"AND metar = 'Y';",	
				[cityLatitude, cityLatitude, cityLongitude, cityLongitude,
				cityLatitude, cityLatitude, cityLongitude, cityLongitude,
				cityLatitude, cityLatitude, cityLongitude, cityLongitude
				],
				that.handleWSQueryResult.bind(that), that.handleDBError);
			transaction.executeSql(
				'SELECT state, faa_id, latitude, longitude, ' + 
				'((latitude - ?) * (latitude - ?)) + ((longitude - ?) * (longitude - ?)) distance ' +
					'FROM weatherStation ' +
				' WHERE ((latitude - ?) * (latitude - ?)) + ((longitude - ?) * (longitude - ?)) = ' +
					'(SELECT MIN(((latitude - ?) * (latitude - ?)) + ((longitude - ?) * (longitude - ?))) ' +
					'FROM weatherStation WHERE radar = "Y")' +
					'AND radar = "Y";',	
				[cityLatitude, cityLatitude, cityLongitude, cityLongitude,
				cityLatitude, cityLatitude, cityLongitude, cityLongitude,
				cityLatitude, cityLatitude, cityLongitude, cityLongitude
				],
				that.handleRdrQueryResult.bind(that), that.handleDBError);
		}
		);

	},

	handleWSQueryResult: function(transaction, results) {
		// Each row is an array indexed by column names.
		// There should only be one row returned by this query,
		// so no need to loop through the results - just grab
		// the values from the first row in the array.
		var row = results.rows.item(0);
		enyo.log("handleWSQueryResult: " + enyo.json.stringify(row));
		enyo.log("handleWSQueryResult: this.selectedCityIndex = " + this.selectedCityIndex);
		this.locSearchResults[this.selectedCityIndex].obsvStationId = row.intl_id;
		var returnCity = this.locSearchResults[this.selectedCityIndex];
		// After we set the station id for current weather observations,
		// check to see if the radar station id has been defined.  If it has,
		// Then we have everything we need, and can return.
		if (this.locSearchResults[this.selectedCityIndex].hasOwnProperty('rdrStationId') === true) {
			this.cleanUp();
			this.doBack(returnCity);
			}
	},

	handleRdrQueryResult: function(transaction, results) {
		// Each row is an array indexed by column names.
		// There should only be one row returned by this query,
		// so no need to loop through the results - just grab
		// the values from the first row in the array.
		var row = results.rows.item(0);
		enyo.log("handleRdrQueryResult: " + enyo.json.stringify(row));
		enyo.log("handleRdrQueryResult: this.selectedCityIndex = " + this.selectedCityIndex);
		this.locSearchResults[this.selectedCityIndex].rdrStationId = row.faa_id;
		var returnCity = this.locSearchResults[this.selectedCityIndex];
		// After we set the station id for radar,
		// check to see if the station id for current weather observations has been defined.
		// If it has, then we have everything we need, and can return.
		if (this.locSearchResults[this.selectedCityIndex].hasOwnProperty('obsvStationId') === true) {
			this.cleanUp();
			this.doBack(returnCity);
			}
	},

	cpLoadFileSuccess: function(inSender, inResponse) {
      enyo.log("cpLoadFile succes.  Results: " + enyo.json.stringify(inResponse));

      // Always start by emptying our search results array.
      this.cityLocations.splice(0);

		// Parse data
		this.cityLocations = inResponse.split("\n");
		// For some reason, we end up with an empty element at the end of the array.
		// this.cityLocations.pop();

	},
   
   cpLoadFileFailure: function(inSender, inResponse) {
      enyo.log("cpLoadFile failed." + enyo.json.stringify(inResponse));
   }

});
