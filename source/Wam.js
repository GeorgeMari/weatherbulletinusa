/* Copyright 2009-2011 Hewlett-Packard Development Company, L.P. All rights reserved. */
enyo.kind({
    name: "Wam",
    kind: enyo.VFlexBox,
    components: [
	{
		name: "nws_zones",
		kind: "WebService",
		url: "data/zones.txt",
		onSuccess: "zoneLoadSuccess",
		onFailure: "zoneLoadFailure"
	},
	
	{
		name: "nws_alerts",
		kind: "WebService",
		url: "http://alerts.weather.gov/cap/us.php?x=0",
		onSuccess: "alertsLoadSuccess",
		onFailure: "alertsLoadFailure"
	},
	{
		name: "location",
        kind: "enyo.PalmService",
        service: "palm://com.palm.location/",
        method: "getCurrentPosition",
        onSuccess: "locationSuccess",
		onFailure: "locationFailure"
    },
	{name: "getData", kind: "WebService", onSuccess: "gotData", onFailure: "gotDataFailure"},
	{
		name: "myMap",
		kind: "Map",
		flex: 1,
		credentials: "AnXO4lPr9nb5kdoYXdJcDEI1VlnGjvMvHJqhY1P-xSk2i9c3kHgaFAd_-Hez9kVL"
	},
	{ name: "locateme", flex: 0,kind: "Button", caption:"Update weather alerts", onclick: "updateAlerts"}
	],

	create: function()) {

		enyo.log("Create function called...");
		this.inherited(arguments);

		this.zones = [];
		this.alerts = [];

		// Call the webservice to load our static data.
		this.$.nws_zones.call();


		enyo.log("Exiting create function...");

	},

	alertsLoadSuccess: function(inSender, inResponse) {
		enyo.log("Weather Alerts data loaded successfully.");
		enyo.log(enyo.json.stringify(inResponse));

		// Hack apart the returned string in Javascript, since I 
		// didn't have time to learn xpath. :-(
		var alertLines = inResponse.split("</entry>");
		var alertLinesCachedLength = alertLines.length;
		var i;
		for (i=0; i < alertLinesCachedLength; i=i+1) {
			var oneAlertLine = alertLines[i];
			//enyo.log(enyo.json.stringify(alertLines[i]));
			var alertTitle = oneAlertLine.slice(oneAlertLine.indexOf("<title>")+7, oneAlertLine.indexOf("</title>"));
			// enyo.log(alertTitle);
			var alertLink =  oneAlertLine.slice(oneAlertLine.indexOf("<link")+5);
			alertLink = alertLink.slice(0, alertLink.indexOf("/>"));
			// enyo.log(alertLink);
			var alertAreaDesc = oneAlertLine.slice(oneAlertLine.indexOf("<cap:areaDesc>")+14);
			alertAreaDesc = alertAreaDesc.slice(0, alertAreaDesc.indexOf("</cap:areaDesc>"));
			//enyo.log(alertAreaDesc);
			var alertZones = oneAlertLine.slice(oneAlertLine.indexOf("<cap:geocode>")+13);
			alertZones = alertZones.slice(alertZones.indexOf("<valueName>UGC</valueName>")+26);
			alertZones = alertZones.slice(alertZones.indexOf("<value>")+7);
			alertZones = alertZones.slice(0, alertZones.indexOf("</value>"));
			alertZones = alertZones.split(" ");
		   enyo.log(enyo.json.stringify(alertZones));
			
			/*
			var alertTitle = ;
			var alertEvent = ;
			var alertLink = ;
			var alertAreaDesc = ;
			var alertZones = ;
			*/
			this.alerts[i] = {title: alertTitle,
									link: alertLink,
									areaDesc: alertAreaDesc,
									zones: alertZones
								};
		}
		// Now map the alerts
	   this.mapAlerts(this.alerts);	
	},

	mapAlerts: function(inAlerts) {

		enyo.log(enyo.json.stringify(inAlerts));
	 	var cachedZoneLength = this.zones.length;
		enyo.log("Zones in mapAlerts: " + enyo.json.stringify(this.zones));
		var i = 0;
		var x = 0;
		var inOptions = null;
		var locations = [];
	for (i = 0; i< inAlerts.length; i++) {
		 	// Find lat and lon of this alert

			for (x = 0; x < cachedZoneLength; x++) {
				if (this.zones[x].state+"Z"+this.zones[x].zoneNumber == inAlerts[i].zones[0])
					{
					var lat = this.zones[x].lat;
					var lon = this.zones[x].lon;
					enyo.log(enyo.json.stringify(this.zones[x]));
					// enyo.log(this.zones[x].zoneNumber, inAlerts[i].zones[0], this.zones[x].lat, this.zones[x].lon);
					var location = new Microsoft.Maps.Location(lat, lon);
					locations.push(location)
					var pushpin = new Microsoft.Maps.Pushpin(location, inOptions);
					var infobox = new Microsoft.Maps.Infobox(location, {title: inAlerts[i].title, description: inAlerts[i].areaDesc, visible: false, offset:new Microsoft.Maps.Point(0,35)});
		
					infobox.dataIndex = i;
					pushpin.infobox = infobox;
					this.$.myMap.map.entities.push(infobox);	
					this.$.myMap.map.entities.push(pushpin);
					Microsoft.Maps.Events.addHandler(pushpin, 'click', enyo.bind(this, "doPinOnclick"));
					Microsoft.Maps.Events.addHandler(infobox, 'click', enyo.bind(this, "doInfoboxOnclick"));

					break;
					}
			} 
			/*
			
			*/
		}
		// var bestview = Microsoft.Maps.LocationRect.fromLocations(locations);
		// this.$.myMap.map.setView({bounds:bestview });

	},

	

	alertsLoadFailure: function(inSender, inResponse) {
		enyo.log("Error loading weather alerts data. " + enyo.json.stringify(inResponse));

	},

	zoneLoadSuccess: function(inSender, inResponse) {
		enyo.log("Zone data loaded successfully!");
		var zoneLines = inResponse.split("\r\n");
		// For some reason we end up with empty element at end of array - get rid of it.
		zoneLines.pop();

		enyo.log(enyo.json.stringify(zoneLines));
		var i;
		var zoneLinesCachedLength = zoneLines.length;
		for (i=0; i < zoneLinesCachedLength; i=i+1) {
			// Create an object for each array element.
			// Data format is documented at http://www.nws.noaa.gov/geodata/catalog/wsom/html/cntyzone.htm
			var oneZoneLine = zoneLines[i].split("|");
			this.zones[i] = {state: oneZoneLine[0],
								  zoneNumber: oneZoneLine[1],
								  zoneName: oneZoneLine[3],
								  lat: oneZoneLine[9],
								  lon: oneZoneLine[10]
								 };
			}
		enyo.log("Zones: " + enyo.json.stringify(this.zones));
	},

	zoneLoadFailure: function(inSender, inRespnose) {
		enyo.log("Error loading zone data. " + enyo.json.stringify(inResponse));

	},

	updateAlerts: function() {
		this.$.nws_alerts.call();
	},
	locationFailure: function(inSender, inResponse){
		console.log("locationFailure");
	},
	locationSuccess: function(inSender, inResponse){
		console.log("locationSuccess");
        if (inResponse && inResponse.latitude) {
			console.log("got location: "+inResponse.latitude+" "+inResponse.longitude);
			var bingMap = this.$.myMap.hasMap();
			var centre = new Microsoft.Maps.Location(inResponse.latitude, inResponse.longitude);
            bingMap.setView({
                center: centre,
                zoom: 9
            });
			
			var inOptions = null;
			var pushpin = new Microsoft.Maps.Pushpin(centre, inOptions);
			this.$.myMap.map.entities.push(pushpin);
			
			var url = "http://api.geonames.org/findNearbyWikipediaJSON?lat="+inResponse.latitude+"&lng="+inResponse.longitude+"&radius=5&username=gntomcat";
			console.log("url="+url);
			this.$.getData.setUrl(url);
			this.$.getData.call();
        }
    },
	gotData: function(inSender, inResponse) {
		console.log("gotData");
		console.log("result:"+enyo.json.stringify(inResponse));
		var results = inResponse.geonames;
		
		var inOptions = null;
		var locations = [];
		
		//this.$.myMap.clearAll();
		
		for (var i = 0; i< results.length; i++) {
			console.log("data:"+results[i].title+" "+results[i].lat+" "+results[i].lng);
		  
			var location = new Microsoft.Maps.Location(results[i].lat, results[i].lng);
			locations.push(location)
			var pushpin = new Microsoft.Maps.Pushpin(location, inOptions);
			
			var infobox = new Microsoft.Maps.Infobox(location, {title: results[i].title,description: results[i].summary, visible:false, offset:new Microsoft.Maps.Point(0,35)});
		
			infobox.dataIndex = i;
			pushpin.infobox = infobox;
			this.$.myMap.map.entities.push(infobox);	
			this.$.myMap.map.entities.push(pushpin);
			Microsoft.Maps.Events.addHandler(pushpin, 'click', enyo.bind(this, "doPinOnclick"));
			Microsoft.Maps.Events.addHandler(infobox, 'click', enyo.bind(this, "doInfoboxOnclick"));
		}
		var bestview = Microsoft.Maps.LocationRect.fromLocations(locations);
		this.$.myMap.map.setView({bounds:bestview });
	},
	gotDataFailure: function(inSender, inResponse) {
		console.log("gotDataFailure");
	},
	doPinOnclick: function(inSender) {
	var pin = inSender.target;
	if (pin)
	{
		var infobox = pin.infobox;
		if (infobox)
		{
			/*if (this.getVisibleInfobox() != "")
			{
				this.getVisibleInfobox().setOptions({visible:false});
			}*/
  			//this.setVisibleInfobox(infobox);
  			infobox.setOptions({visible:true});
		}
	}
  },
  doInfoboxOnclick: function(inSender) {
  console.log("dataIndex:"+inSender.target.dataIndex);
  
  var pin = inSender.target;
	if (pin)
	{
		var infobox = pin.infobox;
		if (infobox)
		{
	
		infobox.setOptions({ visible: false });
		}
		//this.setSelectedItemIndex(insSender.target.dataIndex);
    	//this.doSelectItem(this);
	}
  }
});
