/*
|| 24-MAR-2015 - George Mari
|| Re-factor all functions related to processing weather alerts into this separate file.
*/
enyo.kind({
	name: "wbu_alerts_dl",
	kind: "Component",
	components: [
      {name: "wbDashboard", kind:"Dashboard", onMessageTap: "wbMessageTap", onIconTap: "wbIconTap", 
				onUserClose: "wbDashboardClose", onLayerSwipe: "wbLayerSwiped", onDashboardActivated: "wbdbActivated"},

		{name: "downLoadNWSAlerts", 
			kind: "WebService",
			onSuccess: "NWSSuccess",
			onFailure: "NWSFailure"} 
	],

	create: function() {
		this.inherited(arguments);
   
		enyo.log("wbu_alerts_dl: executing create.");
		this.uniqueStates = [];
		this.stateCounter = -1;
		this.uniqueStatesCachedLength = 0;
		this.alerts = [];
		this.alertLocations = [];
		this.alertsCounter = -1;
		this.soundFile = "";
   },

	downLoadAlerts: function(p_alertLocations, p_stateList, p_soundfile) {
      enyo.log("downLoadAlerts starting. stateList is " + p_stateList);

		// Next, see what kind of Internet connection we have, and compare
		// that info to what user has indicated in preferences for how they
		// want to download data based on different connection types.
		// (WiFi vs. cellular)

		if (p_soundfile !== undefined) {
			// enyo.log("downloadAlerts - p_soundfile is: " + p_soundfile);
			this.soundFile = p_soundfile;
			}
		// Download the alerts data for the state we are working on, indicated by
		// this.stateCounter, indexing the this.uniqueStates array.
		if(p_alertLocations !== undefined) {
			// enyo.log("downLoadAlerts - assigning alertLocations...");
			this.alertLocations = p_alertLocations;
			}
		else {
			// enyo.log("downLoadAlerts - p_alertLocations parameter was not set...");
			}

		if(p_stateList !== undefined) {
			// Only assign this to our "global" variable if 
			// a value was passed in.
			// enyo.log("downLoadAlerts - assigning uniqueStates...");
			this.uniqueStates = p_stateList;
			}
		else {
			// enyo.log("downLoadAlerts - p_stateList parameter was not set...");
			}
		this.stateCounter = this.stateCounter + 1;
		// enyo.log("counter: " + this.stateCounter + " length: " + this.uniqueStates.length);
		if(this.stateCounter + 1 <= this.uniqueStates.length) {
			var NWSUrlPart1 = "http://alerts.weather.gov/cap/";
			var NWSUrlPart2 = ".php?x=0";
			var NWSUrl = NWSUrlPart1 + this.uniqueStates[this.stateCounter] + NWSUrlPart2;
			// enyo.log("NWSUrl is " + NWSUrl);
			this.$.downLoadNWSAlerts.setUrl(NWSUrl);
			this.$.downLoadNWSAlerts.call();
			// Parse the XML do XPath queries to extract relevant data.

			// Insert data into database.
			}
		else
			{
			// We've gone through all the states, reset the stateCounter for next time the alarm goes off...
			this.stateCounter = -1;
			// Check to see if we have any new alerts that we need to show a notification for...
			this.notifyAndMark();
			}
	},

	displayAlerts: function() {
		enyo.log("displayAlerts starting...");

		// Query database for new alerts.

		// Display new alerts to user.
	},

	NWSSuccess: function(inSender, inResponse) {
		// We successfully downloaded a state-specific NWS alert XML file.
		// Save the current time to use as a timestamp for data we will
		// be loading into our database.
		var dlTime = new Date();
		var dl_timestamp = dlTime.getTime();
		enyo.log("NWS alert file downloaded successfully.");
		// enyo.log(enyo.json.stringify(inResponse));

      // Hack apart the returned string in Javascript, since I 
		// couldn't figure out how to use xpath on webOS. 
		var alertLines = inResponse.split("</entry>");
		// There is a </feed> end-tag after the last </entry> tag,
		// which we don't need, so we should truncate the last entry
		// in the array.
		alertLines.splice(alertLines.length - 1, 1);

		var alertLinesCachedLength = alertLines.length;
		var cachedPrefsLength = this.alertLocations.length;
		var i;
		// Clean out the alerts array.
		this.alerts.splice(0);
	
		for (i=0; i < alertLinesCachedLength; i=i+1) {
			var oneAlertLine = alertLines[i];
			// Lop off beginning of string up to "<entry>".  
			// This fixes a bug with first "<entry>" delimiter in array.
			oneAlertLine = oneAlertLine.slice(oneAlertLine.indexOf("<entry>"));
			//enyo.log(enyo.json.stringify(oneAlertLine));
			var alertId = oneAlertLine.slice(oneAlertLine.indexOf("<id>")+4, oneAlertLine.indexOf("</id>"));
			// enyo.log('alertId: ' + alertId);
			var alertTitle = oneAlertLine.slice(oneAlertLine.indexOf("<title>")+7, oneAlertLine.indexOf("</title>"));
			// enyo.log('alertTitle: ' + alertTitle);
			if (alertTitle.indexOf('There are no active') < 0)
				{ 
				// We did not find the indicator that there are no alerts in the results,
				// so process the results.
				var alertUpdtTstampStr = oneAlertLine.slice(oneAlertLine.indexOf("<updated>")+9, oneAlertLine.indexOf("</updated>"));
				var alertUpdtTstampDate = new Date(alertUpdtTstampStr);
				var alertUpdtTstamp = alertUpdtTstampDate.getTime();
				// enyo.log('alertUpdt: ' + alertUpdtTstampStr + ', ' + alertUpdtTstamp);
				var alertPubTstampStr = oneAlertLine.slice(oneAlertLine.indexOf("<published>")+11, oneAlertLine.indexOf("</published>"));
				var alertPubTstampDate = new Date(alertPubTstampStr);
				var alertPubTstamp = alertPubTstampDate.getTime();
				// enyo.log('alertPub: ' + alertPubTstampStr + ', ' + alertPubTstamp);
				var alertLink =  oneAlertLine.slice(oneAlertLine.indexOf("<link")+5);
				alertLink = alertLink.slice(0, alertLink.indexOf("/>"));
				// enyo.log('alertLink: ' + alertLink);
				var alertSummary = oneAlertLine.slice(oneAlertLine.indexOf("<summary>")+9, oneAlertLine.indexOf("</summary>"));
				// enyo.log('alertSummary: ' + alertSummary);
				var CAPEvent = oneAlertLine.slice(oneAlertLine.indexOf("<cap:event>")+11, oneAlertLine.indexOf("</cap:event>"));
				// enyo.log('CAPEvent: ' + CAPEvent);
				var CAPEffectiveStr = oneAlertLine.slice(oneAlertLine.indexOf("<cap:effective>")+15, oneAlertLine.indexOf("</cap:effective>"));
				var CAPEffectiveDate = new Date(CAPEffectiveStr);
				var CAPEffective = CAPEffectiveDate.getTime();
				// enyo.log('CAPEffective: ' + CAPEffectiveStr + ', ' + CAPEffective);
				var CAPExpiresStr = oneAlertLine.slice(oneAlertLine.indexOf("<cap:expires>")+13, oneAlertLine.indexOf("</cap:expires>"));
				var CAPExpiresDate = new Date(CAPExpiresStr);
				var CAPExpires = CAPExpiresDate.getTime();
				// enyo.log('CAPExpires: ' + CAPExpiresStr + ', ' + CAPExpires);
				var CAPStatus = oneAlertLine.slice(oneAlertLine.indexOf("<cap:status>")+12, oneAlertLine.indexOf("</cap:status>"));
				// enyo.log('CAPStatus: ' + CAPStatus);
				var CAPmsgType = oneAlertLine.slice(oneAlertLine.indexOf("<cap:msgType>")+13, oneAlertLine.indexOf("</cap:msgType>"));
				// enyo.log('CAPmsgType: '+ CAPmsgType);
				var CAPcategory = oneAlertLine.slice(oneAlertLine.indexOf("<cap:category>")+14, oneAlertLine.indexOf("</cap:category>"));
				// enyo.log('CAPcategory: ' + CAPcategory);
				var CAPurgency = oneAlertLine.slice(oneAlertLine.indexOf("<cap:urgency>")+13, oneAlertLine.indexOf("</cap:urgency>"));
				// enyo.log('CAPurgency: ' + CAPurgency);
				var CAPseverity = oneAlertLine.slice(oneAlertLine.indexOf("<cap:severity>")+14, oneAlertLine.indexOf("</cap:severity>"));
				// enyo.log('CAPseverity: ' + CAPseverity);
				var CAPcertainty = oneAlertLine.slice(oneAlertLine.indexOf("<cap:certainty>")+15, oneAlertLine.indexOf("</cap:certainty>"));
				// enyo.log('CAPcertainty: ' + CAPcertainty);
				var alertAreaDesc = oneAlertLine.slice(oneAlertLine.indexOf("<cap:areaDesc>")+14);
				alertAreaDesc = alertAreaDesc.slice(0, alertAreaDesc.indexOf("</cap:areaDesc>"));
				// enyo.log('alertAreaDesc: ' +alertAreaDesc);
				var alertZones = oneAlertLine.slice(oneAlertLine.indexOf("<cap:geocode>")+13);
				alertZones = alertZones.slice(alertZones.indexOf("<valueName>UGC</valueName>")+26);
				alertZones = alertZones.slice(alertZones.indexOf("<value>")+7);
				alertZones = alertZones.slice(0, alertZones.indexOf("</value>"));
				alertZones = alertZones.split(" ");
				// enyo.log('alertZones: ' + enyo.json.stringify(alertZones));
				//	
				//	We only want to add this to the alerts array if any of the zones for the alert
				//	match any of the zones stored in our preferences.
				//	First, loop through the alertLocations (preferences) array.
				prefsloop:
				for (p=0; p < cachedPrefsLength; p=p+1) {
					// enyo.log('Entered prefsloop.  p is ' + p);
					// Sometimes the zone string from the download will contain a C instead of a Z.
					// This means the code is a FIPS code instead of a UGC code.
					var prefZoneString = this.alertLocations[p].UgcZone;
					var prefCntyString = this.alertLocations[p].UgcCounty;
					// Loop through the zones in the alert we just downloaded and parsed
					var cachedAlertZonesLength = alertZones.length;
					for (z=0; z < cachedAlertZonesLength; z=z+1) {
						// enyo.log('Entered zone loop.  z is ' + z);
						// enyo.log(prefZoneString + '(' + prefCntyString + ')' + '/' + alertZones[z]);
						if (prefZoneString === alertZones[z] ||
							prefCntyString === alertZones[z]) {
							this.alerts.push({
									id: alertId,
									upd_tstamp: alertUpdtTstamp,
									pub_tstamp: alertPubTstamp,
									dl_tstamp: dl_timestamp,
									title: alertTitle,
									link: alertLink,
									summary: alertSummary,
									cap_event: CAPEvent,
									cap_effective: CAPEffective,
									cap_expires: CAPExpires,
									cap_status: CAPStatus,
									cap_msgType: CAPmsgType,
									cap_category: CAPcategory,
									cap_urgency: CAPurgency,
									cap_severity: CAPseverity,
									cap_certainty: CAPcertainty,
									areaDesc: alertAreaDesc,
									zones: alertZones
									});
							// After we've added this alert to the array, we need to quit
							// the outer loop, and go on to the next downloaded alert.
							// enyo.log('Breaking out of the prefsloop. alerts.length is ' + this.alerts.length);
							break prefsloop;
							}
						}
					}
				}
			}
		// Call storeAlerts to get data for this state into the database.
		if (this.alerts.length > 0)
			{
			this.storeAlerts();
			}
		else
			{
			// There weren't any alerts for this state, move on to the next.
			this.downLoadAlerts();
			}

	},

	storeAlerts: function() {
		// Cache the length of our alerts array.
		// this.alertsCachedLength = this.alerts.length;
		// enyo.log("alerts array cached length: " + this.alertsCachedLength);

		// this.CAPArrayIndex = 0;

		this.wbDB = openDatabase("ext:WeatherBulletinUSADB", "1", "", "25000000");
		// enyo.log("wbDB: " + enyo.json.stringify(this.wbDB));

		this.alertsCounter = this.alertsCounter + 1;
		if (this.alertsCounter + 1 <= this.alerts.length) {
			this.CAPAlertInsert(this.alertsCounter);
			}
		else {
			this.alertsCounter = -1;
			this.downLoadAlerts();
			}
		/*
		for(c=0; c < this.alertsCachedLength; c = c + 1) {
			// enyo.log("Processing cached alerts " + (c+1) + " of " + this.alertsCachedLength);
			this.CAPAlertInsert(c);
			}
		*/
		// This call to downLoadAlerts is probably causing a bug.
		// It needs to be called in the call-back for the Sql calls
		// in CAPAlertInsert.
		// Without this, we are reading from the database in notifyAndMark
		// before the data inserts happening in CAPAlertInsert are completed.
		// This causes alerts that need to displayed in the dashboard to 
		// not be displayed until the next time the alarm goes off, 
		// which could be many minutes later.
		// this.downLoadAlerts();

	},

	CAPAlertInsert: function(i) {
		enyo.log('CAPAlertInsert called with parameter: ' + i);
		var that = this;
		// Insert alert row into the CAPAlert table
		this.wbDB.transaction(
			function (transaction) {
				transaction.executeSql('INSERT INTO CAPAlert(alertId, ' +
																	'updated_tstamp, ' +
																	'published_tstamp, ' +
																	'title, ' +
																	'url, ' +
																	'summary, ' +
																	'event, ' +
																	'effective_tstamp, ' +
																	'expiration_tstamp, ' +
																	'download_tstamp, ' +
																	'status, ' +
																	'msgType, ' +
																	'category, ' +
																	'urgency, ' +
																	'severity, ' +
																	'certainty, ' +
																	'areaDesc' +
																	') ' +
									'VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? );',
									[that.alerts[i].id,
									that.alerts[i].upd_tstamp, // udpated tstamp
									that.alerts[i].pub_tstamp, // published tstamp	
									that.alerts[i].title, // title
									that.alerts[i].link, // url
									that.alerts[i].summary, // summary
									that.alerts[i].cap_event, // event
									that.alerts[i].cap_effective, // effective
									that.alerts[i].cap_expires, // expiration
									that.alerts[i].dl_tstamp,	// download timestamp
									that.alerts[i].cap_status, // status
									that.alerts[i].cap_msgType, // msgType
									that.alerts[i].cap_category, // category
									that.alerts[i].cap_urgency, // urgency
									that.alerts[i].cap_severity, // severity
									that.alerts[i].cap_certainty, // certainty
									that.alerts[i].areaDesc
									]);
				// Insert detail records
				// For each INSERT into the CAPAlert table, we will need to INSERT
				// one or more rows into the alertUGC table, for the different UGC
				// zones included in the alert.
				// var i = this.CAPArrayIndex;
				var alertZonesCachedLength = that.alerts[i].zones.length;
				var alertZonesCachedDlTstamp = that.alerts[i].dl_tstamp;
				// enyo.log('Storing zone data: ' + enyo.json.stringify(that.alerts[i].zones));
				for (z=0; z < alertZonesCachedLength; z = z + 1) {
					// enyo.log("that.alerts: " + enyo.json.stringify(that.alerts));
					// enyo.log("length of that.alerts: " + that.alerts.length);
					// enyo.log("that.CAPArrayIndex: " + that.CAPArrayIndex);
					transaction.executeSql('INSERT INTO alertUGC(alertId, download_tstamp, ugc) ' +
														'VALUES(?, ?, ?);',
							[that.alerts[i].id,	// alertId
							that.alerts[i].dl_tstamp,	// download_tstamp
							that.alerts[i].zones[z]	// UGC (zone)
							]);
						}
					}, that.handleSqlError, that.storeAlerts.bind(that)
				);
		},

	pruneAlerts: function()
		{
		// Eliminate duplicate alerts that have been downloaded and stored.
		// First, eliminate dupes in the alertUGC table.  Keep the rows with
		// smallest value of download_tstamp.
		// SELECT alertId, MIN(download_tstamp), ugc
		//   FROM alertUGC
		//  GROUP
		//     BY alertId, ugc

		// Next, eliminate dupes in the CAPAlert table.

		// Eliminate rows in CAPAlert and alertUGC for alerts
		// that have expired. (expiration_tstamp is in the past)
		// Don't eliminate rows for alerts that the user has not acknowledged 
		// the corresponding notification in the OS?
	},
	
	pruneComplete: function()
		{
		// After the pruning of duplicate alert records is completed, go
		// on to the next step.
	},

	notifyAndMark: function()
		{
		// Where the rubber meets the road: Find alert records for zones the user
		// has set in the app preferences, that we have not already notified the user of,
		// and notify the user.
		// enyo.log("Entered notifyAndMark...");
		this.wbDB = openDatabase("ext:WeatherBulletinUSADB", "1", "", "25000000");

		var that = this;
		// Query the database for any weather alerts we have not notified the user about.
		this.wbDB.transaction(
			function(transaction) {
				// Only notify the user for alerts with a severity of 'Severe' or 'Extreme'.
				// Other alerts will appear in the UI when the user opens the app.
				transaction.executeSql('SELECT CAPAlert.*, alertUGC.ugc ' +
												' FROM CAPAlert, alertUGC ' +
												'WHERE notification_tstamp IS NULL ' +
												'  AND CAPAlert.alertId = alertUGC.alertId ' +
												'  AND CAPAlert.severity IN (\'Severe\', \'Extreme\') ' +
												'ORDER BY CAPAlert.alertId ASC, alertUGC.ugc ASC;',
					[],
					that.nMDataHandler.bind(that), that.handleSqlError
				);
			}
		);
	},

	nMDataHandler: function(transaction, results) {
		// 05-JUN-2014 - George Mari
		// Loop through the query results.  There can be multiple rows per alert -
		// one row for each UGC (geographic) zone the alert applies to.  Only push 
		// the alert once for each alertId, but include the list of all zones in the
		// call to wbPushDashboard so that the banner message has the corresponding
		// zone data.  This will be used to sync up to the correct item in the carousel
		// of the MainView when the user taps on the banner message.
		var current_zone_list = '';
		var current_alertId = '';
		var current_alertTitle = '';
		var current_urgency = '';
		var current_severity = '';
		var current_certainty = '';

		// enyo.log("nMDataHandler - entering...");
		for (i=0; i<results.rows.length; i=i+1) {
			// enyo.log("nMDataHandler - results loop i=" + i);
			var row = results.rows.item(i);
			// enyo.log("nMDataHandler - current_alertId: " + current_alertId + " row.alertId: " + row.alertId);
			if (current_alertId !== row.alertId) {
				enyo.log("nMDataHandler - alert USC: " + current_urgency + "/" + current_severity + "/" + current_certainty);
				this.wbPushDashboard(current_alertTitle, current_zone_list);
				current_zone_list = row.ugc;
				}
			else {
				if (current_zone_list === '') {
					current_zone_list = row.ugc;
					}
				else {
					current_zone_list = current_zone_list + ', ' + row.ugc;
					}
				}
			current_alertId = row.alertId;
			current_alertTitle = row.title;
			current_urgency = row.urgency;
			current_severity = row.severity;
			current_certainty = row.certainty;
		}
		// Now that all alerts have been pushed to the dashboard,
		// mark them in the database as having been notified.
		this.alertMark();

	},

	alertMark: function() {
		// Wait to mark our records as notified until 
		// after we perform the push to dashboard
		// for all alerts and states.
		enyo.log("entered alertMark...");
		this.wbDB = openDatabase("ext:WeatherBulletinUSADB", "1", "", "25000000");

		var that = this;
		// Query the database for any weather alerts we have not notified the user about.
		this.wbDB.transaction(
			function(transaction) {
				var nTime = new Date();
				var n_timestamp = nTime.getTime();
				transaction.executeSql('UPDATE CAPAlert ' +
												'  SET notification_tstamp = ? ' +
												'WHERE notification_tstamp IS NULL;',
					[n_timestamp]
				);
			}
		);
	},

	handleSqlError: function(transaction, error) {
		enyo.log("SQL statement error: [" + error.code + "]" + error.message);
	},

	NWSFailure: function(inSender, inResponse) {
		enyo.log("Failed to download NWS alert file.");
	},

	loadComplete: function() {
		enyo.log("storeAlerts transaction complete.  Calling downloadAlerts...");
		// Call downLoadAlerts to get the XML file for the next state, if any.
		this.downLoadAlerts();
	},

	handleTransactionError: function(error) {
      enyo.log("SQL transaction error: [" + error.code + "]" + error.message);
		// enyo.log("SQL transaction error.");
	},

	wbPushDashboard: function(inText, zoneList) {
		// There are 3 important attributes to each alert that determine
		// the amount of attention the corresponding dashboard alert should generate:
		// urgency, severity and certainty.
		//
		// From a UI perspective, there are 3 desired actions, or level of attention
		// the app should generate: 
		// 1. Informational or silent alert.
		// 2. Audible alert, non-repeating.
		// 3. Repeating, audible alert. This should only be used when the level of
		//    danger warrants waking you up if you're sleeping, because your life is
		//    threatened.
		// 
		// Urgency:
		// “Immediate” - Responsive action
		// SHOULD be taken immediately
		// “Expected” - Responsive action SHOULD
		// be taken soon (within next hour)
		// “Future” - Responsive action SHOULD be
		// taken in the near future
		// “Past” - Responsive action is no longer
		// required
		// “Unknown” - Urgency not known
		//
		// Severity: 
		// “Extreme” - Extraordinary threat to life or
		// property
		// “Severe” - Significant threat to life or
		// property
		// “Moderate” - Possible threat to life or
		// property
		// “Minor” - Minimal threat to life or property
		// “Unknown” - Severity unknown
		//
		// Certainty:
		// “Observed” – Determined to have
		// occurred or to be ongoing.
		// “Likely” - Likely (p > ~50%)
		// “Possible” - Possible but not likely (p <=
		// ~50%)
		// “Unlikely” - Not expected to occur (p ~ 0)
		// “Unknown” - Certainty unknown
		//
		// The above logic makes sense for weather alerts that apply to the 
		// home location of the user, but may not make sense for non-local locations
		// that are also being monitored.  We should implement the option on each 
		// location to make all alerts silent.
		// 
		var zoneArray = [];
		var i;
		var cachedPrefsLength = this.alertLocations.length;
		var p;
		var dash_title;

		enyo.log("wbPushDashboard - zonelist: " + zoneList);
		enyo.log("wbPushDashboard - this.alertLocations: " + enyo.json.stringify(this.alertLocations));
		enyo.log("wbPushDashboard - this.soundFile: " + this.soundFile);

		// Loop through the passed-in zoneList.
		zoneArray = zoneList.split(',');
		enyo.log("wbPushDashboard - zoneArray: " + zoneArray);
		for (i=0; i < zoneArray.length; i=i+1) {
			// For each zone, check this.alertLocations to see which city from preferences matches.
			enyo.log("wpPushDashboard - i = " + i);
			for (p=0; p < cachedPrefsLength; p=p+1) {
					enyo.log("wpPushDashboard - p = " + p);
					var prefZoneString = this.alertLocations[p].UgcZone;
					var prefCntyString = this.alertLocations[p].UgcCounty;
				if (zoneArray[i] == this.alertLocations[p].UgcZone ||
					 zoneArray[i] == this.alertLocations[p].UgcCounty) {
					// For each city that matches, display a banner message and push a message to the dashboard.
					dash_title = this.alertLocations[p].city_name + ", " + this.alertLocations[p].state;
					enyo.log("wpPushDashboard - calling addBannerMessage...");
					enyo.windows.addBannerMessage(dash_title + " - Weather Bulletin", "{zonelist: " + zoneList + "}", null, null, this.soundFile, null);
					enyo.log("wpPushDashboard - calling Dashboard.push...");
					this.$.wbDashboard.push({icon:"images/sample-icon.png", title:dash_title, text:inText});
					}
				}
			}
	},

   wbdbActivated: function(dash) { 
		var l; 
		enyo.log("wbdbActivated: entered..."); 
		for(l in dash) { 
			var c = dash[l].dashboardContent; 
			if(c) { 
				c.$.topSwipeable.applyStyle("background-color", "black"); 
				} 
			}
	},

	wbPopDashboard: function() {
		this.$.wbDashboard.pop();
	},

	wbMessageTap: function(inSender, layer) {
		// this.$.status.setContent("Tapped on message: "+layer.text);
		enyo.log("wbMessageTap - tapped on message: " + layer.text);
		enyo.log("wbMessageTap: inSender-" + inSender);
		enyo.log("wbMessageTap: layer-" + layer);
      this.MainWindow = enyo.windows.activate("source/index.html", "MainWindow", {view: "MainView"});
	},

	wbIconTap: function(inSender, layer) {
		enyo.log("wbDashboard - tapped on icon for message: " + layer.text);
	},

	wbDashboardClose: function(inSender) {
		enyo.log("Closed wbDashboard.");
	},

	wbLayerSwiped: function(inSender, layer) {
		enyo.log("wbDashboard - swiped layer: " + layer.text);
	}
});
