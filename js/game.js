module.exports = function Game() {
	var utils = require('./utils.js')
    var gameloop = require('node-gameloop');
    var fs = require('fs');
    var db = require('./database.js');
    var Player = require('./player.js');
    var freshPlayer = require('./freshPlayer.js');
    var existingPlayer = require('./existingPlayer.js');
    var Foe = require('./foe.js');
    var Account = require('./account.js');
    var Map = require('./map.js');
    var findPath = require('./astar.js');
    var enums = require('./enums.js');
    var weaponTemplates = require('./templates.js');
    var bcrypt = require('bcrypt-nodejs');
    var io;

    var playersById = {}; // players by id
    var playersBySocket = {}; // players by socket.id
    var allMobs = {};
    var playerAccounts = {}; // usernames stored by socket.id??
    var pendingTokens = {}; // usernames stored by 'token' key

    var gameState = {
        frameTime: new Date().getTime(),
        chunkSize: {x: 32, y: 16},
        mapSize: {x: 96, y: 96},
        totalPlayers : 0,
        totalAccounts: 0,
        totalMobs: 0,
        lastSave: new Date().getTime()
    }
    var map = new Map(fs, gameState);
    
    
    var saveGameState = function() {
    	map.getChunkStateMap();
    	var numSaved = 0;
    	console.log('game saved kinda');
    	io.emit('server-message', {message: 'game saving, hold on to your chunks'});
    	var options = {multi: false};
    	for(i in playersById){
	    	db.updatePlayer({_id: i}, playersById[i].getData(), options, function(err, num_affected) {
	    		if(err)
	    			console.log(err)
	    		else{
	    			numSaved++;
	    			if(numSaved == gameState.totalPlayers)
	    				console.log((gameState.totalPlayers/numSaved)*100 + '% players saved. carry on.')
	    		}
	    	});
		}
    };
    this.getGameState = function() {
        return gameState;
    };
    this.exposeIO = function(_io){
    	io = _io; //hopefully gives me access to io outside of top layer.
    	map.exposeIO(_io);
    }
    this.authenticateAccount = function(username, password, callback) {
    	// db.findAllPlayers({}, function(err, res) {
    	// 	console.log(res)
    	// });
    	db.getAccountByUsername(username, function(err, account){
            if (err) {
                callback(err, null);
            } else if (account) {
                bcrypt.compare(password, account.password, function(err, res) {
                	if(err)
                		return callback(err, res)
                	else
                    	return callback(err, res);
                });
            }
            else{
            	callback(null, null)
            }
        });
    };
    this.registerAccount = function(username, password, email, creationDate, callback) {
    	db.getAccountByUsername(username, function(err, account) {
    		if (err) {
                callback(err, null);
            } else if (account) { //on acc found
                callback(null, false);
            }
            else{ //on acc not found. hash pass, imediately insert into db
                bcrypt.hash(password, null, null, function(err, hash) { //make hash and register account in callback.
                    if (err)
                        console.log(err);
                    else
                        var a = new Account(db.newObjectId(), username, hash, email, false, creationDate, []);
                    db.insertNewAccount(a.getData());
                });
            	callback(null, true)
            }
    	})
    	
    	
    }
    this.accountLogIn = function(socket, username) {
    	playerAccounts[socket] = username;
    };
    this.accountLogOut = function(socket) {
    	delete playerAccounts[socket];
    };
    this.getAccountBySocket = function(socket) {
    	if(playerAccounts.hasOwnProperty(socket))
    		return playerAccounts[socket];
    	else
    		return false;
    };
    this.getAccountOverview = function(acc_user, callback) { //return player data for the login screen
        p_data = [];
        db.findAllPlayers({belongsTo: acc_user}, function(err, players) {
        	if(err) callback(err, null);
        	else{
        		for(var i = 0; i< players.length; i++){
        			var p = players[i];
        			p_data[i] = {
        				id: p._id,
        				name: p.name,
        				level: p.level,
        				lastLogin: p.lastLogin,
        				timePlayed: p.timePlayed
        			}
        		}
        		callback(null, p_data);
        	}
        });
    };
    this.getAccountById = function(id, callback) {
    	db.getAccountById(id, function(err, acc) {
            if (err) {
                callback(err, null);
            } else {
            		var a = new Account(acc._id, acc.username, acc.password, acc.email, acc.emailValidated, acc.creationDate, acc.playerList);
                callback(null, a);
            }
    	})
    };
    this.createNewPlayer = function(name, level, acc_user, callback) {
    	db.findAllPlayers({name: name}, function(err, players) {
    		if(err){
    			callback(err, null);
    		} else if(players.length){ // name taken
				callback(null, false);
			}
			else{ //name available
				var p = new freshPlayer(gameState, db.newObjectId(), name, acc_user);
				p.exposeMap(map);
			    var p = p.getData();
			    db.insertNewPlayer(p); // so he doesnt get lost.
			    var p_data = {
			    	id: p._id,
    				name: p.name,
    				level: p.level,
    				timePlayed: p.timePlayed

			    }
				callback(null, p_data);
			}

    	});
    };
    this.getPlayerBySocket = function(sId) {
        if(playersBySocket.hasOwnProperty(sId))
    	   return playersBySocket[sId];
        else
            return false;
    };
    this.getPlayerById = function(id) {
        if(playersById.hasOwnProperty(id))
           return playersById[id];
        else
            return false;
    };
    this.logGame = function() {
    	console.log('-----PENDING TOKENS------');
    	console.log(pendingTokens);
    	console.log('-----PLAYER ACCOUNTS------');
    	for(i in playerAccounts)
    		console.log(i);
    	console.log('-----PLAYERS ONLINE------');
    	console.log(playersById);
    };
    this.returnGameState = function() {
    	return gameState;
    };
    this.giveToken = function(username){
    	var token = utils.generateToken();
		pendingTokens[token] = username;
		return token;
    };
    this.removeToken = function(token) {
    	delete pendingTokens[token];
    };
    this.checkToken = function(token, callback) {
    	if(pendingTokens.hasOwnProperty(token)){
    		console.log('token recognized');
    		callback(null, pendingTokens[token]);
    	}
    	else{
    		callback('bad token', null);
    	}
    };
    this.logOutPlayer = function(sId, logoutTime) {
    	if(!playersBySocket.hasOwnProperty(sId)){
    		console.log('no such player');
    		return;
    	}
    	var player = playersBySocket[sId];
    	var id = player.getData()._id;

    	player.addTimePlayed(logoutTime);

    	var options = {multi: false};
    	db.updatePlayer({_id: id}, player.getData(), options, function(err, num_affected) {
    		if(err){
    			console.log(err)
    		}
    		else{
                map.playerLeaveChunk(sId, player)
                delete playersBySocket[sId];
                delete playersById[id];
                gameState.totalPlayers--;
    			console.log('player ' + player.getData().name + ' logged out.');
    		}
    	});
    };
    this.logInPlayer = function(sId, id, callback) {
    	db.getPlayerById(id, function(err, player_data) {
    		if(err){
    			callback(err, null);
    		}
    		else{
    			var username = playerAccounts[sId];
    			if(player_data.belongsTo == username){ //identity theft check, maybe consider watchlist?
    				var player = new existingPlayer(gameState, player_data);
    				player.exposeMap(map);
    				//add the player to the game.
    				playersById[player_data._id] = player;
    				playersBySocket[sId] = player;
    				gameState.totalPlayers++;
    				map.playerEnterChunk(sId, player);
    				console.log('player ' + player_data.name + " has logged in.")
    				callback(null, player_data); //dont send all the player_data, limit it to unly necessary properties
    			}
    			else{
    				callback(null, false);
    			}
    		}
    	});
    };
    this.physicsLoop = gameloop.setGameLoop(function(delta) { //~66 updates/s = 15ms/update
        gameState.frameTime = new Date().getTime();

    	if(gameState.frameTime - gameState.lastSave > 300*1000){ //save game every 5 minutes.
    		saveGameState();
    		gameState.lastSave = new Date().getTime();
    	}
        for(var i in playersBySocket){
    		playersBySocket[i].update();
    	}
    	map.update();

    }, 1000 / 60);
    var logOnce=0;
    this.updateLoop = gameloop.setGameLoop(function(delta) { //~22 updates/s = 45ms/update
        //this is some visualization logging.
        // if(logOnce++ % 10 == 0){
        //     // console.log(playersBySocket)
        //     var arr = map.getChunks();
        //     for(var i=0; i<arr.length; i++){
        //         for(var j=0; j<arr[i].length; j++){
        //             console.log(arr[i][j].getPosition(), Object.keys(arr[i][j].getPlayersBySocket()).length);
        //         }
        //     }
        // }
        for (var sId in playersBySocket) {
            var c = playersBySocket[sId].currentChunk;
            var currentChunk = map.getChunks()[c.x][c.y];
            var chunks = currentChunk.getNeighbors(); //arr
            var data = {};
            var curChunkPlayers = currentChunk.getPlayersBySocket();//obj
            
            for(var p in curChunkPlayers){
                data[p] = curChunkPlayers[p].getData();
            }
            for(var i=0; i< chunks.length; i++){
                if(chunks[i].isEmpty()) continue;
                var content = chunks[i].getPlayersBySocket();
                for(var p in content){
                    data[p] = content[p].getData();
                }
            }
            io.to(sId).emit('player-data-update', data);
        }
    }, 1000 / 22);

}