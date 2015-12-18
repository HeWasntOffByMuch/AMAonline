// I wrote it without warmth and without love. Therefore, there is no artistic merit in it.

var serverStartTime = new Date().getTime();
var Game = require('./js/game.js');
var Player = require('./js/player.js');
var game = new Game();
var fs = require('fs');
var colors = require('colors');





// ================ HTPPS STUFF ================ //
var options = {
    key: fs.readFileSync('private-key.pem'),
    cert: fs.readFileSync('public-cert.pem')
};

var https = require('https');
var server = https.createServer(options, function(req, res) {

    if (req.method == 'POST') {
        req.on('data', function(data) {
            
            var data = data + '';
            data = data.split('&');
            if(data[0].slice(7) == 'login'){
		        var credentials = {};
		        credentials.username = data[1].slice(9);
		        credentials.password = data[2].slice(9);

                game.authenticateAccount(credentials.username, credentials.password, function(err, response) {
                    if (err) {
                        console.log(err);
                    } else if (response == true) { //password match
                        	var token = game.giveToken(credentials.username)
                            res.writeHead(200, {
                                'Access-Control-Allow-Origin': '*',
                                'Content-Type': 'text/html'
                            });
                            res.end(token);
                    } else if (response == false) { //password doesnt match username
                        res.writeHead(401, {
                            'Access-Control-Allow-Origin': '*',
                            'Content-Type': 'text/html'
                        });
                        res.end();
                    } else if (response == null) { //no user
                        res.writeHead(401, {
                            'Access-Control-Allow-Origin': '*',
                            'Content-Type': 'text/html'
                        });
                        res.end();
                    }
                });
            }
            else if(data[0].slice(7) == 'signup'){
            	var credentials = {};
            	credentials.username = data[1].slice(9);
		        credentials.password = data[2].slice(9);
		        credentials.password_repeat = data[3].slice(16);
		        if(credentials.password == credentials.password_repeat){
		        	game.registerAccount(credentials.username, credentials.password, 'mail@example.com', new Date, function(err, response) {
		        		if(err){
		        			console.log(err);
		        			res.writeHead(500, {
                                'Access-Control-Allow-Origin': '*',
                                'Content-Type': 'text/html'
                            });
                            res.end();
		        		}
		        		else if(response == false){ // name taken.
                            res.writeHead(202, {
                                'Access-Control-Allow-Origin': '*',
                                'Content-Type': 'text/html'
                            });
                            res.end();
		        		}
		        		else if(response == true){ //account creation success.
		        			res.writeHead(201, {
                                'Access-Control-Allow-Origin': '*',
                                'Content-Type': 'text/html'
                            });
                            res.end();
		        		}
		        	}); //check if unique
		        }
            }


        });
        req.on('end', function() {
        	//nothing really.
        });
    } else {
        console.log("!POST");
    }
}).listen(8000);


// ============= SOCKET.IO SETUP ============= //
var io = require('socket.io')(server); console.log('Socket listening on 8000...'.yellow);
game.exposeIO(io);


io.on('connection', function(socket) {
	console.log("someone connected to socket.");
	socket.emit('token-request', {});
    socket.on('send-token', function(data) {
        game.checkToken(data, function(err, username) {
            if (err) {
                console.log(err);
                socket.disconnect();
            } else {
            	game.removeToken(data);
            	game.accountLogIn(socket.id, username);
            	game.getAccountOverview(username, function(err, p_data) { //here's where you send playerdata/overview
            			socket.emit('send-players', p_data);
            	});
            }
        });
    });
    socket.on('create-player', function(data) {
    	var belongsTo = game.getAccountBySocket(socket.id);
    	if(!belongsTo) return; //no user assigned to that socket
    	game.createNewPlayer(data.name, 1, belongsTo, function(err, res) {
    		if(err){
    			console.log(err);
    		}
    		else if(!res){ //name taken
    			socket.emit('player-created', false);
    		}
    		else{ //name good. player created
				socket.emit('player-created', res);
    		}
    	});
    });
    socket.on('start-game', function(data) {
    	game.logInPlayer(socket.id, data.id, function(err, data) {
    		if(err)
    			console.log(err);
    		else{
    			if(data)
    				socket.emit('start-game-ok', {
    					playerData: data,
    					mapSize: game.getGameState().mapSize,
    					chunkSize: game.getGameState().chunkSize
    				});
    			else
    				console.log('something went wrong. this is not your player');
    		}
    	})
    });
    socket.on('ping', function(data) {

    });
    socket.on('player-input-move', function(data) { //read up on compressing that and lowering overhead
    	var p = game.getPlayerBySocket(socket.id)
    	if(p)
    		p.move(data.dx, data.dy, socket.id);
    });
    socket.on('request-map-world', function() {

    });
    socket.on('disconnect', function() {
    	game.accountLogOut[socket.id];
    	var logoutTime = new Date();
    	game.logOutPlayer(socket.id, logoutTime);
    });
    socket.on('ping', function(data) { //debugging
        console.log(eval(data))
    });
});