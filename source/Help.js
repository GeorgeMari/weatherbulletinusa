/*
|| 18-APR-2015 - George Mari
*/
enyo.kind({
	name: "hlpView",
	kind: enyo.VFlexBox,
	events: {
		onBack: ""
	},
	components: [
      {name: "HelpPane", kind: "Pane", flex: 1, transitionKind: "enyo.transitions.Fade", components: [
         {kind: "VFlexBox", pack: "center", components: [
				{kind: "PageHeader", components: [
					{kind: "VFlexBox", flex: 1, align: "center", components: [
						{content: "Help"}
			      ]}
				]},
				{kind: "VFlexBox", flex: 1, pack: "center", align: "center", components: [
					{name: "HelpText", kind: "Control", className: "enyo-item-secondary", 
					content: "Why are you looking for help here?  This is alpha software."}
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
