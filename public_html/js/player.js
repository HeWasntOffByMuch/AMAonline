function Player(parentElement, gameState, playerData){
    console.log(playerData)
	var gh = gameState.tileSize;
    var map = GAME.map;
    var socket = GAME.socket;

 	this.id = playerData._id; // +
 	this.name = playerData.name; // +
 	this.type = enums.objType.PLAYER; // +
	this.x = playerData.x; // +
	this.y = playerData.y; // +
	this.tx = this.x; // +
	this.ty = this.y; // +
	this.ax = 0;
	this.ay = 0;
    this.moveTime = false;
    this.moving = false;
    this.speedCur = playerData.speedCur; // +
  	this.moveQ = new MovementQueue(map.getCollisions());
    this.movingToTarget = false;
    this.healthCur = playerData.healthCur; // +
    this.healthMax = playerData.healthMax; // +
    this.manaCur = playerData.manaCur; // +
    this.manaMax = playerData.manaMax; // +
    this.isDead = false;
    this.isVisible = playerData.isVisible;

    this.level = playerData.level;
    this.experience = playerData.experience;
    this.expPercent = (this.experience - expTable[this.level]) / (expTable[this.level+1] - expTable[this.level]);
    this.skillTree = playerData.skillTree.tree;
    this.unusedSkillPoints = playerData.skillTree.unusedSkillPoints;

  	this.lastAttack = gameState.frameTime;
  	this.attackSpeed = playerData.attackSpeed;
    this.inCombat = playerData.inCombat || false;

    this.direction = 'down';
    this.animationFrame = 0;

    this.equipment = playerData.equipment;

    
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
        if(this.movingToTarget && this.moveQ.getLength() == 0){
            this.movingToTarget = false;
            this.openEntity();
        }
        if (!this.moving) {
            var nextMove = this.moveQ.getMove();
            if (nextMove) {
                if (!map.isValid(nextMove[0], nextMove[1]) && this.moveQ.getLength() > 0) {
                    this.moveQ.findPath(this.x, this.y, GAME.destX, GAME.destY);
                    nextMove = this.moveQ.getMove();
                }
                if (nextMove && map.isValid(nextMove[0], nextMove[1])) {
                    var dx = nextMove[0] - this.tx;
                    var dy = nextMove[1] - this.ty;
                    socket.emit('player-input-move', {
                        dx: nextMove[0] - this.tx,
                        dy: nextMove[1] - this.ty
                    });
                    this.moveTime = gameState.frameTime;
                    // this.animationFrame = 0;
                    this.moving = true;
                    this.setDirection(nextMove[0] - this.tx, nextMove[1] - this.ty);
                    this.tx = nextMove[0];
                    this.ty = nextMove[1];
                }
            }
        }
    };
    this.setDirection = function(tx, ty) {
        switch(tx + '' + ty){
            case '01':
                this.direction = 'down';
                break;
            case '0-1':
                this.direction = 'up';
                break;
            case '-10':
                this.direction = 'left';
                break;
            case '10':
                this.direction = 'right';
                break;
        }
    };
    this.openEntity = function() {
        // console.log('about to open', GAME.targetedEntity);
        if(GAME.targetedEntity)
            socket.emit('entity-content-request', GAME.targetedEntity.id);
        //new window
        //emit content request
        //display content
        //profit
    };
    this.drawPlayerCharacter = function(ctx) {
        if(!this.isVisible){
            ctx.globalAlpha = 0.4;
        }
        if (this.moving) {
            this.drawPlayerMoving(ctx);
        } else {
            this.drawPlayerStandingStill(ctx);
        }
        ctx.globalAlpha = 1;
    };
    this.drawPlayerStandingStill = function(ctx) {
        ctx.drawImage(GAME.allImages['Rayman_' + this.direction], 512, 240, 32, 48);
    };
    this.drawPlayerMoving = function(ctx) {
        var img = GAME.allImages['Rayman_run_' + this.direction];
        // var animationSpeed = this.speedCur / img.spriteN;
        var animationSpeed = this.speedCur/4;
        this.animationFrame = Math.floor(gameState.frameTime / animationSpeed) % img.spriteN;
        // this.animationFrame = Math.floor((gameState.frameTime - this.animationStart) / animationSpeed) % img.spriteN;
        ctx.drawImage(img, this.animationFrame * img.spriteX, 0, img.spriteX, img.spriteY, 512, 240, 32, 48);
    };
    this.drawHealthBar = function(ctx) {
        ctx.fillStyle = '#FF371D'; // red
        ctx.fillRect(512 + 4, 240 -2, 24, 3);
        ctx.fillStyle = '#87E82B'; // green
        ctx.fillRect(512 + 4, 240 -2, 24 * (this.healthCur/this.healthMax), 3);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(512 + 4, 240 -2, 24, 3);
    };
    this.drawName = function(ctx) {
        ctx.save();
        ctx.font = "12px Tibia Font";
        ctx.fillStyle = 'rgba(29, 110, 22, 1)';
        ctx.fillText(this.name, 512 - ctx.measureText(this.name).width/2 + 16, 240 - 5);
        ctx.restore();
    };
    this.drawCurrentPath = function(ctx) {
        if(gameState.dev.drawPlayerPath){
            var path = this.moveQ.getCurrentPath();
            for (var i = 0; i < path.length; i++) {
                ctx.fillStyle = 'rgba(0, 0, 210, 0.3)';
                var x = (path[i][0]-this.ax - this.x + 16);
                var y = (path[i][1]-this.ay - this.y + 8);
                ctx.fillRect(x*32, y*32, 32, 32);
            }
        }
    };
    this.draw = function(ctx) {
        if(!this.isDead){
            this.drawPlayerCharacter(ctx);
            this.drawHealthBar(ctx);
            this.drawName(ctx);
            this.drawCurrentPath(ctx);
    	}
    };
    this.attack = function(target) {
    	if(!this.isDead || !this.equipment.primary){
            if(gameState.frameTime - this.lastAttack > this.equipment.primary.contents[0][0].attackCooldown/ this.attackSpeed && dist(this, target) < this.equipment.primary.contents[0][0].range){
                this.lastAttack = gameState.frameTime;

                if(this.equipment.primary.contents[0][0].type == 'ranged'){
                    var los = calcLineOfSight(this.tx, this.ty, target.tx, target.ty);
                    var target_x = target.tx,
                        target_y = target.ty;
                    var type_hit = 'blood_hit',
                        type_miss = 'arrow_hit',
                        type_ammo = 'arrow_new';
                    if(!los.isClear){
                        target_x = los.obstacle.x;
                        target_y = los.obstacle.y;
                        type_hit = type_miss;
                    }
                    GAME.anims.push(new ProjectileAnimation(this.tx, this.ty, target_x, target_y, type_ammo, type_hit));
                }
                if(this.equipment.primary.contents[0][0].type == 'melee'){
                    GAME.anims.push(new AttackAnimation(this, target, this.equipment.primary.contents[0][0].type));
                }
                socket.emit('player-attack', {id: target.id, type: target.type});
                // console.log('player attacking', target.id);
            }
        }
    };
    this.takeDamage = function(damage) {
    	GAME.popupManager.newDamagePopup(this.tx, this.ty, damage, 1000);
        if(damage >= 10)
            GAME.anims.push(new ShortAnimation(this.tx, this.ty, 'blood_hit'));
        else
            GAME.anims.push(new ShortAnimation(this.tx, this.ty, 'blood_hit1'));
    };
    this.showHealAmmount = function(val) {
        GAME.popupManager.newHealPopup(this.tx, this.ty, val, 1000);
    };
    this.moveInventoryItem = function(from, to) { // retarded but works for now. for moving within own inventory and equipment only
        GAME.socket.emit('player-moved-item', {from: from, to: to});
        var item = this.equipment[from.id].contents[from.x][from.y];
        this.equipment[from.id].contents[from.x][from.y] = 0;
        
        this.equipment[to.id].contents[to.x][to.y] = item;
    };
    this.lootEntity = function(from, to) {
        GAME.socket.emit('player-loot-entity', {from: from, to: to});
        var item = GAME.entityManager.getEntities()[from.id].contents[from.pos];  // wow jackass
        this.equipment[to.id].contents[to.x][to.y] = item;
        //do checks if objects exist
        var entity = GAME.entityManager.getEntities();
        var loot = entity[from.id].contents[from.pos];
        delete loot; // nice chain nigga

    };
    this.handleContainerItemMoving = function(from, to) {
        if(from.type == 'container'){
            if(to.type == 'container'){
                this.moveItemInsideContainer(from, to);
            } else{
                this.takeItemFromContainer(from, to);
            }
        } else{
            this.putItemIntoContainer(from, to);
        }
    };
    this.takeItemFromContainer = function(from, to) {
        GAME.socket.emit('container-take-request', {from: from, to: to});
        var item = GAME.entityManager.getEntities()[from.id].contents[from.x][from.y];
        this.equipment[to.id].contents[to.x][to.y] = item;
    };
    this.putItemIntoContainer = function(from, to) {
        GAME.socket.emit('container-put-request', {from: from, to: to});
        this.equipment[from.id].contents[from.x][from.y] = 0;
    };
    this.moveItemInsideContainer = function(from, to) {
        GAME.socket.emit('container-move-inside-request', {from: from, to: to});
        
    };
    this.useItemOnSelf = function(item_data) {
        var item = this.equipment[item_data.parentId].contents[item_data.x][item_data.y];
        GAME.socket.emit('player-use-item-on-self', {id: item_data.parentId, x: item_data.x, y: item_data.y});
        if(item.type == 'consumable' && --item.usesLeft === 0){  
            //remove that item
            //nevermind that is actually handled by server response
        }
    };
    this.useItemOnPlayer = function(item_data, other_player) {
        var item = this.equipment[item_data.parentId].contents[item_data.x][item_data.y];
        GAME.socket.emit('player-use-item-on-target', {id: item_data.parentId, x: item_data.x, y: item_data.y, targetId: other_player.id, targetType: enums.objType.PLAYER});

    };
    this.useItemOnMob = function(item_data, mob) {
        var item = this.equipment[item_data.parentId].contents[item_data.x][item_data.y];
        GAME.socket.emit('player-use-item-on-target', {id: item_data.parentId, x: item_data.x, y: item_data.y, targetId: mob.id, targetType: enums.objType.MOB});
    };
    this.removeItem = function(data) {
        var parentID = data.parentId;
        var id = data.id;
        var container = this.equipment[parentID];
        for(var i = 0; i < container.w; i++){
            for(var j = 0; j < container.h; j++){
                if(container.contents[i][j].id == id){
                    container.contents[i][j] = 0;
                    $('#' + parentID + ' .slot')[0].data[i][j] = 0;
                    $('#' + id).remove();
                }
            }
        }
    };
    this.toggleInvisibility = function(data) {
        this.isVisible = data.isVisible;
    };
    this.updateHealth = function(healthCurUpdate) {
        if (this.healthCur != healthCurUpdate) {
        	if(this.healthCur > healthCurUpdate)
            	this.takeDamage(this.healthCur - healthCurUpdate);
            else if(this.healthCur < healthCurUpdate)
                this.showHealAmmount(healthCurUpdate - this.healthCur);
            this.healthCur = healthCurUpdate;
        }
    };
    this.gainExperience = function(exp) {
        GAME.popupManager.newExpPopup(this.tx, this.ty, exp, 1000);
        this.experience += exp;
        while(this.experience >= expTable[this.level+1]){
            this.levelUp();
        }
        this.expPercent = (this.experience - expTable[this.level]) / (expTable[this.level+1] - expTable[this.level]);
    };
    this.levelUp = function() {
        this.level++;
        GAME.statusMessage.showMessage(presetMessages.onLevelUp(this.level))
    };
    this.requestSkillLevelUp = function(data) {
        GAME.socket.emit('player-skill-request', data);
    };
    this.die = function(){
    	this.isDead = true;
        this.inCombat = false;
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
        GAME.statusMessage.showMessage(presetMessages.onRespawn(x, y));
    	this.x = x;
    	this.y = y;
    	this.tx = x;
    	this.ty = y;
    };
}