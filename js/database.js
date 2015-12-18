	var mongoose = require('mongoose')

	mongoose.connect('mongodb://localhost/');
	var db = mongoose.connection;
	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', function(callback) {
		console.log('connected to monogDB')
	});
	var Schema = mongoose.Schema;
	var ObjectId = require('mongodb').ObjectID;
	var playerSchema = new Schema({
	    name: String,
	    type: Number,
	    level: Number,
	    lastLogin: Date,
	    creationDate: Date,
	    belongsTo: String,
	    timePlayed: Number,
	    x: Number,
	    y: Number,
	    speedBase: Number,
	    speedCur: Number
	})
	var playerModel = mongoose.model('Player', playerSchema);

	var accountSchema = new Schema({
		username: String,
		password: String,
		email: String,
		emailValidated: Boolean,
		creationDate: Date
	})
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
        })
	},
	insertNewPlayer: function(data) { //puts a newly created player into the database.
		var p = new playerModel(data);
		p.save(function(err) {
			if (err) console.log(err)
			else console.log('player saved');
		})
	},
	getAccountById: function(id, callback) {
		accountModel.findById(id, function(err, account) {
            if (err)
            	callback(err, null)
            else
            	callback(null, account);
        })
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
        })
	},
	insertNewAccount: function(acc) {
		var a = new accountModel(acc);
		a.save(function(err) {
			if (err) console.log(err)
			else console.log('account saved');
		})
	},
	updateAccount: function(conditions, update, options, callback) {
		accountModel.update(conditions, update, options, function(err) {
			callback(err);
		});
	},
	updatePlayer: function(conditions, update, options, callback) {
		playerModel.update(conditions, update, options, function(err, num_affected) {
			callback(err, num_affected);
		})
	},
    findAllAccounts: function(query) {
    	var query = query || {};
        accountModel.find(query, function(err, res) {
            console.log(res)
        })
    },
    findAllPlayers: function(query, callback) {
    	var query = query || {};
    	playerModel.find(query, function(err, res) {
    		callback(err, res);
    	})
    },
    accountCount: function(query) {
    	var query = query || {};
    	accountModel.count(query, function(err, res) {
    		console.log(res)
    	});
    }
}