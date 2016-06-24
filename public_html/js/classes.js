function MovementCheck(player){ //not used right now
	var serverMoves = [];
	var clientMoves = [];
	this.log = function() {
		console.log(serverMoves)
		console.log(clientMoves)
	};
	this.addServerMove = function(_x, _y) {
		if(serverMoves.length === 0){
			serverMoves.unshift({x: _x, y: _y});
		}
		if(serverMoves[0].x != _x || serverMoves[0].y != _y) {
			serverMoves.unshift({x: _x, y: _y});
		}
	};
	this.addClientMove = function(_x, _y) {
		if(clientMoves.length === 0){
			clientMoves.unshift({x: _x, y: _y});
		}
		if(clientMoves[0].x != _x || clientMoves[0].y != _y) {
			clientMoves.unshift({x: _x, y: _y});
		}
	};
	this.snapPlayerBack = function(_tx, _ty) {
		player.x = _tx;
		player.y = _ty;
		player.tx = _tx;
		player.ty = _ty;
		serverMoves = [];
		clientMoves = [];
	};
	this.check = function(_tx, _ty) {
		if(serverMoves.length > 4 && clientMoves.length > 4)
		for(var i = 4; i > 1; i--){
			if(serverMoves[i].x != clientMoves[i].x || serverMoves[i].y != clientMoves[i].y){
				this.snapPlayerBack(_tx, _ty);
				break;
			}
		}
	};
	this.update = function() {
		if(serverMoves.length > 20)
			serverMoves.pop();
		if(clientMoves.length > 20)
			clientMoves.pop();
	};
};
function EntityManager() {
	var gh = gameState.tileSize;
	var allEntities = {};

	this.addEntity = function(id, entity) {
		allEntities[id] = entity;
	};
	this.removeEntity = function(id) {
		delete allEntities[id];
		// remove loot window
		$('#' + id).parent().parent().remove();
	};
	this.populateEntities = function(map_data) {
		var id, name, x, y;
		for(var k=0; k < map_data.length; k++){
			var map_part = map_data[k];
			var entities = map_data[k].entity_data;
			for(var id in entities){
				allEntities[id] = entities[id];
			}
		}
	};
	this.draw = function(ctx) {
		var img;
        for (var i in allEntities) {
        	img = GAME.allImages[allEntities[i].name] || GAME.allImages['placeholder'];
        	ctx.drawImage(img, (allEntities[i].x-GAME.player.x-GAME.player.ax+16)*gh, (allEntities[i].y-GAME.player.y-GAME.player.ay+8)*gh, img.spriteX, img.spriteY);
        }
	};
	this.getEntities = function() {
		return allEntities;
	};
	this.update = function() {
		for(var i in allEntities){
			if(Math.max(Math.abs(allEntities[i].x - GAME.player.tx), Math.abs(allEntities[i].y - GAME.player.ty)) > 1)
				$('#' + allEntities[i].id).parent().parent().remove();
		}
	};
}

function PopupManager() {
	var offsetX = 11;
	var curId = 0;
	var allPopups = {};
	var defaultDecayTime = 3000;
	var gh = gameState.tileSize;

	this.newDamagePopup = function(x, y, number, decay_time) {
		allPopups[curId++] = {
			x: x,
			y: y,
			type: 'damage',
			value: number,
			creationTime: new Date().getTime(),
			decayTime: decay_time || defaultDecayTime
		}
	};
	this.newExpPopup = function(x, y, number, decay_time) {
		allPopups[curId++] = {
			x: x,
			y: y,
			type: 'exp',
			value: number,
			creationTime: new Date().getTime(),
			decayTime: decay_time || defaultDecayTime
		}
	};
	this.newHealPopup = function(x, y, number, decay_time) {
		allPopups[curId++] = {
			x: x,
			y: y,
			type: 'heal',
			value: number,
			creationTime: new Date().getTime(),
			decayTime: decay_time || defaultDecayTime
		}
	};
	this.update = function() {
		for(var i in allPopups){
			var p = allPopups[i];
            if (gameState.frameTime - p.creationTime > p.decayTime) {
                delete allPopups[i];
            } else {
            	switch(p.type) {
            		case 'damage':
	            		p.y -= 0.01;
	            		break;
	        		case 'exp':
		        		p.y -= 0.01;
		        		break;
	        		case 'heal':
		        		p.y += 0.01;
		        		break;
            	}
            }
		}
	};
	this.draw = function(ctx) {
		for(var i in allPopups){
			var p = allPopups[i];
            switch (p.type) {
                case 'damage':
                    ctx.font = "12px Tibia Font";
	                if (p.value >= 100) {
	                    ctx.font = "14px Tibia Font";
	                } else if (p.value >= 10) {
	                    ctx.font = "13px Tibia Font";
	                }
                	ctx.strokeStyle = '#000';
					ctx.lineWidth = 0.5;
                    ctx.fillStyle = 'rgba(210, 0, 0, 1)';
                    ctx.fillText(p.value, (p.x - GAME.player.x - GAME.player.ax+16) * gh - ctx.measureText(p.value).width/2 + 16, (p.y - GAME.player.y - GAME.player.ay+8) *gh - 12);
                    ctx.strokeText(p.value, (p.x - GAME.player.x - GAME.player.ax+16) * gh - ctx.measureText(p.value).width/2 + 16, (p.y - GAME.player.y - GAME.player.ay+8) *gh - 12);
                    ctx.lineWidth = 1;
                    break;
                case 'heal':
                    ctx.font = "12px Tibia Font";
	                if (p.value >= 100) {
	                    ctx.font = "14px Tibia Font";
	                } else if (p.value >= 10) {
	                    ctx.font = "13px Tibia Font";
	                }
                	ctx.strokeStyle = '#000';
					ctx.lineWidth = 0.5;
                    ctx.fillStyle = 'rgba(0, 210, 0, 1)';
                    ctx.fillText(p.value, (p.x - GAME.player.x - GAME.player.ax+16) * gh - ctx.measureText(p.value).width/2 + 16, (p.y - GAME.player.y - GAME.player.ay+8) *gh - 18);
                    ctx.strokeText(p.value, (p.x - GAME.player.x - GAME.player.ax+16) * gh - ctx.measureText(p.value).width/2 + 16, (p.y - GAME.player.y - GAME.player.ay+8) *gh - 18);
                    ctx.lineWidth = 1;
                    break;
                case 'exp':
                	ctx.font = "12px Tibia Font";
                    // ctx.strokeStyle = '#000';
					// ctx.lineWidth = 0.5;
                    ctx.fillStyle = '#fff';
                    ctx.fillText(p.value, (p.x - GAME.player.x - GAME.player.ax+16) * gh - ctx.measureText(p.value).width/2 + 16, (p.y - GAME.player.y - GAME.player.ay+8) *gh - 24);
                    // ctx.strokeText(p.value, (p.x - GAME.player.x - GAME.player.ax+16) * gh - ctx.measureText(p.value).width/2 + 16, (p.y - GAME.player.y - GAME.player.ay+8) *gh - 24);
                    ctx.lineWidth = 1;
                    break;
            }
		}
	};

}

function peerJsTools() {
	var allAudioCalls = {};
	var playerPeer = new Peer({key: 'lwjd5qra8257b9'}); // MOVE PEERJS API KEY TO NETWORK SETTINGS

	var playerPeerId;
	this.getPeerId = function() {
		return playerPeerId;
	};
	navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    playerPeer.on('open', function(id) {
        console.log('My peer ID is: ' + id);
        playerPeerId = id;
    });

    playerPeer.on('call', function(call) {
    	console.log('incoming call detected')
		navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
        navigator.getUserMedia({
            video: false,
            audio: true
        }, function(stream) {
            call.answer(stream); // Answer the call with an A/V stream.
            call.on('stream', function(remoteStream) {
            	console.log('PEERJS: incoming audio stream', remoteStream);
            	// WEBAUDIO API BELOW - DOESN'T WORK IN CHROME?
                // var audioContext = new AudioContext();
                // var audioStream = audioContext.createMediaStreamSource(remoteStream);
                // audioStream.connect(audioContext.destination);
				  var audio = $('<audio autoplay />').appendTo('body');
				  audio[0].src = (URL || webkitURL || mozURL).createObjectURL(remoteStream);
            });
        }, function(err) {
            console.log('Failed to get local stream', err);
        });
    });

    this.initiatePeerAudioCall = function(id, peerId) {
		navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
        navigator.getUserMedia({
                video: false,
                audio: true
            }, function(stream) {
                var call = playerPeer.call(peerId, stream);

                console.log('PEERJS: calling', peerId, 'with', stream);

                allAudioCalls[id] = call;
                call.on('stream', function(remoteStream) {
                	console.log('PEERJS: got an answer back');
                    // var audioContext = new AudioContext();
                    // var audioStream = audioContext.createMediaStreamSource(remoteStream);
                    // audioStream.connect(audioContext.destination);
					  var audio = $('<audio autoplay />').appendTo('body');
					  audio[0].src = (URL || webkitURL || mozURL).createObjectURL(remoteStream);
                });
            }, function(err) {
                console.log('Failed to get local stream', err);
            }
        );
    };

    this.endActiveCall = function(id) {
        if(allAudioCalls[id]){
        	console.log('ending active call');
        	allAudioCalls[id].close();
        }
        else{
        	console.log('stopping call attempt');
        }
    };
}
var presetMessages = {
	onDeath: {message: 'R.I.P.', color: '#616161', time: 3000},
	onRespawn: function(x, y){
		return {message: 'You respawned at ' + x + ', ' + y + ' coordinates', color: '#616161', time: 3000}
	},
	onLevelUp: function(level){
		return {message: 'You advanced to level ' + level, color: 'green', time: 3000}
	}
};
function StatusMessage(canvas) { //client only
	var defaultOptions = {
		message: 'unhandled message',
		time: 3000,
		color: '#fff'
	}
    //initial message
    this.message = "";
    this.messageTime = gameState.frameTime + defaultOptions.time;
    this.active = true;

    this.canvas = canvas;
    this.elem = document.createElement("div");

    this.elem.style.position = "absolute";
    this.elem.style.left = "0px";
    this.elem.style.top = canvas.height - 50 + "px";
    this.elem.style.height = "20px";
    this.elem.style.width = canvas.width + "px";
    this.elem.style.color = defaultOptions.color;
    this.elem.style.textAlign = "center";
    this.elem.innerHTML = this.message;
    this.elem.style.textShadow = "0 0 2px black, 0 0 2px black, 0 0 2px black";
    $(".game-container")[0].appendChild(this.elem);


    this.update = function() {
        if (gameState.frameTime > this.messageTime && this.active) {
            $(this.elem).fadeOut();
            this.active = false;
        }
    }

    this.showMessage = function(opts) {
    	var options = $.extend({}, defaultOptions, opts);
        this.message = options.message;
        this.elem.style.color = options.color
        this.elem.innerHTML = this.message;
        this.messageTime = gameState.frameTime + options.time;
        if (!this.active)
            $(this.elem).fadeIn();
        this.active = true;
    }
}
// GAME ON DIVS. MAYBE USE SOME OF IT FOR CERTAIN ELEMENTS. NOT NOW THO.

// function repositionTile() { // deprecated
//     if(!this) return;
//     this.style.left = this.x + 'px';
//     this.style.top = this.y + 'px';
// }
// function changeTileFrame(num) { // deprecated
//     if (!this) return;
//     this.style.backgroundPosition =
//         (-1 * (num % tilesSprite.tilesW) * tilesSprite.spriteX + 'px ') +
//         (-1 * (Math.floor(num / tilesSprite.tilesW) % tilesSprite.tilesH)) * tilesSprite.spriteY + 'px ';
// }
// function destroyTile() { // deprecated
//     if (!this) return;
//     this.parent.removeChild(this.element);
// }
// function Tile(parentElement, x, y, sprite) { // deprecated
//     // function references
//     this.reposition = repositionTile;
//     this.frame = changeTileFrame;
//     this.destroy = destroyTile;
//     // (default: foreground)
//     this.parent = parentElement ? parentElement : GAME.foreground;
//     // create a DOM sprite
//     this.element = document.createElement("div");
//     this.element.className = 'tile';
//     // optimized pointer to style object
//     this.style = this.element.style;
//     // starting position
//     this.x = x * 32;
//     this.y = y * 32;
//     this.reposition();

//     // random spritesheet frame
//     this.frame(sprite);
//     // put it into the game window
//     this.parent.appendChild(this.element);
// }
