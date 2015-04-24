/*
|| 27-NOV-2011 - George Mari
|| Copyright George Mari - all rights reserved.
*/
enyo.kind({
	name: "ndfd",
	kind: enyo.VFlexBox,
	events: {onBack: ""},
	components: [
		{name : "setPreferencesCall",
      kind : "PalmService",
      service : "palm://com.palm.systemservice/",
      method : "setPreferences",
      onSuccess : "setPrefsSuccess",
      onFailure : "setPrefsFailure",
      subscribe : false},

      {name : "getPreferencesCall",
      kind : "PalmService",
      service : "palm://com.palm.systemservice/",
      method : "getPreferences",
      onSuccess : "getPrefsSuccess",
      onFailure : "getPrefsFailure",
      subscribe : false}, 
      
      {name: "setAlarm",
      kind: "PalmService",
      service: "palm://com.palm.power/timeout/",
      method: "set",
      onSuccess: "setAlarmSuccess",
      onFailure: "setAlarmFailure",
      subscribe: true},

      {name: "clearAlarm",
      kind: "PalmService",
      service: "palm://com.palm.power/timeout/",
      method: "clear",
      onSuccess: "clearAlarmSuccess",
      onFailure: "clearAlarmFailure",
      subscribe: false},

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
		{kind: "AppMenu", components: [
			{kind: "EditMenu"},
			// {caption: "Initialize", onclick:"ShowInitView"},
			{caption: "Preferences", onclick: "clickDone"},
			{kind: "HelpMenu"},
			{caption: "About"}
			]
		},            
	{name: "PrefsPane", kind: "Pane", flex: 1, components: [
		{kind: "VFlexBox", components: [
     {name: "PrefScroller", kind: "FadeScroller", flex: 1, components: [
      {name: "EnableNotificationsGroup", kind: "RowGroup", caption: "Notifications", defaultKind: "HFlexBox", components: [
         {kind: "Item", align: "center", tapHighlight: false, layoutKind: "HFlexLayout", components: [
            {flex: 1, content: "Enable background operation"},
            {name: "NotificationToggleButton", kind: "ToggleButton", state: true, onChange: "NotificationToggle"}
         ]},
         {align: "center", layoutKind: "HFlexLayout", components: [
				{content: "Download data every", className: "enyo-label"},
            {name: "NotificationMinutes", kind: "ListSelector", flex: 1, contentPack: "end", onChange: "NotificationToggle",
					items: [
						{caption: "2 minutes", value: "02"},
						{caption: "15 minutes", value: 15},
						{caption: "20 minutes", value: 20},
						{caption: "30 minutes", value: 30},
						{caption: "40 minutes", value: 40},
						{caption: "45 minutes", value: 45}
					]}
         ]},
			{align: "center", layoutKind: "HFlexLayout", components: [
				{flex: 1, content: "Audio Alert"},
				{name: "NotificationSoundObject", kind: "Sound", src: ""},
				{name: "AudioPlayButton", kind: "Button", caption: "Play", onclick: "apbClick"},
            {name: "NotificationSoundList", kind: "ListSelector", flex: 1, contentPack: "end", onChange: "SoundChange",
					items: [
						{caption: "Alarm", value: "audio/Alarm Alert Effect-SoundBible.com-462520910.mp3"},
						{caption: "Industrial Alarm", value: "audio/Industrial Alarm-SoundBible.com-1012301296.mp3"},
						{caption: "Martian Scanner", value: "audio/Martian Scanner-SoundBible.com-1326707070.mp3"},
						{caption: "Weather Alert", value: "audio/Weather Alert-SoundBible.com-2072200951.mp3"},
						{caption: "Mute", value: ""}
				]}
			]}
       ]},
      {name: "AddLocationRowGroup", kind: "RowGroup", caption: "Add a Location", defaultKind: "HFlexBox", components: [
         {content: "Search for a location...", tapHighlight: true, onclick: "TypeLocation"}
         // {content: "Add current location via GPS...", tapHighlight: true, onclick: "GetGPSLocation"}
         ]},
      {name: "CurrentLocationsRowGroup", kind: "RowGroup", caption: "Current Locations", defaultKind: "HFlexBox", components: [
			{name: "AlertLocationsVR", kind: "VirtualRepeater", onSetupRow: "locSetupRow", className: "locations-rowgroup-item", components: [
            {name: "LocationItem", kind: "SwipeableItem", locationKind: "HFlexLayout", tapHighlight: true, 
             onConfirm: "deleteLocation", components: [
					{kind: "HFlexBox", align: "center", components: [
               	{name: "caption", flex: 1}
					]}
              ]}
            ]}
         ]},

		{name: "ndfdWebService", kind: "WebService",
         url: "http://alerts.weather.gov/cap/us.php?x=0",
			onSuccess: "gotndfd",
			onFailure: "gotndfdFailure"},
		{kind: "Scroller", flex: 1, components: [
			{name:"status"}]}
     ]},
		{name: "PrefsToolbar", kind: "Toolbar", components: [
			{kind: "GrabButton", onclick: "clickDone"},
			{caption: "Done", onclick: "clickDone"}
			]}
		]},
     {name: "TypeView", kind: "CityPickerView", lazy: true, onBack: "searchBackHandler"},

     {name: "InitView", kind: "InitializeView", lazy: true, onBack: "searchBackHandler"},
     {name: "LocationView", kind: "LocationAlertsView", lazy: true, onBack: "backHandler"}
     
    ]},

	{name: "testDashboard", kind: "Dashboard", onDashboardActivated: "tdbActivated"},

		{kind: enyo.ApplicationEvents, 
			onWindowActivated: "wakeup",
			onWindowDeactivated: "sleep",
			onWindowParamsChange: "windowParamsChangeHandler"
		}
	],
	create: function() {
		this.inherited(arguments);
		enyo.log("Creating preferences window...");
      // Get our stored preferences and set UI controls according to their saved values.
      this.$.getPreferencesCall.call({"keys": ["NotificationToggle", "NotificationMinutes", "Locations", "NotificationSoundFile"]});
      // Initialize our list of locations...
      this.alertLocations = [];
	},

	windowParamsChangeHandler: function() {
		enyo.log("enyo.windowParams: " + enyo.json.stringify(enyo.windowParams));
		/*
		if (enyo.windowParams.view === 'MainView') {
			enyo.log("Switching to MainView...");
			this.$.PrefsPane.selectViewByName("MainWBView");
		}
		*/

   },

	wakeup: function() {
		enyo.log("wakeup function called for PrefsWindow.");
	},

	btnClick: function() {
		this.$.dashboard.push({icon:"images/sample-icon.png", title:"Weather Alerts", text:this.$.dashboardText.getValue()});
		this.$.ndfdWebService.call();
	},
	clickDone: function() {
		enyo.log("Prefs View - executing clickDone...");
		this.doBack();
	},
	gotndfd: function(inSender, inResponse) {
		console.log("inSender: " + inSender);
		console.log("inResponse: " + inResponse);

		// Use responseText, not responseXML!! try: reponseJSON 
		var xmlstring = inResponse;//transport.responseText;	
		this.$.status.setContent(xmlstring);

		// Convert the string to an XML object
		var xmlobject = (new DOMParser()).parseFromString(xmlstring, "text/xml");
      console.log("xmlobject: ");
      // enyo.json.stringify(xmlobject);
		// Use xpath to parse xml object
      this.path = "/dwml/data/parameters/temperature[@type='maximum']/value";
		var nodes = document.evaluate(this.path, xmlobject, null, XPathResult.STRING_TYPE, null);
      console.log("nodes.resultType: " + nodes.resultType);
      console.log("nodes.stringValue: " + nodes.stringValue);
            
		var result = nodes.iterateNext();
      console.log("next nodes.resultType: " + result.resultType);
      console.log("result: " + result);
		var i = 0;
		while (result)
		{
			// TODO: add list or partial here
			console.log("******* parameters: " + result.attributes);
			// this.items[i] = result.attributes[0].nodeValue;
			i++;
			result=nodes.iterateNext();
		}

		this.$.postResponse.setContent(xmlstring);
		
		// this.$.list.refresh();
	},
	gotndfdFailure: function(inSender, inResponse) {
		console.log("Failed to retrieve NDFD data.");
	},
	listSetupRow: function(inSender, inRow) {
		var r = this.results[inRow];
		if (r) {
			this.$.title.setContent(r.title);
			return true;
		}
	},
   ContactLocation: function(inSender) {
      this.$.ContactPicker.pickPerson();
   },
   
   contactClick: function(inSender) {
      enyo.log("Contact click logged.");
   },
   
   contactCancelClick: function(inSender) {
      enyo.log("Contact Cancel click logged.");
   },
   
   TypeLocation: function(inSender) {
      enyo.log("Activating TypeView...");
      this.$.PrefsPane.selectViewByName("TypeView");
      // this.SearchWindow = enyo.windows.activate("search/index.html", "SearchWindow");
      enyo.log("TypeView activation call completed.");

	},
	 
	GetGPSLocation: function(inSender) {
      enyo.scrim.show();
      setTimeout(enyo.scrim.hide, 5000);
      this.$.LocationService.call();
	},

	ShowLocationView: function(inSender) {
		enyo.log("Tapping here used to show the MainView, but we're not doing that now.");
		// this.$.PrefsPane.selectViewByName("MainWBView");
		// this.$.PrefsPane.selectViewByName("LocationView");
	},
	 
	ShowInitView: function(inSender) {
		this.$.PrefsPane.selectViewByName("InitView");
	},
	 
   locSetupRow: function(inSender, inIndex) {
      var rowCaption;
      
      if (inIndex < this.alertLocations.length)
         {
         if (this.alertLocations[inIndex] !== null && this.alertLocations[inIndex] !== undefined)
            {
            // enyo.log("Setting up current locations row " + inIndex);
            // enyo.log("Array data is: " + enyo.json.stringify(this.alertLocations[inIndex]));
            rowCaption = this.alertLocations[inIndex].city_name + ", " + this.alertLocations[inIndex].state;
            this.$.caption.setContent(rowCaption);
				/*
				if (this.alertLocations[inIndex].audible == "N") {
					this.$.LocationAudibleAlertTB.setState(false);
					}
				else {
					this.$.LocationAudibleAlertTB.setState(true);
					}
				*/
            return true;
            }

         return true;
         }
   },
   
   deleteLocation: function(inSender, inIndex) {
      // Remove location item from list
      this.alertLocations.splice(inIndex, 1);

      // Save preferences
      this.$.setPreferencesCall.call({"Locations": this.alertLocations});

      // Refresh list
      this.$.AlertLocationsVR.render();

   },
   
	backHandler: function(inSender, e) {
		this.$.PrefsPane.back();
      enyo.log("Value from " + inSender + " view is: " + e);
	},
	
	searchBackHandler: function(inSender, e) {
		this.$.PrefsPane.back();
      enyo.log("Value from " + inSender + " view is: " + enyo.json.stringify(e));

      if (e !== null & e !== undefined)
         {
			// The city information we received back needs to have two pieces of
			// information added to it - the location of the nearest weather station
			// for current observations, and the location of the nearest radar station.
			// locationAddObsStation(e);	

         // add "return" value to our locations array.
         this.alertLocations.push(e);
			// Save the results to our preferences...
         this.$.setPreferencesCall.call({"Locations": this.alertLocations});
         }
      // Re-render the locations list.
      this.$.AlertLocationsVR.render();
	},
	
	GPSHandler: function(inSender, e) {
      enyo.log("Value from GPS Search kind is: " + e);
	},
	
	NotificationToggle: function(inSender, inState) {
		var NotificationState;
		var NotificationMinutes;
		var AlarmInString;

		NotificationState = this.$.NotificationToggleButton.getState();
		NotificationMinutes = this.$.NotificationMinutes.getValue();
      enyo.log("Notification toggle switched to: " + NotificationState + ":" + NotificationMinutes);

      // After getting the toggle button state, save it to preferences.
      this.$.setPreferencesCall.call({"NotificationToggle": NotificationState});
      this.$.setPreferencesCall.call({"NotificationMinutes": NotificationMinutes});
       
      // If notification toggle has been turned on, set a recurring alarm.
      if (NotificationState === true)
         {
			AlarmInString = "00:" + NotificationMinutes + ":00";
			enyo.log("AlarmInString is: " + AlarmInString);
         this.$.setAlarm.call(
            {key: "com.georgemari.weatherbulletinusa.check_alerts",
            "in": AlarmInString, 
            "wakeup": true,
            uri: "palm://com.palm.applicationManager/launch",
            params: '{"id": "com.georgemari.weatherbulletinusa", "params": {"action": "check_alerts"}}'
            });
         }
      // If notification toggle has been turned off, clear the existing recurring alarm.
      else
         {
         this.$.clearAlarm.call(
            {key: "com.georgemari.weatherbulletinusa.check_alerts"});
         }
	},

	AudibleTB: function(inSender, inState) {
		var checked_state;

		enyo.log("audibleTB: inSender is - " + inSender);
		if(this.$.LocationAudibleAlertTB.getState()) {
			checked_state = "checked";
			this.alertLocations[0].audible = "Y";
			}
		else {
			checked_state = "unchecked";
			this.alertLocations[0].audible = "N";
			}

		enyo.log("audible CB is: " + checked_state + " " + inSender);
      // Save preferences
      this.$.setPreferencesCall.call({"Locations": this.alertLocations});

	},

	apbClick: function(inSender, inEvent) {
		var sound_file;

		sound_file = "../" + this.$.NotificationSoundList.getValue();
		if (sound_file !== null && sound_file !== "") {
			enyo.log("apbClick: sound_file is " + sound_file);
			this.$.NotificationSoundObject.setSrc(sound_file);
			this.$.NotificationSoundObject.play();
			}
		/*
		enyo.log("Calling addBannerMessage...");
		enyo.windows.addBannerMessage("Weather Bulletin test", "{zonelist: zonelist}", null, null, null, null);
		enyo.log("Completed call to addBannerMessage...");
		this.$.testDashboard.push({icon:"../images/sample-icon.png", title: "Test", text: "test"});
		enyo.log("Completed call to dashboard.push...");
		*/
	},

   tdbActivated: function(dash) {
		var l;
		enyo.log("tdbActivated: entered...");
        for(l in dash)
        {
            var c = dash[l].dashboardContent;
            if(c)
            {
                c.$.topSwipeable.applyStyle("background-color", "black");
            }
        }
    },

	SoundChange: function(inSender, inState) {
		var sound_file;

		sound_file = this.$.NotificationSoundList.getValue();
		if (sound_file !== null && sound_file !== "") {
			enyo.log("SoundChange: sound_file is " + sound_file);
			// Save the results to our preferences...
         this.$.setPreferencesCall.call({"NotificationSoundFile": sound_file});
			}

	},

   setAlarmSuccess: function(inSender, inResponse) {
      enyo.log("Set alarm succes.  Results: " + enyo.json.stringify(inResponse));
   },
   
   setAlarmFailure: function(inSender, inError, inRequest) {
      enyo.log("Set alarm failed.  Results: " + enyo.json.stringify(inError));
   },
   
   clearAlarmSuccess: function(inSender, inResponse) {
      enyo.log("Clear alarm succes.  Results: " + enyo.json.stringify(inResponse));
   },
   
   clearAlarmFailure: function(inSender, inError, inRequest) {
      enyo.log("Clear alarm failed.  Results: " + enyo.json.stringify(inError));
   },

	setPrefsSuccess: function(inSender, inResponse) {
      enyo.log("Preferences saved successfully. Results = " + enyo.json.stringify(inResponse));
	},
	
	setPrefsFailure: function(inSender, inResponse) {
      enyo.log("Preference save failure.  Results = " + enyo.json.stringify(inResponse));
	},

	getPrefsSuccess: function(inSender, inResponse) {
      enyo.log("Preferences gotten successfully. Results = " + enyo.json.stringify(inResponse));
      this.$.NotificationToggleButton.setState(inResponse.NotificationToggle);
      this.$.NotificationMinutes.setValue(inResponse.NotificationMinutes);
		this.$.NotificationSoundList.setValue(inResponse.NotificationSoundFile);
      // extract the array of locations here...
      var locationsFromPrefs = inResponse.Locations;
      if (locationsFromPrefs === undefined || locationsFromPrefs === null)
         {
         // this.alertLocations = [{city_name: "Select a location you want to receive notifications of weather alerts for", state: "using one of the options above."}];
         this.alertLocations = [];
         }
      else
         {
         this.alertLocations = locationsFromPrefs;
         }
      // Now that we have the preference data, render the controls that depend on them...
      enyo.log("Now rendering VirtualRepeater for locations...");
      this.$.AlertLocationsVR.render();
      
	},
	
	getPrefsFailure: function(inSender, inResponse) {
      enyo.log("Preference get failure.  Results = " + enyo.json.stringify(inResponse));
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
		enyo.scrim.hide();
      // enyo.log("Reverse location search succeeded - inSender: " + enyo.json.stringify(inSender));
      enyo.log("Reverse location search succeeded - results: " + enyo.json.stringify(inResponse));

		this.locString = inResponse.city + ", " + inResponse.state;
      this.alertLocations.push({state: inResponse.state, city_name: inResponse.city, latitude: "", longitude: ""});
      // Re-render the alert locations list
      this.$.AlertLocationsVR.render();

		// Save the results to our preferences...
      this.$.setPreferencesCall.call({"Locations": this.alertLocations});
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
