enyo.kind({
	name: "wbScroller",
	kind: enyo.Scroller,
	vertical: false,
	components: [
		{kind: enyo.HFlexBox, name: "wbFlexBox", className: "wbFlexBox"}
	],

	destroyViews: function() {
		this.$.wbFlexBox.destroyComponents();
	},

	createView: function(view) {
		return this.$.wbFlexBox.createComponent(view);
	}
});
