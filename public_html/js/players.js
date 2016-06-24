function Player(parentElement, gameState, playerData){
    var serverBackpack = playerData.equipment.backpack;
	GAME.WIN_BP = new guiWindow({
		width: 140,
        height: 165,
        title: "BACKPACK",
        icon: "bp.gif",
        onclose: function() {
            this.hide();
        },
        position: { y: 20, x: 20 },
        content: ['<div id=' + serverBackpack.name + ' class="slot bp" size_x=' + serverBackpack.w + ' size_y=' + serverBackpack.h + '></div>']
    }).setId('backpack');
    // function itemElement(size_x, size_y, parent, pos_x, pos_y, id, src)
    // var item = new itemElement(1, 1, bp, 0, 0, 1, 'item1.gif');
    var testid = 0;
    var bp = $('#backpack .bp').makeContainer();
    for(var i = 0; i < serverBackpack.w; i++){
    	for(var j = 0; j < serverBackpack.h; j++){
    		if(serverBackpack.contents[i][j]){
    			var itemName = serverBackpack.contents[i][j].name;
    			var img = GAME.allImages[itemName] || GAME.allImages['placeholder'];
	    		var item = new itemElement(1, 1, bp, i, j, testid++, img.src, {
	    			name: itemName
	    		});
	    	}
    	}
    }
	WIN_EQ = new guiWindow({
		width: 140,
        height: 165,
        title: "EQ",
        icon: "items/phantom_ganon.gif",
        onclose: function() {
            this.hide();
        },
        position: { y: 20, x: 182 },
        content: [
        			'<div id="head" class="slot head" size_x=1 size_y=1 pos_x="50px" pos_y="5px" ></div>',
        			'<div id="primary" class="slot primary" size_x=1 size_y=1 pos_x="10px" pos_y="45px" ></div>',
        			'<div id="secondary" class="slot secondary" size_x=1 size_y=1 pos_x="90px" pos_y="45px" ></div>',
        			'<div id="body" class="slot body" size_x=1 size_y=1 pos_x="50px" pos_y="45px" ></div>',
        			'<div id="legs" class="slot legs" size_x=1 size_y=1 pos_x="50px" pos_y="85px" ></div>',
        			'<div id="boots" class="slot boots" size_x=1 size_y=1 pos_x="50px" pos_y="125px" ></div>'
        		]
    }).setId('equipment');
	var eq = $('#equipment .slot').makeContainer(1, 1);
	$('#equipment .gui-window-content').children().each(function() {
		var div = $( this );
		var item = playerData.equipment[div.attr('id')];
		if(item){
			var img = GAME.allImages[item.name] || GAME.allImages['placeholder'];
			item = new itemElement(1, 1, div, 0, 0, testid++, img.src, {
				name: item.name
			});
		}
	});


    WIN_DEATH = new guiWindow({
		width: 250,
        height: 100,
        title: "YOU ARE DEAD.",
        icon: "tombstone-icon.png"
    });
    WIN_DEATH.appendHTML("<div class='gui-clist-footer'><center><div class='form-field'><button type='button' id='button_respawn' class='anim-alt'>RESPAWN</button><button id='button_logout' type='button'>LOGOUT</button></div></center></div>");
    WIN_DEATH.center();
    WIN_DEATH.hide();
    $('#button_respawn').click(function() {
    	socket.emit('player-respawn-request', {});
    });
    $('#button_logout').click(function() {
    	socket.emit('player-logout-request', {});
    });
	var socket = GAME.socket;
	var map = GAME.map;
	var gh = gameState.tileSize;
	// this.reposition = repositionTile;
 //    this.frame = changeTileFrame;
 //    this.destroy = destroyTile;
 //    this.parent = parentElement ? parentElement : GAME.gameContainer;
	// this.element = document.createElement("div");
	// this.element.className = 'player';
	// this.style = this.element.style;
	// //starting pos from server
	// this.frame(0);
 //    this.parent.appendChild(this.element);
 	this.id = playerData._id;
 	this.name = playerData.name;
 	this.type = enums.objType.PLAYER;
	this.x = playerData.x;
	this.y = playerData.y;
	this.tx = this.x;
	this.ty = this.y;
	this.ax = 0;
	this.ay = 0;
    this.moveTime = false;
    this.moving = false;
    this.speedCur = playerData.speedCur;
  	this.moveQ = new MovementQueue(map.getCollisions());

  	this.healthCur = playerData.healthCur;
  	this.healthMax = playerData.healthMax;
  	this.isDead = false;

  	this.lastAttack = gameState.frameTime;
  	this.attackCooldown = 400;
  	this.attackSpeed = 1;


  	this.equipment = playerData.equipment || {
        primary: {type: 'sword', range: 1.5},
        secondary: 0,
        body: 0,
        legs: 0,
        boots: 0,
        head: 0,
        backpack: 0
    };
    this.move = function(dx, dy) {
    	if(!this.isDead){
		    if (map.isValid(this.tx + dx, this.ty + dy)) {
		        this.moveQ.queueMove(this.tx + dx, this.ty + dy);
		    }
		}
    };
    this.update = function() {
    	this.ax = (this.tx - this.x) * (gameState.frameTime - this.moveTime) / this.speedCur;
    	this.ay = (this.ty - this.y) * (gameState.frameTime - this.moveTime) / this.speedCur;

    	if(this.moveTime){
    		if(gameState.frameTime - this.moveTime > this.speedCur){
    			//time to stop moving
    			this.x = this.tx;
    			this.y = this.ty;
    			this.ax = 0;
    			this.ay = 0;
    			this.moving = false;
    			this.moveTime = false;
    		}
    	}

        if (!this.moving) {
            var nextMove = this.moveQ.getMove();
            if (nextMove) {
                if (!map.isValid(nextMove[0], nextMove[1]) && this.moveQ.getLength() > 0) {
                    this.moveQ.findPath(this.x, this.y, GAME.destX, GAME.destY);
                    nextMove = this.moveQ.getMove();
                }
                if (nextMove && map.isValid(nextMove[0], nextMove[1])) {
                    socket.emit('player-input-move', {
                        dx: nextMove[0] - this.tx,
                        dy: nextMove[1] - this.ty
                    });
                    this.moveTime = gameState.frameTime;
                    // this.animationFrame = 0;
                    this.moving = true;
                    this.tx = nextMove[0];
                    this.ty = nextMove[1];
                }
            }
        }
    };
    this.draw = function(ctx) {
    	ctx.drawImage(GAME.allImages['Rayman_down'], 512, 240, 32, 48);
    	if(!this.isDead){ //draw healthbar
			ctx.fillStyle = '#FF371D';
			ctx.fillRect(512 + 2, 240 -2, 24, 3);
			ctx.fillStyle = '#87E82B';
			ctx.fillRect(512 + 2, 240 -2, 24 * (this.healthCur/this.healthMax), 3);
			ctx.strokeStyle = '#000';
			ctx.strokeRect(512 + 2, 240 -2, 24, 3);
    	}
    };
    this.attack = function(target) {
    	if(!this.isDead){
            if(gameState.frameTime - this.lastAttack > this.attackCooldown/this.attackSpeed && dist(this, target) < this.equipment.primary.range){
                this.lastAttack = gameState.frameTime;

                if(this.equipment.primary.type == 'bow'){
                    // do bow stuff and possibly return here.

                }
                socket.emit('player-attack', {id: target.id, type: target.type});
                // console.log('player attacking', target.id);
            }
        }
    };
    this.takeDamage = function(damage) {
    	GAME.popupManager.newHealthPopup(this.tx, this.ty, damage, 1000);
    };
    this.moveInventoryItem = function(from, to) { // retarded but works for now.
        var item;
        if(from.id == 'backpack'){
            item = this.equipment.backpack.contents[from.x][from.y];
            this.equipment.backpack.contents[from.x][from.y] = 0;
        } else {
             item = this.equipment[from.id];
             this.equipment[from.id] = 0;
        }
        if(to.id == 'backpack'){
            this.equipment.backpack.contents[to.x][to.y] = item;
        } else {
            this.equipment[to.id] = item;
        }
    };
    this.updateHealth = function(healthCurUpdate) {
        if (this.healthCur != healthCurUpdate) {
        	if(this.healthCur > healthCurUpdate)
            	this.takeDamage(this.healthCur - healthCurUpdate);
            this.healthCur = healthCurUpdate;
        }
    };
    this.die = function(){
    	this.isDead = true;
    	$('.canvas').addClass('grayscale');
    	setTimeout(function() {
    		WIN_DEATH.show();
    	}, 2000);
    };
    this.respawn = function(x, y) {
    	this.isDead = false;
    	setTimeout(function() {
    		$('.canvas').removeClass('grayscale');
    	}, 500);
    	WIN_DEATH.hide();
    	this.x = x;
    	this.y = y;
    	this.tx = x;
    	this.ty = y;
    };
}