/*
|| 31-JAN-2012 - George Mari|
|| Our root, headless window.  Everything runs through here.
*/

var sqlDB = "";

enyo.kind({
   name: "wbLaunch",
   kind: "Control",
   style: "display:none;",
   components: [
      {kind: "ApplicationEvents",
      onApplicationRelaunch: "applicationRelaunchHandler"},

      {name : "getPreferencesCall",
      kind : "PalmService",
      service : "palm://com.palm.systemservice/",
      method : "getPreferences",
      onSuccess : "getPrefsSuccess",
      onFailure : "getPrefsFailure",
      subscribe : false}, 
      
      {name: "wbSetAlarm",
      kind: "PalmService",
      service: "palm://com.palm.power/timeout/",
      method: "set",
      onSuccess: "wbSetAlarmSuccess",
      onFailure: "wbSetAlarmFailure",
      subscribe: true},

      {name: "wbDashboard", kind:"Dashboard", onMessageTap: "wbMessageTap", onIconTap: "wbIconTap", 
				onUserClose: "wbDashboardClose", onLayerSwipe: "wbLayerSwiped"},

		{name: "downLoadNWSAlerts",
			kind: "WebService",
			onSuccess: "NWSSuccess",
			onFailure: "NWSFailure"},

		{name: "dlNWS_cc",
			kind: "WebService",
			onSuccess: "NWS_cc_Success",
			onFailure: "NWS_cc_Failure"}

 ],
  
   applicationRelaunchHandler: function(inSender, inEvent) {

      enyo.log("wbLaunch: relaunch handler called with action: " + enyo.windowParams.action);

      if (enyo.windowParams.action === 'check_alerts') {
         enyo.log("wbLaunch: relaunch handler called to check_alerts." + enyo.json.stringify(enyo.windowParams));
         // this.wbPushDashboard("Checking alerts...");
         // enyo.log("inSender: " + enyo.json.stringify(inSender));
         // enyo.log("inEvent: " + enyo.json.stringify(inEvent));
         
			this.checkAlerts();
         // return true;
         }
      else {
         enyo.log("wbLaunch: relaunch handler called to launch the application.");
			enyo.log("windowParams.action is: " + enyo.windowParams.action);
         
         // Determine if we are starting the app for the first time since installation.
         // If so, we need to initialize our SQLite database of cities and NWS zones.
         // sqlDB = openDatabase(name:"ext:weatherDB", version:"1");
         this.MainWindow = enyo.windows.activate("source/index.html", "MainWindow", {view: "PrefsView"});
         // return true;
         }
		return true;
   },

	create: function() {
		this.inherited(arguments);
   
		enyo.log("wbLaunch: executing create.");
		this.uniqueStates = [];
		this.stateCounter = -1;
		this.uniqueStatesCachedLength = 0;
		this.alerts = [];

		this.uniqueStations = [];
		this.stationCounter = -1;
		this.uniqueStationsCachedLength = 0;
		this.CC = [];

		if (enyo.windowParams.action === 'check_alerts') {
			enyo.log("wbLaunch: create called to check_alerts.");
			this.checkAlerts();
			return true;
			}
		else {
			enyo.log("wbLaunch: create called to launch the application.");
			this.MainWindow = enyo.windows.activate("source/index.html", "MainWindow", {view: "PrefsView"});
		// return true;
			}
   },

	checkAlerts: function() {
		enyo.log("checkAlerts starting...");
		// Re-set the alarm to check again, in the future.
		// Need to change from hard-coded value to one retrieved
		// from preferences.
      this.$.wbSetAlarm.call(
         {key: "com.georgemari.weatherbulletinusa.check_alerts",
         "in": "00:00:30",
         "wakeup": true,
         uri: "palm://com.palm.applicationManager/launch",
         params: '{"id": "com.georgemari.weatherbulletinusa", "params": {"action": "check_alerts"}}'
         });
		// Download alerts.  Sequence of events through various callbacks will be:
		// 1. Re-load app preferences to determine which states need downloading.
		// 2. Download alerts for locations we are monitoring based on preferences 
		//    and type of connection. (WiFi = un-metered, Cellular = metered.)
		// 3. Populate results into the database.
		// 4. Read the database for any new alerts that we need to alert the user to.
		// 5. If we have new alerts, push a webOS alert to the dashboard.
		// 6. Mark the alert in the database as having been shown to the user.
		enyo.log("uniqueStates before getPrefsCall: " + enyo.json.stringify(this.uniqueStates));
		this.$.getPreferencesCall.call({"keys": ["Locations"]});

		// Call a function that looks in our database to see if we have any new alerts
		// that we need to alert the user to.  Display alert info on dashboard, if so,
		// then mark the alert as having been displayed to the user.

		return true;
	},

	downLoadAlerts: function() {
      enyo.log("downLoadAlerts starting...");

		// Next, see what kind of Internet connection we have, and compare
		// that info to what user has indicated in preferences for how they
		// want to download data based on different connection types.
		// (WiFi vs. cellular)

		// Download the alerts data for the state we are working on, indicated by
		// this.stateCounter, indexing the this.uniqueStates array.
		this.stateCounter = this.stateCounter + 1;
		enyo.log("counter: " + this.stateCounter + " length: " + this.uniqueStatesCachedLength);
		if(this.stateCounter + 1 <= this.uniqueStatesCachedLength)
			{
			var NWSUrlPart1 = "http://alerts.weather.gov/cap/";
			var NWSUrlPart2 = ".php?x=0";
			var NWSUrl = NWSUrlPart1 + this.uniqueStates[this.stateCounter] + NWSUrlPart2;
			enyo.log("NWSUrl is " + NWSUrl);
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
			this.downloadCurrentConditions();
			}
	},

	downloadCurrentConditions: function() {
		// Each city we have saved in our preferences 
		// will have the id of the weather station we will
		// download current observations for.  
		// The general URL pattern is http://weather.gov/xml/current_obs/station_id.xml
		var CCUrlPart1 = "http://weather.gov/xml/current_obs/";
		var CCUrlPart2 = ".xml";
		var CCUrl = "";
		var uniqueStationIds = [];
		var uniqueStations = {};
		var o = {};
		enyo.log('downloadCurrentConditions: this.alertLocations is ' + enyo.json.stringify(this.alertLocations));
		// Generate a list of unique stationIds from our alert locations.
		for (i=0; i < this.alertLocations.length; i=i+1) {
			uniqueStations[this.alertLocations[i].obsvStationId] = this.alertLocations[i].obsvStationId;
		}
      for (o in uniqueStations) {
			if (uniqueStations.hasOwnProperty(o)) {
				uniqueStationIds.push(uniqueStations[o]);
			}
		}

		this.stationCounter = this.stationCounter + 1;

		/*
		for (i=0; i < uniqueStationIds.length; i=i+1) {
			CCUrl = CCUrlPart1 + uniqueStationIds[i] + CCUrlPart2;
			enyo.log('downloadCurrentConditions CCUrl is ' + CCUrl);
			this.$.dlNWS_cc.setUrl(CCUrl);
			this.$.dlNWS_cc.call();
		}
		*/
		if(this.stationCounter + 1 <= uniqueStationIds.length)
			{
			CCUrl = CCUrlPart1 + uniqueStationIds[this.stationCounter] + CCUrlPart2;
			enyo.log('downloadCurrentConditions CCUrl is ' + CCUrl);
			this.$.dlNWS_cc.setUrl(CCUrl);
			this.$.dlNWS_cc.call();
			}
		else
			{
			// We've gone through all the stations, so reset the counter for next time
			// that the alarm goes off.
			this.stationCounter = -1; 
			}

	},

	displayAlerts:	function() {
		enyo.log("displayAlerts starting...");

		// Query database for new alerts.

		// Display new alerts to user.
	},

   wbSetAlarmSuccess: function(inSender, inResponse) {
      enyo.log("wbLaunch: set alarm succes.  Results: " + enyo.json.stringify(inResponse));
   },
   
   wbSetAlarmFailure: function(inSender, inError, inRequest) {
      enyo.log("wbLaunch: set alarm failed.  Results: " + enyo.json.stringify(inError));
   },
   
	getPrefsSuccess: function(inSender, inResponse) {
      enyo.log("wbLaunch: preferences gotten successfully. Results = " + enyo.json.stringify(inResponse));
		// NWS organizes the web service for weather alerts by state.
      // extract the array of locations here...
      var locationsFromPrefs = inResponse.Locations;
      if (locationsFromPrefs === undefined || locationsFromPrefs === null)
         {
         this.alertLocations = [];
			enyo.log("wbLaunch error: preference locations were empty. Cannot continue.");
         }
      else
         {
         this.alertLocations = locationsFromPrefs;
         }
		// Create an array of unique states.  
		// The uniqueStates array should already exist at this point,
		// so we need to clean it out from last time through.
		this.uniqueStates.splice(0);

		var o = {};
		var i, cachedPrefsLength = this.alertLocations.length;
		for (i=0; i < cachedPrefsLength; i=i+1) {
			o[this.alertLocations[i].state] = this.alertLocations[i].state;
			}
      for (i in o) {
			if (o.hasOwnProperty(i)) {
				this.uniqueStates.push(o[i]);
			}
		}
		this.uniqueStatesCachedLength = this.uniqueStates.length;
		enyo.log("uniqueStates: " + enyo.json.stringify(this.uniqueStates));
		// After we have preferences, start downloading alerts for each state...
		this.downLoadAlerts();
	},
	
	getPrefsFailure: function(inSender, inResponse) {
      enyo.log("wbLaunch: preference get failure.  Results = " + enyo.json.stringify(inResponse));
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

	NWS_cc_Success: function (inSender, inResponse) {

		enyo.log("Current conditions: " + enyo.json.stringify(inResponse));
		// We successfully downloaded a observation-site-specific NWS current conditions XML file.
		// Save the current time to use as a timestamp for data we will
		// be loading into our database.
		var dlTime = new Date();
		var dl_timestamp = dlTime.getTime();
		enyo.log("NWS current conditions file downloaded successfully.");
		// enyo.log(enyo.json.stringify(inResponse));

      // Hack apart the returned string in Javascript, since I 
		// couldn't figure out how to use xpath on webOS. 
		// var ccLines = inResponse.split("</entry>");

		// var ccLinesCachedLength = ccLines.length;
		// var cachedPrefsLength = this.alertLocations.length;
		// var i;
		// Clean out the current conditions array.
		this.CC.splice(0);
	
		var oneCCLine = inResponse;
		// Lop off beginning of string up to "<entry>".  
		// This fixes a bug with first "<entry>" delimiter in array.
		// oneCCLine = oneCCLine.slice(oneCCLine.indexOf("<entry>"));
		//enyo.log(enyo.json.stringify(oneCCLine));
		var stationId = oneCCLine.slice(oneCCLine.indexOf("<station_id>")+12, oneCCLine.indexOf("</station_id>"));
		enyo.log('stationId: ' + stationId);
		var obsTstamp = oneCCLine.slice(oneCCLine.indexOf("<observation_time_rfc822>")+25, oneCCLine.indexOf("</observation_time_rfc822>"));
		enyo.log('obsTstamp: ' + obsTstamp);
		// if (alertTitle.indexOf('There are no active') < 0)
		var iconURLBase = oneCCLine.slice(oneCCLine.indexOf("<icon_url_base>")+15, oneCCLine.indexOf("</icon_url_base>"));
		var iconURLName = oneCCLine.slice(oneCCLine.indexOf("<icon_url_name>")+15, oneCCLine.indexOf("</icon_url_name>"));
		var iconURL = iconURLBase + iconURLName;
		enyo.log('iconURL: ' + iconURL);
		var tempF = oneCCLine.slice(oneCCLine.indexOf("<temp_f>")+8, oneCCLine.indexOf("</temp_f>"));
		enyo.log('tempF: ' + tempF);
		var tempC = oneCCLine.slice(oneCCLine.indexOf("<temp_c>")+8, oneCCLine.indexOf("</temp_c>"));
		enyo.log('tempC: ' + tempC);
		var weather = oneCCLine.slice(oneCCLine.indexOf("<weather>")+9, oneCCLine.indexOf("</weather>"));
		enyo.log('weather: ' + weather);
		var relativeHumidity =  oneCCLine.slice(oneCCLine.indexOf("<relative_humidity>")+19, oneCCLine.indexOf("</relative_humidity>"));
		enyo.log('relHum: ' + relativeHumidity);
		var windMph = oneCCLine.slice(oneCCLine.indexOf("<wind_mph>")+10, oneCCLine.indexOf("</wind_mph>"));
		var windDir = oneCCLine.slice(oneCCLine.indexOf("<wind_dir>")+10, oneCCLine.indexOf("</wind_dir>"));
		var windDeg = oneCCLine.slice(oneCCLine.indexOf("<wind_degrees>")+14, oneCCLine.indexOf("</wind_degrees>"));
		enyo.log('Wind: ' + windMph + 'mph/' + windDir + '/' + windDeg + 'deg');
		var pressMb = oneCCLine.slice(oneCCLine.indexOf("<pressure_mb>")+13, oneCCLine.indexOf("</pressure_mb>"));
		var pressInches = oneCCLine.slice(oneCCLine.indexOf("<pressure_in>")+13, oneCCLine.indexOf("</pressure_in>"));
		enyo.log('Pressure: ' + pressMb + 'mbar/' + pressInches + 'inches');
		var dewptF = oneCCLine.slice(oneCCLine.indexOf("<dewpoint_f>")+12, oneCCLine.indexOf("</dewpoint_f>"));
		var dewptC = oneCCLine.slice(oneCCLine.indexOf("<dewpoint_c>")+12, oneCCLine.indexOf("</dewpoint_c>"));
		enyo.log('DewPoint: ' + dewptF + 'F/' + dewptC + 'C');
		// heat index doesn't always appear in the file
		var heatIndexF = oneCCLine.slice(oneCCLine.indexOf("<heat_index_f>")+14, oneCCLine.indexOf("</heat_index_f>"));
		var heatIndexC = oneCCLine.slice(oneCCLine.indexOf("<heat_index_c>")+14, oneCCLine.indexOf("</heat_index_c>"));
		enyo.log('heatIndex: ' + heatIndexF + 'F/' + heatIndexC + 'C');
		var windChillF = oneCCLine.slice(oneCCLine.indexOf("<windchill_f>")+14, oneCCLine.indexOf("</windchill_f>"));
		var windChillC = oneCCLine.slice(oneCCLine.indexOf("<windchill_c>")+14, oneCCLine.indexOf("</windchill_c>"));
		enyo.log('Wind Chill: ' + windChillF + 'F/' + windChillC + 'C');
		var visibilityMi = oneCCLine.slice(oneCCLine.indexOf("<visibility_mi>")+15, oneCCLine.indexOf("</visibility_mi>"));
		enyo.log('Visibility: ' + visibilityMi + 'mi');

		this.CC.push({
			id: stationId,
			obs_tstamp: obsTstamp,
			dl_tstamp: dl_timestamp,
			icon_url: iconURL,
			temp_f: tempF,
			temp_c: tempC,
			weather_str: weather,
			relative_hum: relativeHumidity,
			wind_mph: windMph,
			wind_dir: windDir,
			wind_deg: windDeg,
			pressure_mb: pressMb,
			pressure_inches: pressInches,
			dewpt_f: dewptF,
			dewpt_c: dewptC,
			heat_index_f: heatIndexF,
			heat_index_c: heatIndexC,
			wind_chill_f: windChillF,
			wind_chill_c: windChillC,
			visibility_mi: visibilityMi
			});
		// Call storeCC to get data for this state into the database.
		if (this.CC.length > 0)
			{
			this.storeCC();
			}
		/*
		else
			{
			// There weren't any current conditions for this state, move on to the next.
			this.downLoadAlerts();
			}
		*/
	},

	NWS_cc_Failure: function(inSender, inResponse) {
		enyo.log("Failed to download current conditions file.");
	},

	storeCC: function() {
		enyo.log("storing current conditions in database...");

		// Cache the length of our CC array.
		this.ccCachedLength = this.CC.length;
		// enyo.log("CC array cached length: " + this.ccCachedLength);

		this.ccArrayIndex = 0;

		this.wbDB = openDatabase("ext:WeatherBulletinUSADB", "1", "", "25000000");
		// enyo.log("wbDB: " + enyo.json.stringify(this.wbDB));

		for(c=0; c < this.ccCachedLength; c = c + 1) {
			enyo.log("Processing cached current conditions " + (c+1) + " of " + this.ccCachedLength);
			this.CurrentConditionInsert(c);
			}
		// Move on to the next station.
		this.downloadCurrentConditions();
	},

	storeAlerts: function() {
		enyo.log("storing alerts in database...");

		// Cache the length of our alerts array.
		this.alertsCachedLength = this.alerts.length;
		// enyo.log("alerts array cached length: " + this.alertsCachedLength);

		this.CAPArrayIndex = 0;

		this.wbDB = openDatabase("ext:WeatherBulletinUSADB", "1", "", "25000000");
		// enyo.log("wbDB: " + enyo.json.stringify(this.wbDB));

		for(c=0; c < this.alertsCachedLength; c = c + 1) {
			enyo.log("Processing cached alerts " + (c+1) + " of " + this.alertsCachedLength);
			this.CAPAlertInsert(c);
		}
		this.downLoadAlerts();

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
				enyo.log('Storing zone data: ' + enyo.json.stringify(that.alerts[i].zones));
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
					} 
				);
		},

	CurrentConditionInsert: function(i) {
		enyo.log('CurrentConditionInsert called with parameter: ' + i);
		var that = this;
		// Insert current condition row into the observation table
		this.wbDB.transaction(
			function (transaction) {
				transaction.executeSql('INSERT INTO observation(stationId, ' +
																	'obs_tstamp, ' +
																	'dl_stamp, ' +
																	'icon_url, ' +
																	'temp_f, ' +
																	'temp_c, ' +
																	'weather, ' +
																	'relative_humidity, ' +
																	'wind_mph, ' +
																	'wind_dir, ' +
																	'wind_degrees, ' +
																	'pressure_mb, ' +
																	'pressure_inches, ' +
																	'dewpoint_f, ' +
																	'dewpoint_c, ' +
																	'heatindex_f, ' +
																	'heatindex_c, ' +
																	'windchill_f, ' +
																	'windchill_c, ' +
																	'visibility_miles' +
																	') ' +
									'VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);',
									[that.CC[i].id,
									that.CC[i].obs_tstamp, // observation tstamp
									that.CC[i].dl_tstamp, // download tstamp	
									that.CC[i].icon_url, // URL for graphic icon depicting current conditions
									that.CC[i].temp_f, // temperature in farenheit degrees
									that.CC[i].temp_c, // temperature in celsius degrees
									that.CC[i].weather_str, // description of current weather conditions
									that.CC[i].relative_hum, // relative humidity
									that.CC[i].wind_mph, // wind speed in miles per hour
									that.CC[i].wind_dir,	// wind direction as a string
									that.CC[i].wind_deg, // wind direction as a compass heading, in degrees
									that.CC[i].pressure_mb, // atmospheric pressure in millibars
									that.CC[i].pressure_inches, // atmospheric pressure in inches of mercury
									that.CC[i].dewpt_f, // dew point in degrees farenheit
									that.CC[i].dewpt_c, // dew point in degrees celsius
									that.CC[i].heat_index_f, // heat index in degrees farenheit
									that.CC[i].heat_index_c, // heat index in degrees celsius 
									that.CC[i].wind_chill_f, // wind chill in degrees farenheit
									that.CC[i].wind_chill_c, // wind chill in degrees celsius
									that.CC[i].visibility_mi // visibility in miles
									]);
					} 
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
		enyo.log("Entered notifyAndMark...");
		this.wbDB = openDatabase("ext:WeatherBulletinUSADB", "1", "", "25000000");

		var that = this;
		// Query the database for any weather alerts we have not notified the user about.
		this.wbDB.transaction(
			function(transaction) {
				transaction.executeSql('SELECT CAPAlert.*, alertUGC.ugc ' +
												' FROM CAPAlert, alertUGC ' +
												'WHERE notification_tstamp IS NULL ' +
												'  AND CAPAlert.alertId = alertUGC.alertId ' +
												'ORDER BY CAPAlert.alertId ASC, alertUGC.ugc ASC;',
					[],
					that.nMDataHandler.bind(that), that.handleSqlError
				);
				// Notifications are handled in the callback of the previous statement.
				// So here, we will just update those same records with a notification_tstamp/
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

	nMDataHandler: function(transaction, results) {
		// 05-JUN-2014 - George Mari
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
		// The above logic makes sense for weather alerts that apply to the 
		// home location of the user, but may not make sense for non-local locations
		// that are also being monitored.  We should implement the option on each 
		// location to make all alerts silent.
		// 
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

		enyo.log("nMDataHandler - entering...");
		for (i=0; i<results.rows.length; i=i+1) {
			enyo.log("nMDataHandler - results loop i=" + i);
			var row = results.rows.item(i);
			enyo.log("nMDataHandler - current_alertId: " + current_alertId + " row.alertId: " + row.alertId);
			if (current_alertId !== row.alertId && current_alertId !== '')
				{
				enyo.log("nMDataHandler - alert USC: " + current_alertTitle + "/" + current_urgency + "/" + current_severity + "/" + current_certainty);
				this.wbPushDashboard(current_alertTitle, current_zone_list);
				current_zone_list = row.ugc;
				}
			else
				{
				if (current_zone_list === '')
					{
					current_zone_list = row.ugc;
					}
				else
					{
					current_zone_list = current_zone_list + ', ' + row.ugc;
					}
				}
			current_alertId = row.alertId;
			current_alertTitle = row.title;
			current_urgency = row.urgency;
			current_severity = row.severity;
			current_certainty = row.certainty;
		}
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
		// enyo.windows.addBannerMessage("Weather Alert", "{}", null, null, "/media/internal/ringtones/Triangle (short).mp3", null);
		enyo.log("wbPushDashboard - zonelist: " + zoneList);
		enyo.windows.addBannerMessage("Weather Bulletin USA", "{zonelist: " + zoneList + "}", null, null, "audio/Industrial Alarm-SoundBible.com-1012301296.mp3", null);
		this.$.wbDashboard.push({icon:"images/sample-icon.png", title:"Weather Bulletin USA", text:inText});
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
