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

		{name: "dlNWSAlerts", 
			kind: "wbu_alerts_dl"},

		{name: "dlNWSCC",
			kind: "wbu_cc_dl"}

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
		this.NotificationSoundFile = "";

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
		// Download alerts.  Sequence of events through various callbacks will be:
		// 1. Re-load app preferences to determine which states need downloading.
		// 2. Download alerts for locations we are monitoring based on preferences 
		//    and type of connection. (WiFi = un-metered, Cellular = metered.)
		// 3. Populate results into the database.
		// 4. Read the database for any new alerts that we need to alert the user to.
		// 5. If we have new alerts, push a webOS alert to the dashboard.
		// 6. Mark the alert in the database as having been shown to the user.
		enyo.log("uniqueStates before getPrefsCall: " + enyo.json.stringify(this.uniqueStates));
		this.$.getPreferencesCall.call({"keys": ["NotificationToggle", "NotificationMinutes", "Locations", "NotificationSoundFile"]});

		// Call a function that looks in our database to see if we have any new alerts
		// that we need to alert the user to.  Display alert info on dashboard, if so,
		// then mark the alert as having been displayed to the user.

		return true;
	},

   wbSetAlarmSuccess: function(inSender, inResponse) {
      enyo.log("wbLaunch: set alarm succes.  Results: " + enyo.json.stringify(inResponse));
   },
   
   wbSetAlarmFailure: function(inSender, inError, inRequest) {
      enyo.log("wbLaunch: set alarm failed.  Results: " + enyo.json.stringify(inError));
   },
   
	getPrefsSuccess: function(inSender, inResponse) {
      enyo.log("wbLaunch: preferences gotten successfully. Results = " + enyo.json.stringify(inResponse));
		// Re-set the alarm to check again, in the future.
      this.$.wbSetAlarm.call(
         {key: "com.georgemari.weatherbulletinusa.check_alerts",
         "in": "00:" + inResponse.NotificationMinutes + ":00",
         "wakeup": true,
         uri: "palm://com.palm.applicationManager/launch",
         params: '{"id": "com.georgemari.weatherbulletinusa", "params": {"action": "check_alerts"}}'
         });
		enyo.log("wbLaunch: alarm re-set for " + inResponse.NotificationMinutes);
		// NWS organizes the web service for weather alerts by state.
      // extract the array of locations here...
      var locationsFromPrefs = inResponse.Locations;
      if (locationsFromPrefs === undefined || locationsFromPrefs === null) {
         this.alertLocations = [];
			enyo.log("wbLaunch error: preference locations were empty. Cannot continue.");
         }
      else {
         this.alertLocations = locationsFromPrefs;
         }

		this.NotificationSoundFile = inResponse.NotificationSoundFile;
	
		/*
		if (this.NotificationSoundFile === "" || this.NotificationSoundFile === undefined || this.NotificationSoundFile === null) {
			this.NotificationSoundFile = inResponse.NotificationSoundFile;
			}
		*/
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
		// After we have preferences, start downloading data for everything.
		this.dl_and_process_everything();
	},

	getPrefsFailure: function(inSender, inResponse) {
      enyo.log("wbLaunch: preference get failure.  Results = " + enyo.json.stringify(inResponse));
	},

	dl_and_process_everything: function() {

		this.$.dlNWSAlerts.downLoadAlerts(this.alertLocations, this.uniqueStates, this.NotificationSoundFile);
		// this.$.dlNWSCC.downloadCurrentConditions(this.alertLocations);
		// download and process forecast data
		// download and process radar images

	}
	
});
