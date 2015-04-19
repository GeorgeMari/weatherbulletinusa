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
					{name: "AboutVersion", kind: "Control", flex: 1, className: "enyo-item-secondary", pack: "center", align: "center",
					content: "Version: 0.2.0 alpha"},
					{name: "AboutWebSite", kind: "Control", flex: 1, className: "enyo-item-secondary", pack: "center", align: "center",
					content: "Web: http://sitenamegoeshere.com"},
					{name: "AboutLicense", kind: "Control", flex: 1, className: "enyo-item-secondary", pack: "center", align: "center",
					content: "License: License text goes here"}
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
