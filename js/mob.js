var logger = require('tracer').colorConsole();
var enums = require('./enums.js');
var MovementQueue = require('./movement_queue.js');
var combatTools = require('./combat.js');
var lootTools = require('./loot.js');

var defaultValues = {
    accuracyRating: 400,
    evasionRating: 400,
    parryRating: 400,
    blockRating: 400,
    physicalResistance: 0,
		retargetChanceOnDamage: 0.05,
    mobWeapon: {type: enums.weaponType.MELEE, range: 1.5, damageMin: 1, damageMax: 4}
};
// module.exports = function Mob(gameState, options){
module.exports = function Mob(gameState, id, spawn_x, spawn_y, name, experience, health_max, speed_base, possible_loot, mob_weapon, retarget_chance){
	var map = MAP;
	var spawnPoint = {
		x: spawn_x,
		y: spawn_y
	};
	var _id = id;
	var type = enums.objType.MOB;
	var name = name;
	var x = spawn_x;
	var y = spawn_y;
	var tx = x;
	var ty = y;

	map.occupySpot(tx, ty);
	this.currentChunk = {x: Math.floor(x/gameState.chunkSize.x), y: Math.floor(y/gameState.chunkSize.y)};


	//moving stuff
	var passiveMoveInterval = 1500;
	var speedBase = speed_base ||  600;
	var speedCur = speedBase;
	var moveTime = gameState.frameTime;
	var moving = false;

    //aggro stuff
	var aggressive = true;
	var aggroRange = 8;
	var aggroProximity = 1; //how close a unit gets to its target
	var target = null;
	var retargetChanceOnDamage = retarget_chance || defaultValues.retargetChanceOnDamage;
	var pathfindingPersistence = 300; // cap on nodes visited by A*

	var pathBlocked = false; // findPath returned .timedOut: true
	var pathBlockedTime = gameState.frameTime; // on findPath.tomeOut start timer
	var pathBlockedInterval = 1500; // how long to wait until next astar to current target
	var moveQ = new MovementQueue(pathfindingPersistence);

	//attacking and HP
	var lastAttack = gameState.frameTime;
	var attackCooldown = 1000;
	var attackSpeed = 1;

	// RPG PROPERTIES
	var accuracyRating = accuracyRating || defaultValues.accuracyRating;
	var evasionRating = evasionRating || defaultValues.evasionRating;
	var parryRating = parryRating || defaultValues.parryRating;
	var blockRating = blockRating || defaultValues.blockRating;
	var physicalResistance = physicalResistance || defaultValues.physicalResistance;
	this._ = {
			accuracyRating: accuracyRating || defaultValues.accuracyRating,
			evasionRating: evasionRating || defaultValues.evasionRating,
			parryRating: parryRating || defaultValues.parryRating,
			blockRating: blockRating || defaultValues.blockRating,
			physicalResistance: physicalResistance || defaultValues.physicalResistance
	};

	//health 
	var isDead = false;
	var healthMax = health_max || 12;
	var healthCur = healthMax;

	//exp stuff
	var experience = experience || 1; // exp dropped on death;
	var damageInfo = {}; damageInfo.totalDamageTaken = 0;

	var loot = lootTools.rollForLoot(possible_loot) || {}; //possible loot specified in spawnerManager.js
	var mobWeapon = mob_weapon || defaultValues.mobWeapon;
	var c = [[]];
	c[0][0] = mobWeapon;
	//the 3 lines above might be the biggest shit i've laid in a while. imitates container structure.
	var equipment = {
        primary: {contents: c}, // this is nasty, but consistent with player inventory structure
        secondary: 0,
        body: 0,
        legs: 0,
        boots: 0,
        head: 0,
        loot: {}
	};
	this.getEquipment = function() {
		return equipment;
	};
	this.isDead = function() {
		return isDead;
	};
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
			healthCur: healthCur,
			aggroRange: aggroRange,
			target: target
		};
	};
	this.getCombatData = function() {
		return {
			accuracyRating: accuracyRating,
			evasionRating: evasionRating,
			parryRating: parryRating,
			blockRating: blockRating,
			equipment: equipment
		}
	};
	this.getEquipment = function() {
		return equipment;
	};
	this.update = function(){
		this.periodicEvent();
		this.aggroCheck(); // make it run twice a second ?
		this.moveUpdate();
		if(target)
			this.attack();
	};
	this.moveUpdate = function() {
		if(moveTime){
    		if(gameState.frameTime - moveTime > speedCur){ //moving ended. stop unit
    			moving = false;
                x = tx;
                y = ty;
    		}
    	}
    	if(pathBlocked){
    		if(gameState.frameTime - pathBlockedTime > pathBlockedInterval)
    			pathBlocked = false;
    	}
    	if(!moving){
            if (!target || pathBlocked) {
                if (gameState.frameTime - moveTime > passiveMoveInterval) {
                    this.passiveMove();
                    //maybe look for different target?
                }
            }
            else if (target && combatTools.dist(this.getData(), target.getData()) >= equipment.primary.contents[0][0].range) { //basically dont give mobs ranged weapons until you figure out ranged units walking pattern
            	target.engageInCombat();
                this.astarMove();
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
		// moveQ.findFreeTargetSpot(x, y, target.getData().tx, target.getData().ty);
		moveQ.findPath(x, y, target.getData().tx, target.getData().ty, equipment.primary.contents[0][0].range);
		if(moveQ.timedOut){
			pathBlocked = true;
			pathBlockedTime = gameState.frameTime;
		}
		if(!moveQ.getLength()){ //no valid path
			target = null;
			return;
		}
		if(Math.max(Math.abs(tx -target.getData().tx), Math.abs(ty - target.getData().ty)) > aggroProximity){ //shd be dist???
			var nextMove;
			if(nextMove = moveQ.getMove()){
				this.move(nextMove[0] - x, nextMove[1] - y);
			}
		}
	};
	this.aggroCheck = function() {
			if (!aggressive) return;
			if (!target) { // look for target
					var c = map.getChunk(this.currentChunk.x, this.currentChunk.y);
					var g = c.getNeighbors();
					c = c.getPlayersById();
					for (var i in c) {
							if (this.rangeCheck(c[i])){
								target = c[i];
								target.engageInCombat();
									return;
							}
					}
					for (var i = 0; i < g.length; i++) {
							var players = g[i].getPlayersById();
							for (var j in players) {
									if (this.rangeCheck(players[j])){
										target = players[j];
									target.engageInCombat();
											return;
									}
							}
					}
			} else {
					if (target.isDead() || !target.isVisible()) {
							target = null;
							return;
					}
			}
	};
	this.rangeCheck = function(p) {
		if(!p.isDead() && p.isVisible() && combatTools.dist(this.getData(), p.getData()) < aggroRange && combatTools.calcLineOfSight(this.getData(), p.getData()).isClear){
			return true;
		}
		return false;
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
		if(gameState.frameTime - lastAttack > attackCooldown/attackSpeed && combatTools.dist(this.getData(), target.getData()) < equipment.primary.contents[0][0].range){
			lastAttack = gameState.frameTime;

			var damage = combatTools.calcMobDamage(this, target);
			var damageDealt = target.takeDamage(this, damage);
		}
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
		if(!target){
			target = attacker;
		} else {
			if(Math.random() < retargetChanceOnDamage){ // 5% chance that mob switches on taking damage
				target = attacker;
			}
		}
		var damageTaken = Math.floor(Math.min(damage, healthCur));
		healthCur -= damageTaken;

		var attackerId = attacker.getData()._id;
	    damageInfo[attackerId] = damageInfo[attackerId] || 0;
	    damageInfo[attackerId] += damageTaken;
	    damageInfo.totalDamageTaken += damageTaken;

		if(healthCur <= 0 && !isDead)
			this.die(attacker);
		return damageTaken;
	};
	this.getHealed = function(val) {
		healthCur += Math.min(val, healthMax - healthCur);
	};
	this.periodicEvent = function() { //custom event for mobs

	};
	this.die = function(killer) {
		var am = GAME.getAllMobs(); //glabal var walkaround
		delete am[_id];
		map.mobLeaveChunk(this, this.currentChunk.x, this.currentChunk.y);
		isDead = true;
		target = null;
		this.dropExperience(killer);
		map.freeSpot(tx, ty);
		ENTMAN.createCorpse({x: tx, y: ty, name: name + 'Dead', contents: loot, decayTime: 60000});
		IO.emit('mob-death', {id: _id});
	};
    this.heal = function(val) {
        healthCur += Math.min(val, healthMax - healthCur);
    };
    this.getResurrected = function() {
    	//cant resurrect a mob
    };
}

