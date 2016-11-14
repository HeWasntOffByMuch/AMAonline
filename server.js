// I wrote it without warmth and without love. Therefore, there is no artistic merit in it.
require('./js/network_settings.js');
var logger = require('tracer').colorConsole();
var serverStartTime = new Date().getTime();
var Game = require('./js/game.js');
var game = GAME = new Game();
var fs = require('fs');
var colors = require('colors');


// ============= SOCKET.IO SETUP ============= //
var io = IO = require('socket.io')(port); console.log(`Socket listening on ${port} ...`.yellow);
game.exposeIO(io);

// io.set('transports', [ 'websocket' ]);

io.on('connection', function(socket) {
	logger.log("someone connected to socket.");
	// socket.emit('token-request', {});
 //    socket.on('send-token', function(data) {
 //        game.checkToken(data, function(err, username) {
 //            if (err) {
 //                logger.log(err);
 //                socket.disconnect();
 //            } else {
 //                game.removeToken(data);
 //                game.accountLogIn(socket.id, username);
 //                game.getAccountOverview(username, function(err, p_data) { //here's where you send playerdata/overview
 //                		socket.emit('send-players', p_data);
 //                });
 //            }
 //        });
 //    });
    socket.on('login-info', function(authData) {
        logger.log(authData);
        game.authenticateAccount(authData.user, authData.pass, function(err, response, acc_data) {
            if (err) {
                logger.log(err);
            } else if (response === true) { //password match
                game.accountLogIn(socket.id, acc_data);
                game.getAccountOverview(authData.user, function(err, p_data) { //here's where you send playerdata/overview
                     socket.emit('login-success', p_data);
                });
            } else if (response === false) { //password doesnt match username
                socket.emit('login-failed', {});
            } else if (response === null) { //no user
                socket.emit('login-failed', {});
            }
        });
    })
    socket.on('sign-up', function(data) {
        var username = data.user;
        var password = data.pass1;
        var password_repeat = data.pass2;
        if(password != password_repeat){ //checked client side as well
            logger.log('someones messing with the client');
            socket.emit('sign-up-error', {});
            return;
        }


        game.registerAccount(username, password, 'mail@example.com', function(err, response) {
            if(err){
                logger.log(err);
            }
            else if(response === false){ // name taken.
                socket.emit('sign-up-taken', {});
            }
            else if(response === true){ //account creation success.
                socket.emit('sign-up-success', {});
            }
        }); //check if unique
    });
    socket.on('create-player', function(data) {
        if( data.name && data.name.length > 12){
            socket.emit('player-name-too-long', {});
            return;
        }
    	game.createNewPlayer(data.name, 1, socket.id, function(err, player_data, option) {
    		if(err){
    			logger.log(err);
    		}
            if(player_data){ //name good. player created
                socket.emit('player-created', player_data);
            }
    		else if(!player_data){ //name taken
                if(option == 'taken')
                    socket.emit('player-name-taken', {});
                else if(option == 'overcapacity'){
                    socket.emit('player-count-exceeded', {});
                }
    		}
    	});
    });
    socket.on('start-game-request', function(data) {
    	game.logInPlayer(socket.id, data.id, function(err, data) {
    		if(err)
    			logger.log(err);
    		else{
    			if(data){
    				socket.emit('start-game-ok', {
    					playerData: data,
    					mapSize: game.getGameState().mapSize,
    					chunkSize: game.getGameState().chunkSize
    				});
                } else{
    				logger.log('something went wrong. this is not your player');
                }
    		}
    	});
    });
    socket.on('ping', function(data) { //dev cheat
    	game.ping(data);
    });
    socket.on('player-input-move', function(data) { //read up on compressing that and lowering overhead
    	var p = game.getPlayerBySocket(socket.id);
    	if(p){
    		p.queueMove(data.dx, data.dy);
    	}
    });
    socket.on('player-attack', function(data) { // data = {id: id, type: 0/1}
    	game.playerAttack(socket.id, data.id, data.type);
    });
    socket.on('player-inventory-change', function() {

    });
    socket.on('player-respawn-request', function() {
        var player = game.getPlayerBySocket(socket.id);
        if(player && player.isDead()){
            player.respawn();
        }
    });
    socket.on('player-logout-request', function() {
        socket.emit('player-logout-response', {});
        var logoutTime = new Date();
        game.logOutPlayer(socket.id, logoutTime);
        game.accountLogOut(socket.id);
    });
    socket.on('disconnect', function() {
        var logoutTime = new Date();
        game.logOutPlayer(socket.id, logoutTime);
        game.accountLogOut(socket.id);
    });
    socket.on('player-moved-item', function(data) {
        // logger.log(data)
        var player = game.getPlayerBySocket(socket.id);
        if(player && !player.isDead()){
            player.moveInventoryItem(data.from, data.to);
        }
    });
    socket.on('player-use-item-on-self', function(data) {
        var player = game.getPlayerBySocket(socket.id);
        if(player && !player.isDead()){
            player.useItemOnSelf(data);
        }
    });
    socket.on('player-use-item-on-target', function(data) {
        var player = game.getPlayerBySocket(socket.id);
        if(player){
            player.useItemOnTarget(data);
        }
    });
    socket.on('player-skill-request', function(data) {
        var player = game.getPlayerBySocket(socket.id);
        if(player && !player.isDead()){
            player.spendSkillRequest(data);
        }
    });
    socket.on('player-call-request', function(data) {
        logger.log(data);
        var playerCalling = game.getPlayerBySocket(socket.id);
        var playerBeingCalled = game.getPlayerById(data.playerCalled).getSocketId();
        if(playerCalling && playerBeingCalled){
            io.to(playerBeingCalled).emit('player-call-incoming', {callerId: playerCalling.getData()._id ,callerName: playerCalling.getData().name, peerId: data.peerId})
        }
    });
    socket.on('player-call-refuse', function(callerId) {
        var socketToNotify = game.getPlayerById(callerId).getSocketId(); //if a player logged this will obviously fail
        var playerRefusingId = game.getPlayerBySocket(socket.id).getData()._id;
        io.to(socketToNotify).emit('player-call-refuse', playerRefusingId)
    });
    socket.on('player-call-accept', function(callerId) {
        var socketToNotify = game.getPlayerById(callerId).getSocketId(); //if a player logged this will obviously fail
        var playerAcceptingId = game.getPlayerBySocket(socket.id).getData()._id;
        io.to(socketToNotify).emit('player-call-accept', playerAcceptingId)
    });
    // 2 below are for looting items
    socket.on('entity-content-request', function(entity_id) {
        game.entityContentRequest(socket.id, entity_id);
    });
    socket.on('player-loot-entity', function(data) {
        var player = game.getPlayerBySocket(socket.id);
        if(player && !player.isDead()){
            player.lootEntity(data.from, data.to);
        }
    });
    // handing container items
    socket.on('container-take-request', function(data) {
        var player = game.getPlayerBySocket(socket.id);
        if(player && !player.isDead()){
            player.takeItemFromContainer(data.from, data.to);
        }
    });
    socket.on('container-put-request', function(data) {
        var player = game.getPlayerBySocket(socket.id);
        if(player && !player.isDead()){
            player.putItemIntoContainer(data.from, data.to);
        }
    });
    socket.on('container-move-inside-request', function(data) {
        var player = game.getPlayerBySocket(socket.id);
        if(player && !player.isDead()){
            player.moveItemInsideContainer(data.from, data.to);
        }
    });
    socket.on('container-stack-inside-request', function(data) {
        var player = game.getPlayerBySocket(socket.id);
        if(player && !player.isDead()){
            player.stackItemsInsideContainer(data.from, data.to);
        }
    });
    socket.on('stack-items-request', function(data) {
        var player = game.getPlayerBySocket(socket.id);
        if(player && !player.isDead()){
            player.stackInventoryItems(data.from, data.to);
        }
    });
    socket.on('container-take-stack-request', function(data) {
        var player = game.getPlayerBySocket(socket.id);
        if(player && !player.isDead()){
            player.stackItemFromContainer(data.from, data.to);
        }
    });
    socket.on('container-put-stack-request', function(data) {
        var player = game.getPlayerBySocket(socket.id);
        if(player && !player.isDead()){
            player.stackItemIntoContainer(data.from, data.to);
        }
    });
});
