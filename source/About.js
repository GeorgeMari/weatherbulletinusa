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
					{name: "AboutVersion", kind: "Control", flex: 1, className: "enyo-item-secondary", content: "Version: 0.2.0 alpha"},
					{name: "AboutTwitter", kind: "Control", flex: 1, className: "enyo-item-secondary", content: "Twitter: @wbuapp"},
					{name: "AboutWebSite", kind: "Control", flex: 1, className: "enyo-item-secondary", allowHtml: true, content: "Web: <a href=\"https://github.com/GeorgeMari/weatherbulletinusa\">https://github.com/GeorgeMari/weatherbulletinusa</a>"},
					{name: "AboutIssues", kind: "Control", flex: 1, className: "enyo-item-secondary", allowHtml: true, content: "Issue tracker: <a href=\"https://github.com/GeorgeMari/weatherbulletinusa/issues\">https://github.com/GeorgeMari/weatherbulletinusa/issues</a>"},
					{name: "AboutAttributes", kind: "Control", flex: 1, className: "enyo-item-secondary", allowHtml: true, content: "Data provided by: <a href=\"http://www.weather.gov\">http://www.weather.gov</a>"},
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
