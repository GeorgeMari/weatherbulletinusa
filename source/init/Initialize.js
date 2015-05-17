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
	// 2. intiDBLoadZoneFile (initDBLoadZoneSuccess)
	create: function() {
		enyo.log("InitializeDB create function started.");
		this.inherited(arguments);

		this.DBStatementList = [
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
			'CREATE TABLE downloadAttempt(readId INTEGER NOT NULL, ' +
										'read_tstamp INTEGER NOT NULL, ' +
										'inet_available_yn TEXT, ' +
										'ca_dl_tstamp INTEGER, ' +
										'ca_success_yn TEXT, ' +
										'obs_dl_tstamp INTEGER, ' +
										'obs_success_yn TEXT);',
			'CREATE TABLE observation(stationId TEXT NOT NULL, ' +
										'obs_tstamp INTEGER NOT NULL, ' +
										'dl_stamp INTEGER NOT NULL, ' +
										'icon_url TEXT, ' +
										'temp_f NUMERIC, temp_c NUMERIC, ' +
										'weather TEXT, relative_humidity NUMERIC, ' +
										'wind_mph NUMERIC, wind_dir TEXT, wind_degrees NUMERIC, ' +
										'pressure_mb NUMERIC, ' +
										'pressure_inches NUMERIC, ' +
										'dewpoint_f NUMERIC, dewpoint_c NUMERIC, ' +
										'heatindex_f NUMERIC, heatindex_c NUMERIC, ' +
										'windchill_f NUMERIC, windchill_c NUMERIC, ' +
										'visibility_miles NUMERIC);', 
			'CREATE VIEW alert_not_notified AS ' +
					'SELECT CAPAlert.alertId ' +
          		  'FROM CAPAlert ' +
         		 'WHERE CAPAlert.notification_tstamp IS NULL ' +
        			'EXCEPT ' +
        			'SELECT CAPAlert.alertId ' +
          		  'FROM CAPAlert ' +
         		 'WHERE CAPAlert.notification_tstamp IS NOT NULL;',
			'CREATE VIEW latestCAPAlert AS ' +
					'SELECT alertUGC.ugc, CAPAlert.event, MAX(CAPAlert.download_tstamp) AS latest_dl_tstamp ' +
					  'FROM CAPAlert, alertUGC ' + 
					 'WHERE CAPAlert.alertId = alertUGC.alertId ' +
					 'GROUP BY alertUGC.ugc, CAPAlert.event;',
			'CREATE UNIQUE INDEX ca_pk ON CAPAlert(alertId, download_tstamp);',
			'CREATE INDEX ca_dlt ON CAPAlert(download_tstamp);',
			'CREATE INDEX af_id ON alertFIPS(alertId);',
			'CREATE INDEX af_dlt ON alertFIPS(download_tstamp);',
			'CREATE INDEX au_id ON alertUGC(alertId);',
			'CREATE INDEX au_dlt ON alertUGC(download_tstamp);',
			'CREATE INDEX da_rid ON downloadAttempt(readId);',
			'CREATE INDEX da_rt ON downloadAttempt(read_tstamp);',
			'CREATE INDEX ob_id ON observation(stationId);'
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

		// open the database
		this.wbDB = openDatabase("ext:WeatherBulletinUSADB", "1", "", "25000000");
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
		this.workItems = this.DBStatementListCachedLength + 1; 
		this.workItemIndex = 0;
		this.progPos = ((this.workItemIndex) / (this.workItems)) * 100; 

	},
	
	clickDone: function() {
      // this.cleanUp();
		this.$.InitProgress.setPosition(0);
		this.$.ProgressDetail.setContent('');
      // Return
		this.doBack();
	},

	LoadSeqTable: function(inSender, inResponse) {

		var that = this;

		this.wbDB.transaction(
			function(transaction) {
					transaction.executeSql('INSERT INTO readSeq(read_id_val) VALUES(1);');
		}, this.handleTransactionError, this.createZoneTable.bind(this));
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
							metar: null,
							radar: null,
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
					station.metar = oneLine.substring(62,63);
					station.radar = oneLine.substring(65,66);
					if (station.metar === "X") {
						station.metar = 'Y';
						}
					else {
						station.metar = 'N';
						}
					if (station.radar === "X") {
						station.radar = 'Y';
						}
					else {
						station.radar = 'N';
						}
					// convert the latitude and longitude from strings to decimals.
					station.latitude = that.lat_lon_2_decimal(oneLine.substring(39,45));
					station.longitude = that.lat_lon_2_decimal(oneLine.substring(47,54));
					// enyo.log("Station: " + enyo.json.stringify(station));
					// enyo.log("Station: " + station.state + ", " + station.name + ", " + station.intl_id +
				   // ", " + station.faa_id + ", " + station.latitude + ", " + station.longitude); 
					transaction.executeSql('INSERT INTO weatherStation(state, station_name, intl_id, faa_id, ' +
													'metar, radar, latitude, longitude) ' +
					'VALUES(?, ?, ?, ?, ?, ?, ?, ?);', 
					[station.state, station.name, station.intl_id, station.faa_id, 
					 station.metar, station.radar, station.latitude, station.longitude]);
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
		this.$.ToolbarGrabBtn.setDisabled(true);
		this.$.ToolbarDoneBtn.setDisabled(true);
		var that = this;
		enyo.log("Dropping all tables...");
		this.$.ProgressDetail.setContent('Dropping database tables...');
		// this.workItemIndex = this.workItemIndex + 1;
		this.progPos = ((this.workItemIndex) / (this.workItems)) * 100; 
		this.$.InitProgress.setPosition(this.progPos);
		// Order of dropping tables is important for performance.
		// Drop in reverse order of creation / loading.
		this.wbDB.transaction(
			function(transaction) {
				transaction.executeSql('DROP VIEW IF EXISTS alert_not_notified;');
				transaction.executeSql('DROP VIEW IF EXISTS latestCAPAlert;');
				transaction.executeSql('DROP TABLE IF EXISTS observation;');
				transaction.executeSql('DROP TABLE IF EXISTS downloadAttempt;');
				transaction.executeSql('DROP TABLE IF EXISTS alertUGC;');
				transaction.executeSql('DROP TABLE IF EXISTS alertFIPS;');
				transaction.executeSql('DROP TABLE IF EXISTS CAPAlert;');
				transaction.executeSql('DROP TABLE IF EXISTS cityLocation;');
				transaction.executeSql('DROP TABLE IF EXISTS weatherStation;');
				transaction.executeSql('DROP TABLE IF EXISTS countyZone;');
				transaction.executeSql('DROP TABLE IF EXISTS readSeq;');
			}, this.handleTransactionError, this.createSeqTable.bind(this));

	},

	createSeqTable: function() {
		this.$.ProgressDetail.setContent('Creating readSeq table...');
		this.workItemIndex = this.workItemIndex + 1;
		this.progPos = ((this.workItemIndex) / (this.workItems)) * 100; 
		this.$.InitProgress.setPosition(this.progPos);
		var that = this;
		enyo.log("Creating readSeq table...");

		this.wbDB.transaction(
			function(transaction) {
				transaction.executeSql('CREATE TABLE readSeq(read_id_val INTEGER);');
			}, this.handleTransactionError, this.LoadSeqTable.bind(this));
	
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
		this.$.ProgressDetail.setContent('Creating countyZone table...');
		this.workItemIndex = this.workItemIndex + 1;
		this.progPos = ((this.workItemIndex) / (this.workItems)) * 100; 
		this.$.InitProgress.setPosition(this.progPos);
		var that = this;
		enyo.log("Creating Zone table...");

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

		this.workItemIndex = this.workItemIndex + 1;
		this.progPos = ((this.workItemIndex) / (this.workItems)) * 100; 
		this.$.InitProgress.setPosition(this.progPos);
		enyo.log("Creating Station table...");
		this.$.ProgressDetail.setContent('Creating weatherStation table...');
		var that = this;

		this.wbDB.transaction(
			function(transaction) {
				transaction.executeSql('CREATE TABLE weatherStation(state TEXT, ' +
												'station_name TEXT, ' +
												'intl_id TEXT, ' + 
												'faa_id TEXT, ' +
												'metar TEXT, ' +
												'radar TEXT, ' +
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
		this.workItemIndex = this.workItemIndex + 1;
		this.progPos = ((this.workItemIndex) / (this.workItems)) * 100; 
		this.$.InitProgress.setPosition(this.progPos);
		// reset out index for the city files - user may re-initialize the DB again.
		this.cityFileIndex = -1;
		this.logTableCounts();
		this.$.ToolbarGrabBtn.setDisabled(false);
		this.$.ToolbarDoneBtn.setDisabled(false);
		// Write to preferences that initialization has completed successfully.
      this.$.setPreferencesCall.call({"InitDone": true});
	},

	logTableCounts: function()	{

		var that = this;
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
		this.workItemIndex = this.workItemIndex + 1;
		this.progPos = ((this.workItemIndex) / (this.workItems)) * 100; 
		this.$.InitProgress.setPosition(this.progPos);
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
			// this.startLoad();
			this.loadComplete();
			}
	},

	setPrefsSuccess: function(inSender, inResponse) {
      enyo.log("InitializeView: Preferences saved successfully. Results = " + enyo.json.stringify(inResponse));
	},
	
	setPrefsFailure: function(inSender, inResponse) {
      enyo.log("InitializeView: Preference save failure.  Results = " + enyo.json.stringify(inResponse));
	}

});
