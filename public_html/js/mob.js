function Mob(gameState, data){
    var gh = gameState.tileSize;
    var map = GAME.map;
    
    var img = GAME.allImages[data.name] || GAME.allImages['placeholder'];
    this.animationFrame = 0;
    this.animationSpeed = 160;
    this.animationStart = gameState.frameTime;

    this.id = data._id;
    this.type = enums.objType.MOB;
    this.name = data.name;
    this.x = data.x;
    this.y = data.y;
    GAME.anims.push(new ShortAnimation(this.x, this.y, 'spawn_puff'));
    this.tx = data.tx;
    this.ty = data.ty;
    map.occupySpot(this.tx, this.ty); //occupy on creation.
    // this.direction = 0;
    this.speedCur = data.speedCur;
    this.healthCur = data.healthCur;
    this.healthMax = data.healthMax;
    this.isDead = false;
    this.lastTime = gameState.frameTime;

    this.isTargeted = false;
    this.update = function() {
        map.occupySpot(this.tx, this.ty)
        this.x += Math.sign(this.tx-this.x) * Math.min((gameState.frameTime - this.lastTime)/this.speedCur, Math.abs(this.tx-this.x));
        this.y += Math.sign(this.ty-this.y) * Math.min((gameState.frameTime - this.lastTime)/this.speedCur, Math.abs(this.ty-this.y));

        this.lastTime = gameState.frameTime;
        // if(this.healthCur <= 0)
        //  this.die();
    };
    this.move = function(tx, ty) { //gets new tx/ty position and starts moving in update.
        map.freeSpot(this.tx, this.ty);
        this.tx = tx;
        this.ty = ty;
        map.occupySpot(this.tx, this.ty);
    };
    this.drawTargetFrame = function(ctx) {
        if(this.isTargeted){
          ctx.strokeStyle = "rgba(255, 0, 0, 1)";
          ctx.strokeRect((this.x-GAME.player.x-GAME.player.ax+16)*gh, (this.y-GAME.player.y-GAME.player.ay+8)*gh, gh, gh);
        }
    };
    this.drawAnimatedSprite = function(ctx) {
        this.animationFrame = Math.floor((gameState.frameTime - this.animationStart) / this.animationSpeed) % img.spriteN;;
        ctx.drawImage(img, this.animationFrame * img.spriteX, 0, gh, gh, (this.x-GAME.player.x-GAME.player.ax+16)*gh, (this.y-GAME.player.y-GAME.player.ay+8)*gh, gh, gh);
    };
    this.drawHealthBar = function(ctx) {
        if(!this.isDead){
            ctx.fillStyle = '#FF371D';
            ctx.fillRect((this.x-GAME.player.x-GAME.player.ax+16)*gh + 4, (this.y-GAME.player.y-GAME.player.ay+8)*gh - 4, 24, 3);
            ctx.fillStyle = '#87E82B';
            ctx.fillRect((this.x-GAME.player.x-GAME.player.ax+16)*gh + 4, (this.y-GAME.player.y-GAME.player.ay+8)*gh - 4, 24 * (this.healthCur/this.healthMax), 3);
            ctx.strokeStyle = '#000';
            ctx.strokeRect((this.x-GAME.player.x-GAME.player.ax+16)*gh + 4, (this.y-GAME.player.y-GAME.player.ay+8)*gh - 4, 24, 3);
        }
    };
    this.drawName = function(ctx) {
        if(!this.isDead){
            ctx.save();
            ctx.font = "12px Tibia Font";
            ctx.fillStyle = 'rgba(29, 110, 22, 1)';
            ctx.fillText(this.name, (this.x-GAME.player.x-GAME.player.ax+16)*gh - ctx.measureText(this.name).width/2 + 16, (this.y-GAME.player.y-GAME.player.ay+8)*gh - 7);
            // ctx.lineWidth = 0.5;
            // ctx.strokeStyle = '#000';
            // ctx.strokeText(this.name, 512 - 9, 240 - 5);
            ctx.restore();
        }
    };
    this.draw = function(ctx) {
        this.drawTargetFrame(ctx);
        this.drawAnimatedSprite(ctx);
        
        this.drawHealthBar(ctx);
        this.drawName(ctx);
    };
    this.showDamageAmmount = function(damage) {
        GAME.popupManager.newDamagePopup(this.tx, this.ty, damage, 1000);
    };
    this.drawHitAnimation = function(damage){
        if(damage >= 10)
            GAME.anims.push(new ShortAnimation(this.tx, this.ty, 'blood_hit'));
        else
            GAME.anims.push(new ShortAnimation(this.tx, this.ty, 'blood_hit1'));
    };
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
    this.die = function() { //doesnt go off. dead mob is never sent from server. need dying emit?
        this.isDead = true;
        this.isTargeted = false;
        GAME.targetedUnit = null;
        map.freeSpot(this.tx, this.ty);
        GAME.popupManager.newDamagePopup(this.tx, this.ty, this.healthCur, 1000);
        delete GAME.instance.getMobsData()[this.id];
    };
}