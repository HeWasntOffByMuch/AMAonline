require('./astar.js');
var logger = require('tracer').colorConsole();
var enums = require('./enums.js');
var astar = require('./astar.js');
module.exports = function Mob(gameState, id, spawn_x, spawn_y, name, experience){
	console.log('mob created');
	var map;
    this.exposeMap = function(m) {
        map = m;
        map.occupySpot(tx, ty);
    };
    var spawnPoint = {
    	x: spawn_x,
    	y: spawn_y
    }
    var _id = id;
    var type = enums.objType.MOB;
    var name = name;
	var x = spawn_x;
	var y = spawn_y;
	var tx = x;
	var ty = y;
	this.currentChunk = {x: Math.floor(x/gameState.chunkSize.x), y: Math.floor(y/gameState.chunkSize.y)};

	//moving stuff
	var passiveMoveInterval = 1500;
	var speedBase = 600;
	var speedCur = speedBase;
	var moveTime = false;
	var moving = false;
	var hasAggro = false;

	//health 
	this.isDead = false;
	var healthMax = 50;
	var healthCur = 50;

	//exp stuff
	var experience = experience || 1; // exp dropped on death;
	var damageInfo = {}; damageInfo.totalDamageTaken = 0;

	this.getData = function() {
		return {
			_id: _id,
			type: type,
			name: name,
			x: x,
			y: y,
			tx: tx,
			ty: ty,
			speedBase: speedBase,
			speedCur: speedCur,
			healthMax: healthMax,
			healthCur: healthCur
		};
	};
	this.update = function(){
		if(moveTime){
    		if(gameState.frameTime - moveTime > speedCur){ //moving ended. stop unit
    			//time to stop moving
    			moving = false;
    			// moveTime = false;
                x = tx;
                y = ty;
    		}
    	}
    	if(!moving){
    		if(!hasAggro){
	    		if(gameState.frameTime - moveTime > passiveMoveInterval){
	    			this.passiveMove();
	    		}
	    	}
	    	else if(hasAggro){
	    		if(gameState.frameTime - moveTime > speedCur){
	    			this.astarMove();
	    		}
	    	}
	    	this.chunkCheck();
    	}
	};
	this.chunkCheck = function() {
		var cx = Math.floor(tx/gameState.chunkSize.x);
        var cy = Math.floor(ty/gameState.chunkSize.y);
        if(this.currentChunk.x != cx || this.currentChunk.y != cy){
            map.mobLeaveChunk(this, this.currentChunk.x, this.currentChunk.y);
            map.mobEnterChunk(this, cx, cy);
            this.currentChunk.x = cx;
            this.currentChunk.y = cy;
        }
	};
	this.astarMove = function() {

	};
	this.passiveMove = function() {
		var rx=0, ry=0;
  			if(Math.random()<0.5)
    			rx = (Math.random() < (x - spawnPoint.x + 12)/24) ? -1: 1;
  			else
    			ry = (Math.random() < (y - spawnPoint.y + 12)/24) ? -1: 1;
    		this.move(rx, ry);
	};
	this.move = function(dx, dy) {
		if(map.isValid(x + dx, y + dy)){
			moveTime = gameState.frameTime;
			map.freeSpot(tx, ty);
			tx = x + dx;
			ty = y + dy;
			map.occupySpot(tx, ty);
			moving = true;
		}
	};
	this.attack = function() {

	};
	this.aggroCheck = function() {

	};
	this.dropExperience = function(killer) {
		var allPlayers = GAME.getAllPlayersById();
		var killerId = killer.getData()._id;
		for(var id in damageInfo){
			if (id === 'totalDamageTaken' || !allPlayers.hasOwnProperty(id)) continue; //if player logged out he's not getting the xp when the mob dies.
			var exp = 0.5 * experience * (damageInfo[id]/damageInfo.totalDamageTaken) + (allPlayers[id].getData()._id == killerId ? 0.5*experience : 0)
			if(!exp) continue;
			exp = Math.floor(exp);
			allPlayers[id].gainExperience(exp);
		}
	};
	this.takeDamage = function(attacker, damage) { // handle dying and aggro
		var damageTaken = Math.min(damage, healthCur);
		healthCur -= damageTaken;

		var attackerId = attacker.getData()._id;
	    damageInfo[attackerId] = damageInfo[attackerId] || 0;
	    damageInfo[attackerId] += damageTaken;
	    damageInfo.totalDamageTaken += damageTaken;

		if(healthCur <= 0)
			this.die(attacker);
	};
	this.die = function(killer) {
		var am = GAME.getAllMobs(); //kinda nasty walkaround
		delete am[_id];
		map.mobLeaveChunk(this, this.currentChunk.x, this.currentChunk.y);
		this.isDead = true;
		this.dropExperience(killer);
		map.freeSpot(tx, ty)
		IO.emit('mob-death', {id: _id});
	};
}

