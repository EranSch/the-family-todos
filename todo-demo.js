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
	},
	setPrivate: function(taskId, set){
		var task = Tasks.findOne(taskId);
		if(task.owner !== Meteor.userId()){
			throw new Meteor.error('not-authorized');
		}
		Tasks.update(taskId, {$set:{private:set}});
	}
});

if (Meteor.isClient) {
	Meteor.subscribe('tasks');
	Meteor.subscribe("users");
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
		},
		isNightMode: function(){
			return Session.get('nightMode')
		}
	});
	Template.body.events({
		'change .hide-completed input': function (event) {
			Session.set('hideCompleted', event.target.checked);
		},
		'change .night-mode-switch input': function (event) {
			Session.set('nightMode', event.target.checked);
		},
		'change .user-color input': function(event){
			Meteor.call('setUserColor', event.target.value);
		}
	});
	Template.task.events({
		'click .delete': function(){
			Meteor.call('deleteTask', this._id);
		},
		'click .done-toggle input': function(){
			Meteor.call('setChecked', this._id, !this.checked);
		},
		'click .private-toggle input': function(event){
			Meteor.call('setPrivate', this._id, event.target.checked);
		}
	});
	Template.task.helpers({
		authorColor: function(){
			var task = this;
			var author = Meteor.users.findOne({_id:task.owner});
			if(author){
				return author.profile.userColor;
			}
		},
		isOwner: function(){
			return this.owner === Meteor.userId();
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
		passwordSignupFields: 'USERNAME_ONLY'
	});
}

if (Meteor.isServer) {
	Meteor.startup(function () {
		// code to run on server at startup
	});
	Meteor.publish('tasks', function () {
		return Tasks.find({
			$or: [
				{private: {$ne: true}},
				{owner: this.userId}
			]
		});
	});
	Meteor.publish('users', function () {
		return Meteor.users.find({},{
			fields: {'profile.userColor': 1}
		});
	});
	Accounts.onCreateUser(function(options, user) {
		user.profile = {
			userColor: '#00000'
		}
		return user;
	});
}