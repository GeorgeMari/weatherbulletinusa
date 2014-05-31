/*
|| 27-NOV-2011 - George Mari
|| Copyright George Mari - all rights reserved.
*/
enyo.kind({
	name: "InitializeView",
	kind: enyo.VFlexBox,
	events: {
		onBack: ""
	},
	components: [
      {name: "LocationService", 
      kind: "enyo.PalmService",
      service: "palm://com.palm.location/",
      method: "getCurrentPosition",
      onSuccess: "locationSuccess",
      onFailure: "locationFailure"
      },

      {name: "ReverseLocationService", kind: "enyo.PalmService",
      service: "palm://com.palm.location/",
      method: "getReverseLocation",
      onSuccess: "ReverseLocSuccess",
      onFailure: "ReverseLocFailure"
      },

		{name : "setPreferencesCall",
      kind : "PalmService",
      service : "palm://com.palm.systemservice/",
      method : "setPreferences",
      onSuccess : "setPrefsSuccess",
      onFailure : "setPrefsFailure",
      subscribe : false},

      {name: "InitPane", kind: "Pane", flex: 1, transitionKind: "enyo.transitions.Fade", components: [
         {kind: "VFlexBox", pack: "center", components: [
				{kind: "PageHeader", components: [
					{kind: "VFlexBox", flex: 1, align: "center", components: [
						{content: "Welcome to Weather Bulletin"}
			      ]}
				]},
            {name: "InitProgress", kind: "ProgressBar"},
            {name: "ProgressDetail", kind: "Control", className: "enyo-item-secondary", flex: 1, pack: "start", align: "center",  content: ""},
				{name: "StartInitButton", kind: "ActivityButton", className: "enyo-button-affirmative", flex: 0, pack: "start", align: "center",  caption: "Begin loading database", onclick: "dropTables"},
/*				{name: "StatePicker", kind: "Picker", flex: 0, 
					items: [
			"Alaska",
			"Alabama",
			"Arkansas",
			"American Samoa",
			"Arizona",
			"California",
			"Colorado",
		   "Connecticut",
		   "Washington, D.C.",
		   "Delaware",
			"Florida",
		   "Federated States of Micronesia"},
		   "Georgia"},
			"Guam"},
		   "Hawaii"},
			"Iowa"},
		   "Idaho"},
		   "Illinois"},
			"Indiana"},
		   "Kansas"},
			"Kentucky"},
			"Louisiana"},
		   "Massachusetts"},
		   "Maryland"},
		   "Maine"},
			"Marshall Islands"},
		   "Michigan"},
		   "Minnesota"},
		   "Missouri"},
		   "Northern Mariana Islands"},
			"Mississippi"},
		   "Montana"},
			"North Carolina"},
			"North Dakota"},
			"Nebraska"},
			"New Hampshire"},
			"New Jersey"},
			"New Mexico"},
			"Nevada"},
			"New York"},
			"Ohio"},
			"Oklahoma"},
			"Oregon"},
			"Pennsylvania"},
			"Puerto Rico"},
			"Palau"},
			"Rhode Island"},
			"South Carolina"},
			"South Dakota"},
			"Tennessee"},
			"Texas"},
			"US Minor Outlying Islands"},
			"Utah"},
			"Virginia"},
			"Virgin Islands"},
			"Vermont"},
			"Washington"},
			"Wisconsin"},
			"West Virginia"},
			"Wyoming"}

							 ]
				},
				*/
				{name: "InitScroller", kind: "FadeScroller", flex: 2, components: [
					{name: "InitExplanation", kind: "Control", className: "enyo-item-secondary", flex: 2, pack: "start", align: "center",  
						  content: "Before you can use Weather Bulletin, we must load a local database of cities used to specify your location.  This will take several minutes.  Take advantage of the multi-tasking feature of your device, and feel free to switch to a different app during this load process."
					}
				]},
            {kind: "Toolbar", components: [
               {name: "ToolbarGrabBtn", kind: "GrabButton", onclick: "clickDone"},
               {name: "ToolbarDoneBtn", caption: "Done", onclick: "clickDone"}
            ]}
         ]}
      ]},
      {name: "initDBLoadFile",
      kind: "WebService",
      onSuccess: "initDBLoadSuccess",
      onFailure: "initDBLoadFailure"
      },

      {name: "initDBLoadStationFile",
      kind: "WebService",
      onSuccess: "initDBLoadStationSuccess",
      onFailure: "initDBLoadFailure"
      },

      {name: "initDBLoadZoneFile",
      kind: "WebService",
      onSuccess: "initDBLoadZoneSuccess",
      onFailure: "initDBLoadFailure"
      }

   ],
	// 01-JUL-2012 - George Mari
	// General program flow for db initialization:
	// 1. startLoad
	// 2. initDBLoadFile (initDBLoadSuccess)
	// 3. INSERT INTO ciytLocation...
	// 4. back to startLoad
	// 5. intiDBLoadZoneFile (initDBLoadZoneSuccess)
	create: function() {
		enyo.log("InitializeDB create function started.");
		this.inherited(arguments);

		this.DBStatementList = [
			'CREATE TABLE cityLocation(city_name TEXT, ' +
											 'state TEXT, ' +
											 'county_fips TEXT, ' +
											 'county_name TEXT, ' +
											 'latitude NUMERIC, ' +
											 'longitude NUMERIC);',
			'CREATE TABLE CAPAlert(alertId TEXT NOT NULL, ' +
										'updated_tstamp INTEGER, ' +
										'published_tstamp INTEGER, ' +
										'title TEXT, ' +
										'url TEXT, ' +
										'summary TEXT, ' +
										'event TEXT, ' +
										'effective_tstamp INTEGER, ' +
										'expiration_tstamp INTEGER, ' +
										'download_tstamp INTEGER NOT NULL, ' +
										'notification_tstamp INTEGER, ' +
										'user_ack_tstamp INTEGER, ' +
										'status TEXT, ' +
										'msgType TEXT, ' + 
										'category TEXT, ' +
										'urgency TEXT, ' +
										'severity TEXT, ' +
										'certainty TEXT, ' +
										'areaDesc TEXT);',
			'CREATE TABLE alertFIPS(alertId TEXT NOT NULL, ' +
										 'download_tstamp INTEGER NOT NULL, ' +
										 'fips TEXT NOT NULL);', 
			'CREATE TABLE alertUGC(alertId TEXT NOT NULL, ' +
										'download_tstamp INTEGER NOT NULL, ' +
										'ugc TEXT NOT NULL);',
			'CREATE INDEX cl_fips ON cityLocation(county_fips);',
			'CREATE INDEX cl_city_name ON cityLocation(city_name);',
			'CREATE UNIQUE INDEX ca_id ON CAPAlert(alertId);',
			'CREATE INDEX ca_dlt ON CAPAlert(download_tstamp);',
			'CREATE INDEX af_id ON alertFIPS(alertId);',
			'CREATE INDEX af_dlt ON alertFIPS(download_tstamp);',
			'CREATE INDEX au_id ON alertUGC(alertId);',
			'CREATE INDEX au_dlt ON alertUGC(download_tstamp);'
			];
		
		this.cityFileList = [
			{file: "../data/AK.txt", name: "Alaska"},
			{file: "../data/AL.txt", name: "Alabama"},
			{file: "../data/AR.txt", name: "Arkansas"},
			{file: "../data/AS.txt", name: "American Samoa"},
			{file: "../data/AZ.txt", name: "Arizona"},
			{file: "../data/CA.txt", name: "California"},
			{file: "../data/CO.txt", name: "Colorado"},
		   {file: "../data/CT.txt", name: "Connecticut"},
		   {file: "../data/DC.txt", name: "Washington, D.C."},
		   {file: "../data/DE.txt", name: "Delaware"},
			{file: "../data/FL.txt", name: "Florida"},
		   {file: "../data/FM.txt", name: "Federated States of Micronesia"},
		   {file: "../data/GA.txt", name: "Georgia"},
			{file: "../data/GU.txt", name: "Guam"},
		   {file: "../data/HI.txt", name: "Hawaii"},
			{file: "../data/IA.txt", name: "Iowa"},
		   {file: "../data/ID.txt", name: "Idaho"},
		   {file: "../data/IL.txt", name: "Illinois"},
			{file: "../data/IN.txt", name: "Indiana"},
		   {file: "../data/KS.txt", name: "Kansas"},
			{file: "../data/KY.txt", name: "Kentucky"},
			{file: "../data/LA.txt", name: "Louisiana"},
		   {file: "../data/MA.txt", name: "Massachusetts"},
		   {file: "../data/MD.txt", name: "Maryland"},
		   {file: "../data/ME.txt", name: "Maine"},
			{file: "../data/MH.txt", name: "Marshall Islands"},
		   {file: "../data/MI.txt", name: "Michigan"},
		   {file: "../data/MN.txt", name: "Minnesota"},
		   {file: "../data/MO.txt", name: "Missouri"},
		   {file: "../data/MP.txt", name: "Northern Mariana Islands"},
			{file: "../data/MS.txt", name: "Mississippi"},
		   {file: "../data/MT.txt", name: "Montana"},
			{file: "../data/NC.txt", name: "North Carolina"},
			{file: "../data/ND.txt", name: "North Dakota"},
			{file: "../data/NE.txt", name: "Nebraska"},
			{file: "../data/NH.txt", name: "New Hampshire"},
			{file: "../data/NJ.txt", name: "New Jersey"},
			{file: "../data/NM.txt", name: "New Mexico"},
			{file: "../data/NV.txt", name: "Nevada"},
			{file: "../data/NY.txt", name: "New York"},
			{file: "../data/OH.txt", name: "Ohio"},
			{file: "../data/OK.txt", name: "Oklahoma"},
			{file: "../data/OR.txt", name: "Oregon"},
			{file: "../data/PA.txt", name: "Pennsylvania"},
			{file: "../data/PR.txt", name: "Puerto Rico"},
			{file: "../data/PW.txt", name: "Palau"},
			{file: "../data/RI.txt", name: "Rhode Island"},
			{file: "../data/SC.txt", name: "South Carolina"},
			{file: "../data/SD.txt", name: "South Dakota"},
			{file: "../data/TN.txt", name: "Tennessee"},
			{file: "../data/TX.txt", name: "Texas"},
			{file: "../data/UM.txt", name: "US Minor Outlying Islands"},
			{file: "../data/UT.txt", name: "Utah"},
			{file: "../data/VA.txt", name: "Virginia"},
			{file: "../data/VI.txt", name: "Virgin Islands"},
			{file: "../data/VT.txt", name: "Vermont"},
			{file: "../data/WA.txt", name: "Washington"},
			{file: "../data/WI.txt", name: "Wisconsin"},
			{file: "../data/WV.txt", name: "West Virginia"},
			{file: "../data/WY.txt", name: "Wyoming"}
			];

		this.stateList = [];
		for (i=0; i < this.cityFileList.length; i++) {
			this.stateList[i] = this.cityFileList[i].name;
			}
		enyo.log("this.stateList: " + enyo.json.stringify(this.stateList));
		// this.$.StatePicker.items = this.stateList;
		// Start the process of getting our location.
		// enyo.log("Init: getting GPS location...");
		// this.GetGPSLocation();
		// open the database
		this.wbDB = openDatabase("ext:WeatherBulletinDB", "1", "", "25000000");
		enyo.log("wbDB: " + enyo.json.stringify(this.wbDB));
		// Re-set progress bar position...
		this.$.InitProgress.setPosition(0);
		// Start the process of loading weather tables. 
		enyo.log("Init: loading initial database tables...");
		this.dropTables();

		// initialize database tables
		// this.createTables();
		// enyo.log("InitializeDB create function completed.");
	},
	
	initCounters: function() {
		this.DBStatementListCachedLength = this.DBStatementList.length;
		this.DBStatementIndex = -1;
		this.cityFileListCachedLength = this.cityFileList.length;

		// initialize file array index
		this.cityFileIndex = -1;

		// initialize counters for the progress bar
		this.workItems = this.cityFileListCachedLength + 2; 
		this.progPos = ((this.cityFileIndex + 1) / (this.workItems)) * 100; 

		// initialize cityLocation total record counter.  This is used to
		// throttle the data loading process.  If it is not throttled, what happens
		// is that the database inserts all complete, but the OS still keeps writing 
		// data to the database file for 6 or 7 more minutes on the TouchPad.
		this.cityLocationRecordCount = 0;

	},
	
	clickDone: function() {
      // this.cleanUp();
		this.$.InitProgress.setPosition(0);
		this.$.ProgressDetail.setContent('');
      // Return
		this.doBack();
	},

	GetGPSLocation: function(inSender) {
      // enyo.scrim.show();
      // setTimeout(enyo.scrim.hide, 5000);
      this.$.LocationService.call();
	},

	checkCountResult: function(transaction, results) {
		var row = results.rows.item(0);	// Guaranteed only 1 row for this query.
		enyo.log("cityLocation count result/record count: " + row.clcount + '/' + this.cityLocationRecordCount);

		if (row.clcount >= this.cityLocationRecordCount)
			{
			// Our data has made it into the database, so continue...
		   // Update the progress bar
			enyo.log('checkCountResult: continuing to next file...');
			this.progPos = ((this.cityFileIndex + 1) / (this.workItems)) * 100; 
			this.$.InitProgress.setPosition(this.progPos);

			// Process the next file - use setTimeout to allow the UI to update.
			setTimeout(this.startLoad.bind(this), 0);
			}
		else
			{
			// Our data is not yet all in the database, so 
			// let's wait awhile and check again in 5 seconds.
			enyo.log('checkCountResult: checking again in 15 seconds...');
			setTimeout(this.checkCountResult(transaction, results).bind(this), 5000);
			}

	},

	DBLoadCompletionCheck: function() {
		var that = this;
		enyo.log('DBLoadCompletionCheck: executing...');
		this.wbDB.transaction(
			function(transaction) {
			transaction.executeSql('SELECT COUNT(*) AS clcount FROM cityLocation;', [],
				that.checkCountResult.bind(that), that.handleSqlError);
			}
		);

	},

   initDBLoadSuccess: function(inSender, inResponse) {
      // enyo.log("initDBLoadFile succes.  Results: " + enyo.json.stringify(inResponse));
      // this.$.ProgressDetail.setContent(enyo.json.stringify(inResponse));

		// Parse data
		var cityLines = inResponse.split("\n");
		// For some reason, we end up with an empty element at the end of the array.
		cityLines.pop();

		var i;
		var cityLinesCachedLength = cityLines.length;

		// Make our database call to insert all the data, looping through all records.
		this.wbDB.transaction(
			function(tx) {
		for (i=0; i < cityLinesCachedLength; i = i + 1)	{
			//	enyo.log("cityLine " + i + ": " + cityLines[i]);
			var oneLine = cityLines[i].split("|");

			// Load data in SQLite DB
			// enyo.log("City: " + oneLine[1] + ", " + oneLine[3] + ", " + oneLine[4] + oneLine[6] + 
			//	", " + oneLine[5] + ", " + oneLine[9] + ", " + oneLine[10]);
			tx.executeSql('INSERT INTO cityLocation (city_name, state, county_fips, county_name, latitude, longitude) ' +
				'VALUES(?, ?, ?, ?, ?, ? );', 
				[oneLine[1], oneLine[3], oneLine[4]+oneLine[6], oneLine[5], oneLine[9], oneLine[10]
				]);
			}
		});
		// Increment total record count
		this.cityLocationRecordCount = this.cityLocationRecordCount + cityLinesCachedLength;

		// Check to see if the total number of records we've loaded from each file
		// actually exist now in the database.  Until they do, the SQL INSERT statements
		// are still being processed, and we should wait before loading any more.
		this.DBLoadCompletionCheck();

	},
   
   initDBLoadFailure: function(inSender, inResponse) {
      enyo.log("initDBLoadFile failed." + enyo.json.stringify(inResponse));
   },

	initDBLoadZoneSuccess: function(inSender, inResponse) {

		var that = this;
      // enyo.log("initDBLoadZoneFile succes.  Results: " + enyo.json.stringify(inResponse));
      // this.$.ProgressDetail.setContent(enyo.json.stringify(inResponse));
		// Parse data
		var zoneLines = inResponse.split("\r\n");
		// For some reason, we end up with an empty element at the end of the array.
		zoneLines.pop();

		var i;
		var zoneLinesCachedLength = zoneLines.length;

		enyo.log("zoneLines length: " + zoneLinesCachedLength);
		this.wbDB.transaction(
			function(transaction) {
				for (i=0; i < zoneLinesCachedLength; i = i + 1)	{
					// enyo.log("zoneLine " + i + ": " + zoneLines[i]);
					var oneLine = zoneLines[i].split("|");
					// Load zone data in SQLite DB
					// enyo.log("Zone: " + oneLine[0] + ", " + oneLine[1] + ", " oneLine[3] + "," + oneLine[6] + ", " + oneLine[5] + 
					// ", " + oneLine[9] + ", " + oneLine[10]);
					transaction.executeSql('INSERT INTO countyZone(state, zone_no, zone_name, ' +
													'county_fips, county_name, latitude, longitude) ' +
					'VALUES(?, ?, ?, ?, ?, ?, ? );', 
					[oneLine[0], oneLine[1], oneLine[3], oneLine[6], oneLine[5], oneLine[9], oneLine[10]
					]);
					}
		// }, this.handleTransactionError, this.createTables.bind(this));
		}, this.handleTransactionError, this.createStationTable.bind(this));
	},

	initDBLoadStationSuccess: function(inSender, inResponse) {

		var that = this;
      enyo.log("initDBLoadStationFile succes.  Results: " + enyo.json.stringify(inResponse));
		// Parse data
		var stationLines = inResponse.split("\n");
		// For some reason, we end up with an empty element at the end of the array.
		// zoneLines.pop();

		var i;
		var oneLine;
		var station = {state: null,
							name: null,
							intl_id: null,
							faa_id: null,
							latitude: null,
							longitude: null};
		var stationLinesCachedLength = stationLines.length;

		enyo.log("stationLines length: " + stationLinesCachedLength);
		this.wbDB.transaction(
			function(transaction) {
				for (i=0; i < stationLinesCachedLength; i = i + 1)	{
					oneLine = stationLines[i];
					// enyo.log("stationLine " + i + ": " + oneLine); 
					// stationLines array is not delimited, but fields are fixed-length,
					// so we need to split things by position offset in each line.
					// state = 1st 2 characters in the line
					// station name = 4th through 19th character positions
					// intl_id = 21 through 24
					// faa_id = 27 through 29
					// latitude = 40 - 45 (degrees, minutes, NSEW)
					// longitude = 48 - 54 (degrees, minutes, North, South, East, West) 
					// Note: Latitude and longitude need to be converted to decimal from
					// non-decimal format before storing in database.
					// Load station data in SQLite DB
					station.state = oneLine.substring(0,2);
					station.name = oneLine.substring(3,19);
					// trim any spaces from the right end of station.name
					station.name = station.name.replace(/^\s+|\s+$/g, '');
					station.intl_id = oneLine.substring(20,24);
					station.faa_id = oneLine.substring(26,29);
					station.latitude = that.lat_lon_2_decimal(oneLine.substring(39,45));
					station.longitude = that.lat_lon_2_decimal(oneLine.substring(47,54));
					// convert the latitude and longitude from strings to decimals.
					// enyo.log("Station: " + station.state + ", " + station.name + ", " + station.intl_id +
				   // ", " + station.faa_id + ", " + station.latitude + ", " + station.longitude); 
					transaction.executeSql('INSERT INTO weatherStation(state, station_name, intl_id, faa_id, ' +
													'latitude, longitude) ' +
					'VALUES(?, ?, ?, ?, ?, ? );', 
					[station.state, station.name, station.intl_id, station.faa_id, 
					 station.latitude, station.longitude]);
					}
		}, this.handleTransactionError, this.createTables.bind(this));
	},

	lat_lon_2_decimal: function(lat_lon_str) {
		// accept a string parameter of latitude or longitude
		// like 49 04N or 123 35W, consisting of degrees, minutes
		// and direction (NSEW) and convert to a corresponding
		// positive or negative decimal.
		var lat_lon_decimal;
		var compass_direction = lat_lon_str.substr(-1,1);
		var multiplier;
		var minutes = parseInt(lat_lon_str.substr(-3,2), 10);
		var degrees = parseInt(lat_lon_str.substring(0, lat_lon_str.indexOf(' ')), 10);
		// enyo.log("lat_lon_str: " + lat_lon_str + ", " + degrees + ", " + minutes);
	
		// The last character will be N,S,E or W.  N and E result
		// in positive values, while S and W are negative.
		if (compass_direction === 'N' || compass_direction === 'E')
			{multiplier = 1;}
		else
			{multiplier = -1;}
		// The two digits before the last character the string (the letter)
		// are the minutes - 0 to 60.  Convert this to decimal, then add 
		// to the left-most digits, the degrees.
		lat_lon_decimal = (degrees + (minutes / 60) ) * multiplier;

		return lat_lon_decimal;
	},

	dropTables: function() {
		
		this.initCounters();
		this.$.StartInitButton.setActive(true);
		this.$.StartInitButton.setCaption('Database now loading...');
		this.$.StartInitButton.setDisabled(true);
		this.$.ToolbarGrabBtn.setDisabled(true);
		this.$.ToolbarDoneBtn.setDisabled(true);
		var that = this;
		enyo.log("Dropping all tables...");
		this.$.ProgressDetail.setContent('Dropping database tables...');

		// Order of dropping tables is important for performance.
		// Drop in reverse order of creation / loading.
		this.wbDB.transaction(
			function(transaction) {
				transaction.executeSql('DROP TABLE IF EXISTS alertUGC;');
				transaction.executeSql('DROP TABLE IF EXISTS alertFIPS;');
				transaction.executeSql('DROP TABLE IF EXISTS CAPAlert;');
				transaction.executeSql('DROP TABLE IF EXISTS cityLocation;');
				transaction.executeSql('DROP TABLE IF EXISTS weatherStation;');
				transaction.executeSql('DROP TABLE IF EXISTS countyZone;');
			}, this.handleTransactionError, this.createZoneTable.bind(this));

	},

	createZoneTable: function() {

		// 07-JUL-2012 - George Mari
		// Create and then load each static table one-at-a-time,
		// instead of creating all tables first, then loading
		// in random order.
		// This improves loading performance dramatcially.
		// Speculation: storage of new data is done sequentially 
		// in the DB file, so it seems best to create a table,
		// then immediately load all its data.  Then move onto
		// the next table.
		var that = this;
		enyo.log("Creating Zone table...");
		this.$.ProgressDetail.setContent('Creating countyZone table...');

		this.wbDB.transaction(
			function(transaction) {
				transaction.executeSql('CREATE TABLE countyZone(state TEXT, ' +
												'zone_no TEXT, ' +
												'zone_name TEXT, ' + 
												'county_fips TEXT, ' +
												'county_name TEXT, ' +
												'latitude NUMERIC, ' +
												'longitude NUMERIC);');
				transaction.executeSql('CREATE INDEX cz_fips ON countyZone(county_fips);');
			}, this.handleTransactionError, this.loadZoneTable.bind(this));
	},

	createStationTable: function() {

		var that = this;
		enyo.log("Creating Station table...");
		this.$.ProgressDetail.setContent('Creating weatherStation table...');

		this.wbDB.transaction(
			function(transaction) {
				transaction.executeSql('CREATE TABLE weatherStation(state TEXT, ' +
												'station_name TEXT, ' +
												'intl_id TEXT, ' + 
												'faa_id TEXT, ' +
												'latitude NUMERIC, ' +
												'longitude NUMERIC);');
			transaction.executeSql('CREATE INDEX st_intl_id ON weatherStation(intl_id);');
			}, this.handleTransactionError, this.loadStationTable.bind(this));
	},

	loadZoneTable: function() {

		this.$.ProgressDetail.setContent("Now loading " + 'weather zones...');
		this.$.initDBLoadZoneFile.setUrl('../data/zones.txt');
		this.$.initDBLoadZoneFile.call();

	},

	loadStationTable: function() {

		this.$.ProgressDetail.setContent("Now loading " + 'weather stations...');
		this.$.initDBLoadStationFile.setUrl('../data/stations.txt');
		this.$.initDBLoadStationFile.call();
	},

	loadComplete: function() {

		enyo.log("Initialization complete.");
		this.$.ProgressDetail.setContent("Initialization complete.");
		// Update the progress bar
		this.cityFileIndex = this.cityFileIndex + 1;
		this.progPos = ((this.cityFileIndex + 1) / (this.workItems)) * 100; 
		this.$.InitProgress.setPosition(this.progPos);
		// reset out index for the city files - user may re-initialize the DB again.
		this.cityFileIndex = -1;
		this.logTableCounts();
		this.$.StartInitButton.setActive(false);
		this.$.StartInitButton.setCaption('Begin loading database');
		this.$.StartInitButton.setDisabled(false);
		this.$.ToolbarGrabBtn.setDisabled(false);
		this.$.ToolbarDoneBtn.setDisabled(false);
		// Write to preferences that initialization has completed successfully.
      this.$.setPreferencesCall.call({"InitDone": true});
	},

	logTableCounts: function()	{

		var that = this;
		this.wbDB.transaction(
			function(transaction) {
			transaction.executeSql('SELECT COUNT(*) AS clcount FROM cityLocation;', [],
				that.handleCountResult, that.handleSqlError);
			}
		);
		this.wbDB.transaction(
			function(transaction) {
			transaction.executeSql('SELECT COUNT(*) AS clcount FROM countyZone;', [],
				that.handleCountResult, that.handleSqlError);
			}
		);
	},

	startLoad: function(inSender) {
	
		enyo.log("Called startLoad: index/length " + this.cityFileIndex + "/" + this.cityFileList.length);
		// Increment the cityFile array index
		this.cityFileIndex = this.cityFileIndex + 1;

		// Check to see if we are at the end of our cityFile array
		if (this.cityFileIndex < this.cityFileListCachedLength) 
			{
			this.$.ProgressDetail.setContent("Now loading cities for " + this.cityFileList[this.cityFileIndex].name);
			this.$.initDBLoadFile.setUrl(this.cityFileList[this.cityFileIndex].file);
			this.$.initDBLoadFile.call();	
			// Wait until data is loaded in SQLite DB before continuing to next file
			}
		else
			{
			this.loadComplete();
			}
	},

	handleSqlError: function(transaction, error) {
		enyo.log("SQL statement error: [" + error.code + "]" + error.message);
	},

	handleTransactionError: function(error) {
		// enyo.log("SQL transaction error: [" + error.code + "]" + error.message);
		enyo.log("SQL transaction error.");
	},

	handleCreateTableSuccess: function() {
		enyo.log("createTables: statement succeeded.");
		// Process the next file, after a short delay, 
		// so as to not overwhelm the I/O subsystem...
		setTimeout(this.createTables.bind(this), 500);

	},

	handleCountResult: function(transaction, results) {
		var row = results.rows.item(0);	// Guaranteed only 1 row for this query.
		enyo.log("Count result: " + row.clcount);

	},
	
	createTables: function() {
		this.DBStatementIndex = this.DBStatementIndex + 1;
		var that = this;

		if (this.DBStatementIndex < this.DBStatementListCachedLength)
			{
			enyo.log("createTables: " + this.DBStatementList[this.DBStatementIndex]);
			this.$.ProgressDetail.setContent('Creating database objects...');
			this.wbDB.transaction(
				function (transaction) {
				transaction.executeSql(that.DBStatementList[that.DBStatementIndex]);
				}, this.handleTransactionError, this.handleCreateTableSuccess.bind(this)
				);
			}
		else
			{
			enyo.log("createTables: Processing complete.");
			this.$.ProgressDetail.setContent('Database object creation complete.');
			this.DBStatementIndex = -1;
			// Start loading data...
			this.startLoad();
			// Normally we would start loading the data here, but now,
			// we need to wait until we have the right "home" state for
			// the user.  
			}
	},

	setPrefsSuccess: function(inSender, inResponse) {
      enyo.log("InitializeView: Preferences saved successfully. Results = " + enyo.json.stringify(inResponse));
	},
	
	setPrefsFailure: function(inSender, inResponse) {
      enyo.log("InitializeView: Preference save failure.  Results = " + enyo.json.stringify(inResponse));
	},

	locationSuccess: function(inSender, inResponse) {
	   var gpsLat;
	   var gpsLong;
	   
	   enyo.log("Location search succeeded - results: " + enyo.json.stringify(inResponse));
	   gpsLat = inResponse.latitude;
	   gpsLong = inResponse.longitude;
	   
      this.$.ReverseLocationService.call({"latitude": gpsLat, "longitude": gpsLong});
	},

	locationFailure: function(inSender, inResponse) {
	   enyo.scrim.hide();
	   enyo.log("Location search failed - results: " + enyo.json.stringify(inResponse));
		// this.doFinished("GPS Search failed.");
	},

   ReverseLocSuccess: function(inSender, inResponse) {
	   // enyo.scrim.hide();
      // enyo.log("Reverse location search succeeded - inSender: " + enyo.json.stringify(inSender));
      enyo.log("Reverse location search succeeded - results: " + enyo.json.stringify(inResponse));

	   this.locString = inResponse.city + ", " + inResponse.state;
		// Once we successfully found what state we are in, load that state's
		// city data...
   },

   ReverseLocFailure: function(inSender, inResponse) {
      enyo.scrim.hide();
      enyo.log("Reverse location search failed - results: " + enyo.json.stringify(inResponse));
      switch(inResponse.errorCode) {
         case 6:
            this.errorMessage = "Location services are disabled.";
            break;
            
         case 7:
            this.errorMessage = "Reverse lookup - already a pending message from GPS service.";
            break;
            
         case 8:
            this.errorMessage = "Reverse lookup - temporarily blacklisted.";
            break;
            
         default: 
            this.errorMessage = "Reverse address lookup unkown failure.";
            break;
      }
      enyo.windows.addBannerMessage(this.errorMessage, "{}", null, null, "/media/internal/ringtones/Triangle (short).mp3", null);
   }	

});
