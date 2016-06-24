function ProjectileAnimation(caller_x, caller_y, target_x, target_y, type1, type2, options){
  if(!options) options = {};
  var gh = gameState.tileSize;
  var x = caller_x;
  var y = caller_y;
  var tx = target_x;
  var ty = target_y;
  var animStart = gameState.frameTime;
  var projectileSpeed = options.projectileSpeed || 120;
  var speed = projectileSpeed + 3*dist({tx: x, ty: y}, {tx: tx, ty: ty});
  var state = 1;
  var animationSpeed = options.animationSpeed || 80;
  var angle = Math.atan2(ty-y,tx-x) + Math.PI/2;
  var ax, ay;

  this.update = function(){
    if(state){
      ax = (tx - x) * (gameState.frameTime - animStart) / speed;
      ay = (ty - y) * (gameState.frameTime - animStart) / speed;
      if(gameState.frameTime - animStart >= speed){
        // this.hit();
        state = 0;
        animStart = gameState.frameTime;
        x = tx;
        y = ty;
      }
    }
    else{
      this.animationFrame = Math.floor((gameState.frameTime - animStart) / animationSpeed);
      if(this.animationFrame > GAME.allImages[type2].spriteN)
        delete GAME.anims[this.id];
    }
  }
  this.draw = function(ctx){
    if(state){
      ctx.drawRotatedImage(GAME.allImages[type1], (x + ax - GAME.player.x - GAME.player.ax + 16)*gh+gh/2, (y + ay - GAME.player.y - GAME.player.ay + 8)*gh+gh/2, gh, gh, angle);
    }
    else{
      ctx.drawImage(GAME.allImages[type2], this.animationFrame*GAME.allImages[type2].spriteX, 0, GAME.allImages[type2].spriteX, GAME.allImages[type2].spriteY, (tx - GAME.player.x - GAME.player.ax + 16) * gh, (ty - GAME.player.y - GAME.player.ay + 8) * gh, gh, gh);
    }
  }
  this.hit = function(){
    // target.takeDamage(player1.data, this.damage);
  }
}
var animationDefaults = {
  speed: 90
}
function ShortAnimation(x, y, img_name, options) {
    var options = $.extend({}, animationDefaults, options);
    var img = GAME.allImages[img_name];
    var gh = gameState.tileSize;
    var animStart = gameState.frameTime;
    var animationSpeed = options.speed;
    var animationFrame;
    this.update = function() {
        animationFrame = Math.floor((gameState.frameTime - animStart) / animationSpeed);
        if (animationFrame > img.spriteN)
            delete GAME.anims[this.id];
    };
    this.draw = function(ctx) {
        ctx.drawImage(img, animationFrame * img.spriteX, 0, img.spriteX, img.spriteY, (x - GAME.player.x - GAME.player.ax + 16) * gh, (y - GAME.player.y - GAME.player.ay + 8) * gh, gh, gh)
    };
}
function AttackAnimation(caller, target, type) {
    var gh = gameState.tileSize;
    var x = (target.x - caller.x)/2 + 0.5;
    var y = (target.y - caller.y)/2 + 0.5;
    var angle = Math.atan2(target.y - caller.y, target.x - caller.x);
    var animStart = gameState.frameTime;
    var animationSpeed = 60;
    var type = type + '_slash';
    var img = GAME.allImages[type]
    var animationFrame = 0;
    this.update = function() {
        animationFrame = Math.floor((gameState.frameTime - animStart) / animationSpeed);
        if (animationFrame > img.spriteN)
            delete GAME.anims[this.id];
    }
    this.draw = function(ctx) {
        switch (type) {
            case 'melee_slash':
                ctx.drawRotatedAnim(img, animationFrame * img.spriteX, 0, img.spriteX, img.spriteY, (caller.x - GAME.player.x + x + 16)*gh, (caller.y - GAME.player.y + y + 8)*gh, angle, 1.6);
                break;
            case 'big_melee_slash':
                ctx.drawRotatedAnim(img, animationFrame * img.spriteX, 0, img.spriteX, img.spriteY, (caller.x - GAME.player.x + x + 16)*gh, (caller.y - GAME.player.y + y + 8)*gh, angle, 0.7);
                break;
        }
    }
}
function AnimationManager(){
  var id = 0;
  this.push = function(projectile){
    projectile.id = ++id;
    this[projectile.id] = projectile;
  }
  this.update = function(){
    for (var p in this) {
      if(!isNaN(p)) {
        this[p].update();
      }
    }
  }
  this.draw = function(ctx){
    for (var p in this) {
      if(!isNaN(p)) {
        this[p].draw(ctx);
      }
    }
  }
}