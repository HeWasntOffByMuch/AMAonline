	var mongoose = require('mongoose');

	mongoose.connect('mongodb://localhost:27017/ama#01');
	var db = mongoose.connection;
	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', function(callback) {
		console.log('connected to monogDB');
	});
	var Schema = mongoose.Schema;
	var ObjectId = require('mongodb').ObjectID;
	var playerSchema = new Schema({
	    name: String,
	    type: Number,
	    level: Number,
	    experience: Number,
	    healthCur: Number,
	    healthMax: Number,
	    manaCur: Number,
	    manaMax: Number,
	    lastLogin: Date,
	    creationDate: Date,
	    belongsTo: String,
	    timePlayed: Number,
	    deathHistory: Array,
	    x: Number,
	    y: Number,
	    speedBase: Number,
	    speedCur: Number,
	    equipment: {
	    	primary: Object,
	    	secondary: Object,
	    	body: Object,
				legs: Object,
				boots: Object,
				head: Object,
				backpack: Object,
				skill0: Object,
				skill1: Object,
				skill2: Object,
				skill3: Object

	    },
	    accuracyRating: Number,
        evasionRating: Number,
        parryRating: Number,
        blockRating: Number,
        skillTree: Object
	});
	var playerModel = mongoose.model('Player', playerSchema);

	var accountSchema = new Schema({
		username: String,
		password: String,
		email: String,
		emailValidated: Boolean,
		creationDate: Date,
		playerCount: Number,
		playerCountLimit: Number
	});
	var accountModel = mongoose.model('Account', accountSchema);


module.exports = {
	newObjectId: function() {
			return ObjectId();
	},
	getPlayerById: function(id, callback) {
		playerModel.findById(id, function(err, player) {
            if (err)
            	callback(err, player);
            else if(player)
            	callback(null, player);
            else{
            	console.log('player with id: ' + id + ' hasn\'t been found');
            	callback(null, null);
            }
        });
	},
	insertNewPlayer: function(data) { //puts a newly created player into the database.
		var p = new playerModel(data);
		p.save(function(err) {
			if (err) console.log(err);
			else console.log('player saved');
		});
	},
	getAccountById: function(id, callback) {
		accountModel.findById(id, function(err, account) {
            if (err)
            	callback(err, null);
            else
            	callback(null, account);
        });
	},
	getAccountByUsername: function(username, callback) {
		accountModel.findOne({
            username: username
        }, function(err, account) {
        	if(err){
        		callback(err, null);
        	}
        	else{
               	callback(null, account);
        	}
        });
	},
	insertNewAccount: function(acc) {
		var a = new accountModel(acc);
		a.save(function(err) {
			if (err) console.log(err);
			else console.log('account saved');
		});
	},
	updateAccount: function(conditions, update, options, callback) {
		accountModel.update(conditions, {$set: update}, options, function(err, num_affected) {
			callback(err, num_affected);
		});
	},
	updatePlayer: function(conditions, update, options, callback) {
		playerModel.update(conditions, {$set: update}, options, function(err, num_affected) {
			callback(err, num_affected);
		});
	},
    findAllAccounts: function(query) {
    	query = query || {};
        accountModel.find(query, function(err, res) {
            console.log(res);
        });
    },
    findAllPlayers: function(query, callback) {
    	query = query || {};
    	playerModel.find(query, function(err, res) {
    		callback(err, res);
    	});
    },
    accountCount: function(query) {
    	query = query || {};
    	accountModel.count(query, function(err, res) {
    		console.log(res);
    	});
    }
};
