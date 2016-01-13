// I wrote it without warmth and without love. Therefore, there is no artistic merit in it.
require('./js/network_settings.js');
var serverStartTime = new Date().getTime();
var Game = require('./js/game.js');
var game = GAME = new Game();
var fs = require('fs');
var colors = require('colors');


// ============= SOCKET.IO SETUP ============= //
var io = IO = require('socket.io')(port); console.log("Socket listening on " + port + " ...".yellow);
game.exposeIO(io);
0

io.on('connection', function(socket) {
	// console.log("someone connected to socket.");
	// socket.emit('token-request', {});
 //    socket.on('send-token', function(data) {
 //        game.checkToken(data, function(err, username) {
 //            if (err) {
 //                console.log(err);
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
    socket.on('login-info', function(data) {
        console.log(data);
        game.authenticateAccount(data.user, data.pass, function(err, response) {
            if (err) {
                console.log(err);
                socket.disconnect();
            } else if (response === true) { //password match
                game.accountLogIn(socket.id, data.user);
                game.getAccountOverview(data.user, function(err, p_data) { //here's where you send playerdata/overview
                     socket.emit('login-success', p_data);
                });
            } else if (response === false) { //password doesnt match username
                socket.emit('login-failed', {});
                socket.disconnect();
            } else if (response === null) { //no user
                socket.emit('login-failed', {});
                socket.disconnect();
            }
        });
    })
    socket.on('sign-up', function(data) {
        var username = data.user;
        var password = data.pass1;
        var password_repeat = data.pass2;
        if(password != password_repeat){ //checked client side as well
            console.log('someones messing with the client');
            socket.emit('sign-up-error', {});
            socket.disconnect();
            return;
        }


        game.registerAccount(username, password, 'mail@example.com', new Date(), function(err, response) {
            if(err){
                console.log(err);
            }
            else if(response === false){ // name taken.
                socket.emit('sign-up-taken', {});
            }
            else if(response === true){ //account creation success.
                socket.emit('sign-up-success', {});
            }
            socket.disconnect();
        }); //check if unique
    });
    socket.on('create-player', function(data) {
    	var belongsTo = game.getAccountBySocket(socket.id);
    	if(!belongsTo) return; //no user assigned to that socket
    	game.createNewPlayer(data.name, 1, belongsTo, function(err, res) {
    		if(err){
    			console.log(err);
    		}
    		else if(!res){ //name taken
    			socket.emit('player-name-taken', {});
    		}
    		else{ //name good. player created
				socket.emit('player-created', res);
    		}
    	});
    });
    socket.on('start-game-request', function(data) {
    	game.logInPlayer(socket.id, data.id, function(err, data) {
    		if(err)
    			console.log(err);
    		else{
    			if(data){
    				socket.emit('start-game-ok', {
    					playerData: data,
    					mapSize: game.getGameState().mapSize,
    					chunkSize: game.getGameState().chunkSize
    				});
                } else{
    				console.log('something went wrong. this is not your player');
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
    socket.on('request-map-world', function() {

    });
    socket.on('disconnect', function() {
    	game.accountLogOut(socket.id);
    	var logoutTime = new Date();
    	game.logOutPlayer(socket.id, logoutTime);
    });
});