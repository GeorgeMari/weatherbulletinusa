enyo.kind({
	name: "enyo.LocationAlertsView",
	kind: enyo.VFlexBox,
	events: {
		onBack: ""
	},
	components: [
		{name: "LocationPane", kind: "SlidingPane", flex: 1, multiView: false, multiViewMinWidth: -1, components: [
			{name: "AlertView", kind:"SlidingView", flex: 1, components: [
					{kind: "Header", content:"Weather Alerts"},
					{kind: "Scroller", flex: 1, components: [
						//Insert your components here
					]},
					{kind: "Toolbar", components: [
						{kind: "GrabButton", onclick: "clickDone"}
					]}
			]},
			{name: "ForecastView", kind:"SlidingView", components: [
					{kind: "Header", content:"Current Conditions"},
					{kind: "Scroller", flex: 1, components: [
						//Insert your components here
					]},
					{kind: "Toolbar", components: [
						{kind: "GrabButton"}
					]}
			]},
			{name: "RadarView", kind:"SlidingView", components: [
					{kind: "Header", content:"Forecast"},
					{kind: "Scroller", flex: 1, components: [
						//Insert your components here
					]},
					{kind: "Toolbar", components: [
						{kind: "GrabButton"}
					]}
			]}
		]}
	],
	create: function() {
		this.inherited(arguments);
	},
	
	clickDone: function() {
		this.doBack();
	}
});
