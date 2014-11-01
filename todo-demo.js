var Tasks = new Mongo.Collection('tasks');

Meteor.methods({
	addTask: function(text){
		if(!Meteor.userId()){
			throw new Meteor.error('not-authorized');
		}
		Tasks.insert({
			text: text,
			createdAt: new Date(),
			owner: Meteor.userId(),
			username: Meteor.user().username
		});
	},
	deleteTask: function(taskId){
		Tasks.remove(taskId);
	},
	setChecked: function(taskId, value){
		Tasks.update(taskId, {$set:{checked:value}});
	},
	setUserColor: function(color){
		if(!Meteor.userId()){
			throw new Meteor.error('not-authorized');
		}
		Meteor.users.update(
			Meteor.userId(),
			{$set:{'profile.userColor': color}}
		);
	}
});

if (Meteor.isClient) {
	Meteor.subscribe('allUsers');
	Template.body.helpers({
		tasks: function(){
			var hide = Session.get('hideCompleted');
			var query = hide ? {checked: {$ne: true}} : {}
			return Tasks.find(
				query,
				{sort: {createdAt: -1}}
			);
		},
		incompleteCount: function(){
			return Tasks.find({checked: {$ne: true}}).count();
		},
		userColor: function(){
			return Meteor.user().profile.userColor;
		}
	});
	Template.body.events({
		'change .hide-completed input': function (event) {
			Session.set('hideCompleted', event.target.checked);
		},
		'change .user-color': function(event){
			Meteor.call('setUserColor', event.target.value);
		}
	});
	Template.task.events({
		'click .delete': function(){
			Meteor.call('deleteTask', this._id);
		},
		'click .toggle-checked': function(){
			Meteor.call('setChecked', this._id, !this.checked);
		}
	});
	Template.task.helpers({
		authorColor: function (){
			var author = Meteor.users.findOne({_id:this.owner});
			if(author){
				return author.profile.userColor;
			}
		}
	});
	Template.inputForm.events({
		'submit .new-task': function(event){
			var text = event.target.text.value;
			Meteor.call('addTask', text);
			event.target.text.value = '';
			return false;
		}
	});
	Accounts.ui.config({
		requestPermissions: {
			// facebook: ['user_likes']
		},
		requestOfflineToken: {
			// google: true
		},
		passwordSignupFields: 'USERNAME_ONLY'
	});
}

if (Meteor.isServer) {
	Meteor.startup(function () {
		// code to run on server at startup
	});
	Accounts.onCreateUser(function(options, user) {
		console.log(options, user);
		user.profile = {
			userColor: '#00000'
		}
		return user;
	});
	Meteor.publish("allUsers", function () {
		return Meteor.users.find({});
	});
}
