enyo.kind({
	name: "MainView", kind: enyo.VFlexBox, 
	published: {
		headerContent: "",
		UgcCounty: "",
		UgcZone: ""
	},
	components: [
		{kind: "Pane", flex: 1, components: [
			{kind: "VFlexBox", components: [
				{name: "City", kind: "PageHeader", content: "Selected City"},
					{kind: "Scroller", flex: 1, components: [
						{kind: "DividerDrawer", caption: "ALERTS", components: [
							{kind: "VirtualRepeater", name: "alertsVR", onSetupRow: "setupAlert", components: [
								{kind: "Item", name: "alertItem", components: [
									{name: "alertEvent"},
									{name: "alertTitle", className: "enyo-item-secondary"},
									{name: "alertSummary", className: "enyo-item-ternary"},
									{name: "alertURL", className: "enyo-item-ternary"}
								]}
							]}
						]},
						// This drawer will show the current conditions on the leftmost side,
						// while the hour-by-hour forecast stretches out to the right,
						// switching to a long-range day-by-day forecast.
						{kind: "DividerDrawer", caption: "CURRENT CONDITIONS & FORECAST", components: [
							{kind: "wbScroller", name: "ccf_scroller", flex: 1, height: "70px"} 
						]},
						{kind: "DividerDrawer", caption: "RADAR", components: [
							{name: "Radar", flex: 1, content: "Radar"}
						]},
						// History drawer will allow the user to scroll back and forth
						// in a timeline, displaying past observations by the day, and/or hour.
						{kind: "DividerDrawer", caption: "HISTORY", components: [
							{name: "History", flex: 1, content: "History"}
						]}
					]}
			]}
		]},
		{kind: enyo.ApplicationEvents,
			onWindowActivated: "wakeup",
			onWindowDeactivated: "sleep",
			onWindowParamsChange: "windowParamsChangeHandler"
		}

	],
	create: function() {
		this.inherited(arguments);
		this.headerContentChanged();
		this.alertData = [];
		var currentTime = new Date();
		var current_timestamp = currentTime.getTime();
		this.getAlertData(this.UgcZone, this.UgcCounty, current_timestamp);

		enyo.log("ccf_scroller destroying views...");
		this.$.ccf_scroller.destroyViews();
		enyo.log("ccf_scroller creating view...");
		this.$.ccf_scroller.createView({
			components: [
				{content: "Scroller item 1"},
				{kind: enyo.HFlexBox, components: [
					{kind: "Image", src: "../images/sample-icon.png", height: "48px", onclick: "scrollerClick"}
				]}
			]
		});
		this.$.ccf_scroller.createView({
			components: [
				{content: "Scroller item 2"},
				{kind: enyo.HFlexBox, components: [
					{kind: "Image", src: "../images/sample-icon.png", height: "48px"}
				]}
			]
		});
		this.$.ccf_scroller.createView({
			components: [
				{content: "Scroller item 3"},
				{kind: enyo.HFlexBox, components: [
					{kind: "Image", src: "../images/sample-icon.png", height: "48px"}
				]}
			]
		});
		this.$.ccf_scroller.createView({
			components: [
				{content: "Scroller item"},
				{kind: enyo.HFlexBox, components: [
					{kind: "Image", src: "../images/sample-icon.png", height: "48px"}
				]}
			]
		});
		this.$.ccf_scroller.createView({
			components: [
				{content: "Scroller item"},
				{kind: enyo.HFlexBox, components: [
					{kind: "Image", src: "../images/sample-icon.png", height: "48px"}
				]}
			]
		});
		this.$.ccf_scroller.createView({
			components: [
				{content: "Scroller item"},
				{kind: enyo.HFlexBox, components: [
					{kind: "Image", src: "../images/sample-icon.png", height: "48px"}
				]}
			]
		});
		this.$.ccf_scroller.createView({
			components: [
				{content: "Scroller item"},
				{kind: enyo.HFlexBox, components: [
					{kind: "Image", src: "../images/sample-icon.png", height: "48px"}
				]}
			]
		});
		this.$.ccf_scroller.createView({
			components: [
				{content: "Scroller item"},
				{kind: enyo.HFlexBox, components: [
					{kind: "Image", src: "../images/sample-icon.png", height: "48px"}
				]}
			]
		});
		this.$.ccf_scroller.createView({
			components: [
				{content: "Scroller item"},
				{kind: enyo.HFlexBox, components: [
					{kind: "Image", src: "../images/sample-icon.png", height: "48px"}
				]}
			]
		});
		this.$.ccf_scroller.createView({
			components: [
				{content: "Scroller item"},
				{kind: enyo.HFlexBox, components: [
					{kind: "Image", src: "../images/sample-icon.png", height: "48px"}
				]}
			]
		});
		this.$.ccf_scroller.createView({
			components: [
				{content: "Scroller item"},
				{kind: enyo.HFlexBox, components: [
					{kind: "Image", src: "../images/sample-icon.png", height: "48px"}
				]}
			]
		});
		this.$.ccf_scroller.createView({
			components: [
				{content: "Scroller item"},
				{kind: enyo.HFlexBox, components: [
					{kind: "Image", src: "../images/sample-icon.png", height: "48px"}
				]}
			]
		});
	
		enyo.log("MainView create function executed.  UgcCounty: " + this.UgcCounty + "; UgcZone: " + this.UgcZone);
	},

	getAlertData: function(inUgcZone, inUgcCounty, inTstamp) {
		// open application database to retrieve data we want to display
		this.wbDB = openDatabase("ext:WeatherBulletinUSADB", "1", "", "25000000");
		var that = this;
		enyo.log('getAlertData - reading alerts from database for ' + this.UgcZone + ' or ' + 
						this.UgcCounty + ' timestamp: ' + inTstamp);
		this.wbDB.transaction(
			function(transaction) {
				transaction.executeSql('SELECT DISTINCT CAPAlert.alertId, CAPAlert.updated_tstamp, CAPAlert.published_tstamp, ' +
														'CAPAlert.title, CAPAlert.url, CAPAlert.summary, CAPAlert.event, ' +
														'CAPAlert.effective_tstamp, CAPAlert.expiration_tstamp, ' +
														'CAPAlert.download_tstamp, CAPAlert.status, CAPAlert.msgType, ' +
														'CAPAlert.category, CAPAlert.urgency, CAPAlert.severity, ' +
														'CAPAlert.certainty, CAPAlert.areaDesc, ' +
														'alertUGC.ugc ' +
												 'FROM CAPAlert, alertUGC ' +
				                        'WHERE CAPAlert.alertId = alertUGC.alertId ' +
												  'AND (alertUGC.ugc = ? OR alertUGC.ugc = ?) ' +
												  'AND CAPAlert.effective_tstamp <= ? ' +
												  'AND CAPAlert.expiration_tstamp >= ? ' + 
											'ORDER BY CAPAlert.published_tstamp ASC;',
				[that.UgcZone, that.UgcCounty, inTstamp, inTstamp],
				that.mVDataHandler.bind(that), that.handleSqlError);
			}
		);

	},

	headerContentChanged: function() {
		this.$.City.setContent(this.headerContent);
	},

	clickDone: function() { 
		enyo.log("MainView - executing clickDone...");
		this.doBack();
	},

	backHandler: function(inSender, e) {
		enyo.log("MainPane backHandler.  Value from " + inSender + " view is: " + e);
		this.$.MainPane.back();
   },

	setupAlert: function(inSender, inIndex) {
		enyo.log("Setting up alert item: " + inIndex);
		enyo.log(enyo.json.stringify(this.alertData));
		if (inIndex < this.alertData.length) {
			this.$.alertEvent.setContent(this.alertData[inIndex].event);
			this.$.alertTitle.setContent(this.alertData[inIndex].title);
			this.$.alertSummary.setContent(this.alertData[inIndex].summary);
			this.$.alertURL.setContent(this.alertData[inIndex].url);
			return true;
			}
	},

	ShowPrefsView: function(inSender) {
		enyo.log("Selecting Prefs view from main view...");
		this.$.MainPane.selectViewByName("PrefsView");
	},

	ShowInitView: function(inSender) {
		enyo.log("Selecting Init view from main view...");
		this.$.MainPane.selectViewByName("InitView");
	},

	wakeup: function() {
		enyo.log("wakeup function called for MainWindow from MainView.");
	},

	windowParamsChangeHandler: function() {
		enyo.log("enyo.windowParams: " + enyo.json.stringify(enyo.windowParams));
		if (enyo.windowParams.view === 'MainView') {
			enyo.log("Switching to MainView...");
			this.$.MainPane.selectViewByName("MainWBView");
		}
	},
	mVDataHandler: function(transaction, results) {
		enyo.log("MainView - retrieving SQL query results...");
		for (i=0; i<results.rows.length; i=i+1) {
			var row = results.rows.item(i);
			this.alertData.push(row);
			enyo.log("Saving alert data for: " + row.title);
			// this.$.AlertContent.setContent(row.title);
		}   
		this.$.alertsVR.render();
	},
	handleSqlError: function(transaction, error) {
		enyo.log("MainView - SQL statement error: [" + error.code + "]" + error.message);
	},

	scrollerClick: function(inSender, inEvent) {
		enyo.log("function scrollerClick called...");
	}
});

