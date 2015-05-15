/*
|| 18-APR-2015 - George Mari
*/
enyo.kind({
	name: "abtView",
	kind: enyo.VFlexBox,
	events: {
		onBack: ""
	},
	components: [
      {name: "AboutPane", kind: "Pane", flex: 1, transitionKind: "enyo.transitions.Fade", components: [
         {kind: "VFlexBox", pack: "center", components: [
				{kind: "PageHeader", components: [
					{kind: "VFlexBox", flex: 1, align: "center", components: [
						{content: "About Weather Bulletin USA"}
			      ]}
				]},
				{kind: "VFlexBox", flex: 1, pack: "center", align: "center", components: [
					{name: "AboutVersion", kind: "Control", flex: 1, className: "enyo-item-primary", content: "Version: 0.2.1 alpha"},
					{name: "AboutTwitter", kind: "Control", flex: 1, className: "enyo-item-secondary", content: "Twitter: @wbuapp"},
					{name: "AboutEmail", kind: "Control", flex: 1, className: "enyo-item-secondary", content: "E-mail: wbuapp@georgemari.com"},
					{name: "AboutWebSite", kind: "Control", flex: 1, className: "enyo-item-secondary", allowHtml: true, content: "Web: <a href=\"https://github.com/GeorgeMari/weatherbulletinusa\">github.com</a>"},
					{name: "AboutIssues", kind: "Control", flex: 1, className: "enyo-item-secondary", allowHtml: true, content: "Issue tracker: <a href=\"https://github.com/GeorgeMari/weatherbulletinusa/issues\">github.com</a>"},
					{name: "AboutAttributes", kind: "Control", flex: 1, className: "enyo-item-secondary", allowHtml: true, content: "Data provided by: <a href=\"http://alerts.weather.gov\">http://alerts.weather.gov</a>"},
					{name: "AboutAlarm", kind: "Control", flex: 1, className: "enyo-item-secondary", allowHtml: true, content: "Alarm: <a href=\"http://soundbible.com/339-Alarm-Alert-Effect.html\">soundbible.com</a>"},
					{name: "AboutIA", kind: "Control", flex: 1, className: "enyo-item-secondary", allowHtml: true, content: "Industrial Alarm: <a href=\"http://soundbible.com/287-Industrial-Alarm.html\">soundbible.com</a>"},
					{name: "AboutMS", kind: "Control", flex: 1, className: "enyo-item-secondary", allowHtml: true, content: "Martian Scanner: <a href=\"http://soundbible.com/878-Martian-Scanner.html\">soundbible.com</a>"},
					{name: "AboutWA", kind: "Control", flex: 1, className: "enyo-item-secondary", allowHtml: true, content: "Weather Alert: <a href=\"http://soundbible.com/1020-Weather-Alert.html\">soundbible.com</a>"},
					{name: "AboutIcons", kind: "Control", flex: 1, className: "enyo-item-secondary", allowHtml: true, content: "Icons: <a href=\"https://www.iconfinder.com/icons/171261/weather_icon#size=128\">Iconfinder.com</a>"},
					{name: "AboutLicense", kind: "Control", flex: 1, className: "enyo-item-secondary", allowHtml: true, content: "Licensed under: <a href=\"https://raw.githubusercontent.com/GeorgeMari/weatherbulletinusa/master/LICENSE\">MIT License</a>"}
				]},
            {kind: "Toolbar", components: [
               {name: "ToolbarGrabBtn", kind: "GrabButton", onclick: "clickDone"},
               {name: "ToolbarDoneBtn", caption: "Done", onclick: "clickDone"}
            ]}
         ]}
      ]}
   ],

	create: function() {
		this.inherited(arguments);

	},

	clickDone: function() {
      // Return
		this.doBack();
	}

});
