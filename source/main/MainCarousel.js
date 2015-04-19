enyo.kind({
	name: "MainCarouselView",
	kind: enyo.VFlexBox,
	components: [
		{name : "getPreferencesCall",
		kind : "PalmService",
      service : "palm://com.palm.systemservice/",
      method : "getPreferences",
      onSuccess : "getPrefsSuccess",
      onFailure : "getPrefsFailure",
      subscribe : false
		},
		{kind: "AppMenu", components: [
			{kind: "EditMenu"},
         {caption: "Initialize", onclick:"ShowInitView"},
         {caption: "Preferences", onclick: "ShowPrefsView"},
         {caption: "Help", onclick: "ShowHelpView"},
         {caption: "About", onclick: "ShowAboutView"}
         ]
		},
		{name: "MainPane", kind: "Pane", flex: 1, components: [
			{name: "PrefsView", kind: "ndfd", lazy: true, onBack: "backHandler"},
			{name: "InitView", kind: "InitializeView", lazy: true, onBack: "backHandler"},
			{name: "AboutView", kind: "abtView", lazy: true, onBack: "backHandler"},
			{name: "HelpView", kind: "hlpView", lazy: true, onBack: "backHandler"},
				{kind: "VFlexBox", components: [
				{name: "MainCarousel", kind: "Carousel", flex: 1, 
					onGetLeft: "getLeft",
					onGetRight: "getRight",
					onSnap: "snap",
					onSnapFinish: "snapFinish"
				}
			]}
		]}
	],

	create: function() {
		this.inherited(arguments);
		this.cityIndex = 0;

		// Don't setup the carousel until we've retrieved the preferences.
		enyo.log("MainCarouselView: retrieving preferences...");
		this.$.getPreferencesCall.call({"keys": ["InitDone", "Locations"]});
	},
	resizeHandler: function(inSender, e) {
		this.inherited(arguments);
		this.$.MainCarousel.resize();
	},
	getViewInfo: function(inIndex) {
		return {kind: "MainView", 
					headerContent: this.alertLocations[inIndex].city_name + ", " + this.alertLocations[inIndex].state,
					UgcCounty: this.alertLocations[inIndex].UgcCounty,
					UgcZone: this.alertLocations[inIndex].UgcZone
				};
		// NOTE: This seems like it would leak objects as the list of views 
		// gets recreated after returning from the preferences view.
		// But I haven't been able to figure out to track and free or destroy
		// the old views.  Hopefully it gets garbage collected.
	},
	getLeft: function(inSender, inSnap) {
		// inSnap is true if we are in the process snapping from one view
		// to another, false if not.
		if (inSnap)
			{
			this.cityIndex--;
			}
		enyo.log("getLeft: inSnap = " + inSnap + " this.cityIndex = " + this.cityIndex);
		// The beginning of our array corresponds to our left-most view,
		// so don't return a new view if we are at the left-most (beginning)
		// of our array.
		if (this.cityIndex >= 1)
			{
			return this.getViewInfo(this.cityIndex-1);
			}
		else
			{
			return null;
			}
	},
	getRight: function(inSender, inSnap) {
		if (inSnap)
			{
			this.cityIndex++;
			}
		enyo.log("getRight: inSnap = " + inSnap + " this.cityIndex = " + this.cityIndex);
		// End of our array corresponds to our right-most view,
		// so don't return a new view in this situation.
		if (this.cityIndex < this.alertLocations.length-1)
			{
			return this.getViewInfo(this.cityIndex+1);
			}
		else
			{
			return null;
			}
	},
	snap: function() {
		var v = this.$.MainCarousel.fetchCurrentView();
		enyo.log("snap function: " + v.kindName + ": " + (v.headerContent || v.content));
	},
	snapFinish: function() {
		var v = this.$.MainCarousel.fetchCurrentView();
		enyo.log("snapFinish function: " + v.kindName + ": " + (v.headerContent || v.content));
	},
   ShowPrefsView: function(inSender) {
		enyo.log("Selecting Prefs view from main view...");
		this.$.MainPane.selectViewByName("PrefsView");
	},
   ShowInitView: function(inSender) {
		enyo.log("Selecting Init view from main view...");
		this.$.MainPane.selectViewByName("InitView");
	},
   ShowHelpView: function(inSender) {
		enyo.log("Selecting Help view from main view...");
		this.$.MainPane.selectViewByName("HelpView");
	},
   ShowAboutView: function(inSender) {
		enyo.log("Selecting About view from main view...");
		this.$.MainPane.selectViewByName("AboutView");
	},
	backHandler: function(inSender, e) {
		enyo.log("MainPane backHandler.  Value from " + inSender + " view is: " + e);
		this.$.MainPane.back();
		// User may have added to or removed from list of cities we should get alerts for,
		// so reload the preferences.  Will also need to re-render the carousel somehow.
		enyo.log("MainCarouselView: returned to carousel.  Views: " + enyo.json.stringify(this.$.MainCarousel.views));
		this.cityIndex = 0;
		enyo.log("MainCarouselView: retrieving preferences...");
		this.$.getPreferencesCall.call({"keys": ["InitDone", "Locations"]});
	},
	getPrefsSuccess: function(inSender, inResponse) {
		var locationsFromPrefs = inResponse.Locations;
		enyo.log("MainCarouselView 0: preferences gotten successfully. Results = " + enyo.json.stringify(inResponse));
      // NWS organizes the web service for weather alerts by state.
		// extract the array of locations here...
		enyo.log("MainCarouselView 1");
		if (inResponse.InitDone === undefined || inResponse.InitDone === false)
			{
			// Initialization has not yet completed, so run the Initialization routine.
			enyo.log("MainCarouselView 2");
			this.alertLocations = []; 
			this.ShowInitView();
			}
		else if (locationsFromPrefs === undefined || locationsFromPrefs === null || locationsFromPrefs.length === 0)
			{
			// Initialization completed, but the user has not yet selected any cities, so show the prefs view
			// to force the user to pick at least one city.
			this.alertLocations = []; 
			enyo.log("MainCarouselView error 3: preference locations were empty. Switching to prefs view.");
			this.ShowPrefsView();
			}
		else
			{
			// We have completed initialization, and the user has selected at least one city,
			// so proceed with displaying the main view.
			this.alertLocations = locationsFromPrefs;
			enyo.log("MainCarouselView alertLocations: " + enyo.json.stringify(this.alertLocations));
			this.$.MainCarousel.setCenterView(this.getViewInfo(this.cityIndex));
			}
	},
	getPrefsFailure: function(inSender, inResponse) {
		enyo.log("MainCarouselView: preference get failure.  Results = " + enyo.json.stringify(inResponse));
	}
});
