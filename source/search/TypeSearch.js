/*
|| 27-NOV-2011 - George Mari
|| Copyright George Mari - all rights reserved.
*/
enyo.kind({
	name: "TypeSearchView",
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
      ]}
   ],
	create: function() {
		enyo.log("SearchWindow create function started.");
		this.inherited(arguments);
		this.locSearchResults = [];
		// open the database
		this.wbDB = openDatabase("ext:WeatherBulletinUSADB", "1", "", "25000000");
		enyo.log("wbDB: " + enyo.json.stringify(this.wbDB));
		enyo.log("SearchWindow create function completed.");
	},
	
	clickDone: function() {
		enyo.log("Executing clickDone from TypeSearchView.");
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

	handleCitySearchDBResult: function(transaction, results) {
		// Each row is an array indexed by column names.
		var i;
		for (i=0; i < results.rows.length; i++) {
			var row = results.rows.item(i);
			// Make an object out this row array, to push onto the
			// locSearchResults array, which is an array of objects.
			var resultObject = {state: row.state, city_name: row.city_name,
									  zone_no: row.zone_no, zone_name: row.zone_name,
									  county_fips: row.county_fips, county_name: row.county_name,
									  latitude: row.latitude, longitude: row.longitude,
										UgcCounty: row.state+'C'+row.county_fips.slice(-3),
										UgcZone: row.state+'Z'+row.zone_no};
			// enyo.log("DB search result: " + enyo.json.stringify(resultObject));
         this.locSearchResults.push(resultObject);
		}
      // Now that we have the search results from the database, 
      // re-render the search results list.
		this.$.locSearchResultsVR.refresh();
	},

   locationSearch: function() {
      var searchText = this.$.searchCityName.getValue();
      // enyo.log("City name search text is: " + searchText);
      
      // Always start by emptying our search results array.
      this.locSearchResults.splice(0);
      
      // Only search if our search input string is at least 3 characters long.
      if (searchText.length >= 3)
         {
         enyo.log("Search text is now: " + searchText.length);
			// Search the cityLocation table in the DB
			var that = this;
			this.wbDB.transaction(
				function(transaction) {
				transaction.executeSql(
					'SELECT cityLocation.city_name, cityLocation.state, cityLocation.county_fips, ' +
							' cityLocation.county_name, countyZone.zone_no, countyZone.zone_name, ' +
							' cityLocation.latitude, cityLocation.longitude ' +
						'FROM cityLocation, countyZone ' +
					 'WHERE cityLocation.city_name >= ? ' +
						'AND cityLocation.city_name <= ? ' +
						'AND countyZone.county_fips = cityLocation.county_fips ' +
					 'ORDER BY cityLocation.city_name ASC, cityLocation.state ASC;', 
					[searchText, searchText+'z'],
					that.handleCitySearchDBResult.bind(that), that.handleDBError);
				}
			);

			/*
         // Loop through the array, search for cities starting with our search text.
         for (i = 0; i < cityNames.length; i = i+1)
            {
            // if (cityNames[i].city_name.indexOf(searchText) >= 0)
            if (cityNames[i].city_name.substr(0, searchText.length) == searchText)
               {
               this.locSearchResults.push(cityNames[i]);
               }
            }
			*/
         }
      else
         {
         // Our search text is less than the minimum, so delete/erase the locSearchResults array.
         this.locSearchResults.splice(0);
			this.$.locSearchResultsVR.refresh();
         }
         
      // Re-render the search results list
      // enyo.log("City name search completed.  Re-rendering search results.");
      // enyo.log(enyo.json.stringify(this.locSearchResults));
      // this.$.locSearchResultsVR.refresh();
   },
   
   locSearchRowClick: function(inSender, inEvent) {
      enyo.log("Clicked on results row: " + inEvent.rowIndex);
      var returnCity = this.locSearchResults[inEvent.rowIndex];
      
      this.cleanUp();
      // Return
		this.doBack(returnCity);
   }
});
