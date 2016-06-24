function OtherPlayer(gameState, data) {
    var gh = gameState.tileSize;
    var map = GAME.map;
    this.id = data._id;
    this.name = data.name;
    this.type = enums.objType.PLAYER;
    this.x = data.x;
    this.y = data.y;
    this.tx = data.tx;
    this.ty = data.ty;
    GAME.anims.push(new ShortAnimation(this.x, this.y, 'spawn_puff'));
    console.log('player', this.name, 'created')
    map.occupySpot(this.tx, this.ty);
    this.moving = false;
    this.speedCur = data.speedCur;
    this.healthCur = data.healthCur;
    this.healthMax = data.healthMax;
    this.isDead = false;

    this.direction = 'down';
    this.animationFrame = 0;

    // this.isDead = false;
    // this.isVisible = true;
    // this.isTargeted = false;
    this.lastTime = gameState.frameTime;

    this.move = function(tx, ty) { //gets new tx/ty position and starts moving in update.
        map.freeSpot(this.tx, this.ty);
        this.tx = tx;
        this.ty = ty;
        map.occupySpot(this.tx, this.ty);
    };

    this.update = function() {
        map.occupySpot(this.tx, this.ty)
        this.x += Math.sign(this.tx - this.x) * Math.min((gameState.frameTime - this.lastTime) / this.speedCur, Math.abs(this.tx - this.x));
        this.y += Math.sign(this.ty - this.y) * Math.min((gameState.frameTime - this.lastTime) / this.speedCur, Math.abs(this.ty - this.y));
        
        if (this.tx != this.x || this.ty != this.y) {
                this.setDirection(Math.round(this.tx - this.x), Math.round(this.ty - this.y));
            this.moving = true;
        }
        if (Math.abs(this.x - this.tx) <= 0 && Math.abs(this.y - this.ty) <= 0) {
          this.moving = false;
        }

        this.lastTime = gameState.frameTime;
    }

    this.draw = function(ctx) {
        if(!this.isDead){
            this.drawPlayerCharacter(ctx);
            this.drawHealthBar(ctx);
            this.drawName(ctx);
            this.drawTargetFrame(ctx)
        }
    };
    this.drawPlayerCharacter = function(ctx) {
        if (this.moving) {
            this.drawPlayerMoving(ctx);
        } else {
            this.drawPlayerStandingStill(ctx);
        }
    };
    this.drawPlayerStandingStill = function(ctx) {
        ctx.drawImage(GAME.allImages['Rayman_' + this.direction], (this.x - GAME.player.x - GAME.player.ax + 16) * gh, (this.y - GAME.player.y - GAME.player.ay + 8) * gh - 16, 32, 48);
    };
    this.drawPlayerMoving = function(ctx) {
        var img = GAME.allImages['Rayman_run_' + this.direction];
        var animationSpeed = this.speedCur/4;
        this.animationFrame = Math.floor(gameState.frameTime / animationSpeed) % img.spriteN;
        ctx.drawImage(img, this.animationFrame * img.spriteX, 0, img.spriteX, img.spriteY, (this.x - GAME.player.x - GAME.player.ax + 16) * gh, (this.y - GAME.player.y - GAME.player.ay + 8) * gh - 16, img.spriteX, img.spriteY);
    };
    this.drawHealthBar = function(ctx) {
        ctx.fillStyle = '#FF371D';
        ctx.fillRect((this.x - GAME.player.x - GAME.player.ax + 16) * gh + 2, (this.y - GAME.player.y - GAME.player.ay + 8) * gh - 18, 24, 3);
        ctx.fillStyle = '#87E82B';
        ctx.fillRect((this.x - GAME.player.x - GAME.player.ax + 16) * gh + 2, (this.y - GAME.player.y - GAME.player.ay + 8) * gh - 18, 24 * (this.healthCur / this.healthMax), 3);
        ctx.strokeStyle = '#000';
        ctx.strokeRect((this.x - GAME.player.x - GAME.player.ax + 16) * gh + 2, (this.y - GAME.player.y - GAME.player.ay + 8) * gh - 18, 24, 3);
    };
    this.drawName = function(ctx) {
        ctx.save();
        ctx.font = "12px Tibia Font";
        ctx.fillStyle = 'rgba(29, 110, 22, 1)';
        ctx.fillText(this.name, (this.x-GAME.player.x-GAME.player.ax+16)*gh - ctx.measureText(this.name).width/2 + 16, (this.y-GAME.player.y-GAME.player.ay+8)*gh - 21);
        ctx.restore();
    };
    this.drawTargetFrame = function(ctx) {
        if(this.isTargeted){
          ctx.strokeStyle = "rgba(255, 0, 0, 1)";
          ctx.strokeRect((this.x-GAME.player.x-GAME.player.ax+16)*gh, (this.y-GAME.player.y-GAME.player.ay+8)*gh, gh, gh);
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

    this.attack = function(target, type, isClear) {
        var type_ammo = 'arrow_new',
            type_hit = 'blood_hit',
            type_miss = 'arrow_hit';
        if(!isClear)
            type_hit = type_miss;
        switch(type){
            case 'melee':
                // melee animation
                GAME.anims.push(new AttackAnimation(this, target, type));
                break;
            case 'ranged':
                //something
                GAME.anims.push(new ProjectileAnimation(this.tx, this.ty, target.x, target.y, type_ammo, type_hit));
                break;
        }
    };
    this.showDamageAmmount = function(damage) {
            GAME.popupManager.newDamagePopup(this.tx, this.ty, damage, 1000);
        if(damage >= 10)
            GAME.anims.push(new ShortAnimation(this.tx, this.ty, 'blood_hit'));
        else
            GAME.anims.push(new ShortAnimation(this.tx, this.ty, 'blood_hit1'));
    }
    this.showHealAmmount = function(val) {
        GAME.popupManager.newHealPopup(this.tx, this.ty, val, 1000);
    };
    this.updateHealth = function(healthCurUpdate) {
        if (this.healthCur != healthCurUpdate) {
            if(this.healthCur > healthCurUpdate)
                this.showDamageAmmount(this.healthCur - healthCurUpdate);
            else if(this.healthCur < healthCurUpdate)
                this.showHealAmmount(healthCurUpdate - this.healthCur);
            this.healthCur = healthCurUpdate;
        }
    };
    this.die = function() {
        this.isDead = true;
        if(this == GAME.targetedUnit){
            this.isTargeted = false;
            GAME.targetedUnit = null;
        }
        map.freeSpot(this.tx, this.ty);
        GAME.popupManager.newDamagePopup(this.tx, this.ty, this.healthCur, 1500)
        delete GAME.instance.getPlayersData()[this.id];
    }
    this.toggleInvisibility = function() {
        this.isVisible = false;
        if(this == GAME.targetedUnit){
            this.isTargeted = false;
            GAME.targetedUnit = null;
        }
        GAME.anims.push(new ShortAnimation(this.x, this.y, 'spawn_puff'));
        delete GAME.instance.getPlayersData()[this.id];
    };
}
