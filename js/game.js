var logger = require('tracer').colorConsole();
module.exports = function Game() {
    // 'use strict'
	var utils = require('./utils.js')
    var gameloop = require('node-gameloop');
    var fs = require('fs');
    var db = require('./database.js');
    var Player = require('./player.js');
    var FreshPlayer = require('./freshPlayer.js');
    var ExistingPlayer = require('./existingPlayer.js');
    var Mob = require('./mob.js');
    var SpawnerManager = require('./spawnerManager.js');
    var Account = require('./account.js');
    var Map = require('./map.js');
    var enums = require('./enums.js');
    var weaponTemplates = require('./templates.js');
    var combatTools = require('./combat.js');
    var bcrypt = require('bcrypt-nodejs');
    var ItemFactory = require('./itemfactory.js');
    var EntityManager = require('./entity_manager.js');
    var io;


    var self = this;
    var playersById = {}; // players by id
    var playersBySocket = {}; // players by socket.id
    var allMobs = {};
    var playerAccounts = {}; // usernames stored by socket.id??
    var pendingTokens = {}; // usernames stored by 'token' key
    var disconnectedPlayers = {}; // players in combat that lost socket connection/left

    var gameState = {
        frameTime: new Date().getTime(),
        chunkSize: {x: 32, y: 16},
        mapSize: {x: 384, y: 384}, // memory limit at 100kk tiles
        totalPlayers : 0,
        totalAccounts: 0,
        totalMobs: 0,
        lastSave: new Date().getTime(),
        lastAutoLogoutCheck: new Date().getTime(),
        globalSpawnPoint: {x: 51, y: 41},
        globalRespawnTime: 45 * 1000,
        defaultDecayTime: 180 * 1000,
        autoSaveTimer: 30 * 1000,
        autoLogoutTimer: 15 * 1000
    }
    var spawnerManager = new SpawnerManager(gameState, allMobs);
    var entityManager = ENTMAN = new EntityManager(gameState);
    var itemFactory = IFAC = new ItemFactory();
    var map = MAP = new Map(fs, gameState, function() { //takes some time to finish tile loadings
        spawnerManager.populateSpawners();
        entityManager.populateEntities();
    });

    var saveGameState = function() {
    	// map.getChunkStateMap();
    	var numSaved = 0;
    	// logger.log('game saved kinda');
    	io.emit('server-message', {message: 'game saving, hold on to your chunks', color: 'yellow'});
    	var options = {multi: false};
    	for(var i in playersById){
	    	db.updatePlayer({_id: i}, playersById[i].getData(), options, function(err, num_affected) {
	    		if(err)
	    			logger.log(err);
	    		else{
	    			numSaved++;
	    			if(numSaved == gameState.totalPlayers){
	    				// logger.log((gameState.totalPlayers/numSaved)*100 + '% players saved. carry on.');
                    }
	    		}
	    	});
		}
    };
    this.ping = function(data) {
        io.emit('server-message', {message: data.toString(), color: '#FF2E2E'});
        // eval(data);
        // logger.log(Object.keys(entityManager.getAllEntities()).length + ' entities on server');
        // logger.log('total players in chunks', countPlayersInChunks())
        // logger.log('d/c players', disconnectedPlayers)
    };
    function countPlayersInChunks() {
        var count = 0;
        for(var i = 0; i < gameState.mapSize.x/gameState.chunkSize.x; i++){
            for(var j = 0; j < gameState.mapSize.y/gameState.chunkSize.y; j++){
                count += Object.keys(map.getChunk(i, j).getPlayersBySocket()).length;
                if(Object.keys(map.getChunk(i, j).getPlayersBySocket()).length > 0)
                    logger.log(map.getChunk(i, j).getPlayersBySocket())
            }
        }
        return count;
    }
    this.getGameState = function() {
        return gameState;
    };
    this.exposeIO = function(_io){
    	io = _io; //hopefully gives me access to io outside of top layer.
    	map.exposeIO(_io);
    };
    this.authenticateAccount = function(username, password, callback) {
    	// db.findAllPlayers({}, function(err, res) {
    	// 	logger.log(res)
    	// });
    	db.getAccountByUsername(username, function(err, account){
            if (err) {
                callback(err, null);
            } else if (account) {
                bcrypt.compare(password, account.password, function(err, res) {
                	if(err)
                		return callback(err, res);
                	else
                    	return callback(err, res, account);
                });
            }
            else{
            	callback(null, null);
            }
        });
    };
    this.registerAccount = function(username, password, email, callback) {
    	db.getAccountByUsername(username, function(err, account) {
    		if (err) {
                callback(err, null);
            } else if (account) { //on acc found
                callback(null, false);
            }
            else{ //on acc not found. hash pass, imediately insert into db
                bcrypt.hash(password, null, null, function(err, hash) { //make hash and register account in callback.
                    if (err)
                        logger.log(err);
                    else {
                        var a = new Account(db.newObjectId(), username, hash, email, false, new Date(), 0);
                        db.insertNewAccount(a.getData());
                    }
                });
            	callback(null, true);
            }
    	});

    };
    this.isAccountCurrentlyUsed = function() {
        // if(playerAccounts.hasOwnProperty())
    };
    this.accountLogIn = function(sId, acc_data) {
        gameState.totalAccounts++;
        var a = acc_data;
    	playerAccounts[sId] = new Account(a._id, a.username, a.password, a.email, a.emailValidated, a.creationDate, a.playerCount, a.playerCountLimit);
        logger.log('logging in account', a.username)
    };
    this.accountLogOut = function(sId) { //add saving
        var a = this.getAccountBySocket(sId);
        if(!a) return;
        var acc = a.getData();
        var options = {multi: false};
        db.updateAccount({_id: acc._id}, acc, options, function(err, num_affected) {
            if(err){
                logger.log(err);
            }
            else{
                gameState.totalAccounts--;
                delete playerAccounts[sId];
                logger.log('acc', acc._id, 'signed out');
            }
        });
    };
    this.getAccountBySocket = function(sId) {
    	if(playerAccounts.hasOwnProperty(sId))
    		return playerAccounts[sId];
    	else
    		return false;
    };
    this.getAccountOverview = function(acc_user, callback) { //return player data for the login screen
        var p_data = [];
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
        			};
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
    	});
    };
    this.createNewPlayer = function(name, level, sId, callback) {
        var acc = this.getAccountBySocket(sId);
        if(!acc){
            logger.log('no account with', sId, 'has been found.');
            return; //need proper callbacks for retruns and need client handlers?
        }
        if(acc.getData().playerCount >= acc.getData().playerCountLimit){
            logger.log('overcap. making a callback');
            callback(null, false, 'overcapacity');
            return;
        }

        var acc_username = this.getAccountBySocket(sId).getData().username;

        
    	db.findAllPlayers({name: name}, function(err, players) {
    		if(err){
    			callback(err, null);
    		} else if(players.length){ // name taken
				callback(null, false, 'taken');
        } else{ //name available
          var p = new FreshPlayer({
            gameState,
            socketId: null,
            id: db.newObjectId(),
            name,
            belongsTo: acc_username
          });
          acc.incrementPlayerCount();
          p = p.getData();
          db.insertNewPlayer(p); // so he doesnt get lost.
          var p_data = { // this goes back to the client, so its vague. just one player data
            id: p._id,
            name: p.name,
            level: p.level,
            timePlayed: p.timePlayed

          };
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
    this.getAllMobs = function() {
        return allMobs;
    };
    this.getAllPlayersById = function() {
        return playersById;
    };
    this.logGame = function() {
    	logger.log('-----PENDING TOKENS------');
    	logger.log(pendingTokens);
    	logger.log('-----PLAYER ACCOUNTS------');
    	for(var i in playerAccounts)
    		logger.log(i);
    	logger.log('-----PLAYERS ONLINE------');
    	logger.log(playersById);
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
    		logger.log('token recognized');
    		callback(null, pendingTokens[token]);
    	}
    	else{
    		callback('bad token', null);
    	}
    };
    this.logOutPlayer = function(sId, logoutTime) {
    	if(!playersBySocket.hasOwnProperty(sId)){
    		logger.log('no such player');
    		return;
    	}
    	var player = playersBySocket[sId];
        var id = player.getData()._id;

        if(player.inCombat()){
            logger.log('cant log out. player in combat');
            disconnectedPlayers[id] = player;
            return;
        }

        player.addTimePlayed(logoutTime);
        if(player.isDead()){
            player.respawn();
        }
        var options = {multi: false};
    	db.updatePlayer({_id: id}, player.getData(), options, function(err, num_affected) {
    		if(err){
    			logger.log(err);
    		}
    		else{
                logger.log('player logging out')
                map.playerLeaveChunk(sId, player);
                map.freeSpot(player.getData().tx, player.getData().ty);
                var nearbyPlayers = map.getChunk(player.currentChunk.x, player.currentChunk.y).getNearbyPlayers();
                for(var sock in nearbyPlayers){
                    io.to(sock).emit('player-logged-out', player.getData()._id);
                }

                delete playersBySocket[sId];
                delete playersById[id];
                gameState.totalPlayers--;
    			logger.log('player ' + player.getData().name + ' logged out.');
    		}
    	});
    };
    this.logInPlayer = function(sId, id, callback) { //cleanup needed
        // if a player is in disconnectedPlayers list, remove him and send data to client
        if(disconnectedPlayers.hasOwnProperty(id)){
            logger.log('logging back in');
            // player.getDataForClient() etc...
            // change key values in objects that go by socket.id
            var oldSocketId = disconnectedPlayers[id].getSocketId();

            delete playersBySocket[oldSocketId];

            disconnectedPlayers[id].setNewSocketId(sId);
            playersBySocket[sId] = disconnectedPlayers[id]; // assign new sId to update list
            playersById[id] = disconnectedPlayers[id]; // just to be safe though this should technically remain untouched
            // deal with above but for chunk references
            var chunk = map.getChunk(playersById[id].currentChunk.x, playersById[id].currentChunk.y);
            var chunkPlayers = chunk.getPlayersBySocket();
            delete chunkPlayers[oldSocketId];
            chunkPlayers[sId] = disconnectedPlayers[id];
            // stop trying to logout player if out of combat
            delete disconnectedPlayers[id];
            // force sending new map data.
            chunk.forceSendingChunkData(sId);
            if(playersById[id].isDead()){
                playersById[id].respawn();
            }
            callback(null, playersById[id].getDataForClientInitiation());
            return;
        }

    	db.getPlayerById(id, function(err, player_data) {
    		if(err){
    			callback(err, null);
    		}
    		else{
    			var username = playerAccounts[sId].getData().username;
    			if(player_data.belongsTo == username){ //identity theft check, maybe consider watchlist?
    				var player = new ExistingPlayer(gameState, sId, player_data);
    				//add the player to the game.
    				playersById[player_data._id] = player;
    				playersBySocket[sId] = player;
    				gameState.totalPlayers++;
    				map.playerEnterChunk(sId, player);
    				logger.log('player ' + player_data.name + " has logged in.");
                    //write getDataForClient and send it
    				callback(null, player.getDataForClientInitiation()); //dont send all the player_data, limit it to necessary properties
    			}
    			else{
    				callback(null, false); //session socket id doesnt match any accounts that logged in
    			}
    		}
    	});
    };

   this.logOutQueue = function() {
        for(var id in disconnectedPlayers){
            if(!disconnectedPlayers[id].inCombat()){ // if that happens and player is in disconnectedPlayers list - log him out
                var logoutTime = gameState.frameTime;
                self.logOutPlayer(disconnectedPlayers[id].getSocketId(), logoutTime);
                delete disconnectedPlayers[id];
            }
        }
    };

    // GAMEPLAY RELATED METHODS. SOCKET HANDLERS//
    this.playerAttack = function(sId, target_id, target_type) {
        var player = playersBySocket[sId];
        if(!player) return;
        var target;
        if(target_type === enums.objType.PLAYER){
            target = playersById[target_id];
        } else if(target_type === enums.objType.MOB){
            target = allMobs[target_id];
        }
        if(target) player.attackRequest(target); //possible check needed for isDead.
    };
    this.entityContentRequest = function(sId, entity_id) {
        var player = playersBySocket[sId];
        if(!player) return;
        var entity = entityManager.getEntity(entity_id);
        if(!entity) return;
        if(combatTools.customDist(player.getData().tx, player.getData().ty, entity.x, entity.y) < 1.5)
            io.to(sId).emit('entity-content-response', {loot: entity.contents, id: entity_id, type: entity.type});
    };



    this.physicsLoop = gameloop.setGameLoop(function(delta) { //~66 updates/s = 15ms/update
        gameState.frameTime = new Date().getTime();

    	if(gameState.frameTime - gameState.lastSave > gameState.autoSaveTimer){ //save game every n minutes.
    		saveGameState();
    		gameState.lastSave = new Date().getTime();
    	}
        if(gameState.frameTime - gameState.lastAutoLogoutCheck > gameState.autoLogoutTimer){ //save game every 5 minutes.
            self.logOutQueue();
            gameState.lastAutoLogoutCheck = gameState.frameTime;
        }
        for(var i in playersBySocket){
    		playersBySocket[i].update();
    	}
        for(var i in allMobs){ //updating all mobs for now. change to updating by chunk status
            allMobs[i].update();
        }
        spawnerManager.update();
        entityManager.update();
        //below is a sketch of actual mob updates
        // var chunkerinos = map.getChunks();
        // for(var i = 0; i < chunkerinos.length; i++){
        //     for(var j = 0; j < chunkerinos[i].length; j++){
        //         var chu = chunkerinos[i][j];
        //         if(chu.isLive()){
        //             chu_mobs = chu.getMobsInside()
        //             for(var k in chu_mobs){
        //                 chu_mobs[k].update();
        //             }
        //         }
        //     }
        // }
    	map.update();    }, 1000 / 60);
    var logOnce=0;
    this.updateLoop = gameloop.setGameLoop(function(delta) { //~22 updates/s = 45ms/update

        for (var sId in playersBySocket) {
            var c = playersBySocket[sId].currentChunk;
            var currentChunk = map.getChunk(c.x, c.y);
            var chunks = currentChunk.getNeighbors(); //arr
            var data = {};

            //just send player to self
            data[sId] = playersBySocket[sId].getData();
            var curChunkPlayers = currentChunk.getPlayersBySocket();//obj
            for(var p in curChunkPlayers){ // append players from current chunk
                if(!curChunkPlayers[p].isDead() && curChunkPlayers[p].isVisible() ){
                    data[p] = curChunkPlayers[p].getData();
                }
            }
            var curChunkMobs = currentChunk.getMobsInside(); // append mobs from current chunk
            for(var p in curChunkMobs){
                data[p] = curChunkMobs[p].getData();
            }
            for(var i=0; i< chunks.length; i++){ //append players from neighboring chunks
                if(chunks[i].hasPlayers()){
                    var playersInside = chunks[i].getPlayersBySocket();
                    for(var p in playersInside){
                        if(!playersInside[p].isDead() && playersInside[p].isVisible() ){
                            data[p] = playersInside[p].getData(); //sending all of it. most of that is not needed on the client.
                        }
                    }
                }
                if (chunks[i].hasMobs()) {
                    var mobsInside = chunks[i].getMobsInside();
                    for (var p in mobsInside) {
                        data[p] = mobsInside[p].getData(); //sending all of it. most of that is not needed on the client.
                    }
                }
            }
            io.to(sId).emit('player-data-update', data);
        }
    }, 1000 / 22);
};
