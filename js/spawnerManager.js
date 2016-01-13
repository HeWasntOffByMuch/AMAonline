// var mob = new Mob(gameState, 1, 41, 32);
//     mob.exposeMap(map);
//     allMobs[1] = mob;
//     mob_data = mob.getData();
//     map.mobEnterChunk(mob, Math.floor(mob_data.x/gameState.chunkSize.x), Math.floor(mob_data.y/gameState.chunkSize.y));

// ideally create spawns after map has loaded its resources
// one time spawners?
// this is not a container for a mob
var logger = require('tracer').colorConsole();
var Mob = require('./mob.js');
function Spawner(id, mob_class, x, y, respawn_time){
	this.x = x;
	this.y = y;

	this.id = id;
	this.spawnDaily = false;
	this.spawnOnce = false;
	this.respawnTime = respawn_time || 10 * 1000;
	this.timeOfDeath = new Date().getTime();
	this.mobConstructor = mob_class;
	this.mob = null;
}



module.exports = function SpawnerManager(gameState, map, allMobs){
	this.allSpawners = []; // don't need no disgusting id's. just a list.
	var currentSpawnerId = 0;
	this.createSpawner = function(mob_class, spawn_x, spawn_y, respawn_time) {
		this.allSpawners.push(new Spawner(this.giveId(), mob_class, spawn_x, spawn_y, respawn_time));
	};
	this.giveId = function() {
		return currentSpawnerId++;
	};
	this.populateSpawners = function() {
		this.createSpawner(Bat, 50, 25, 11000);
		this.createSpawner(Bat, 60, 26, 11000);
		this.createSpawner(Bat, 27, 17, 11000);
		this.createSpawner(Bat, 29, 17, 11000);
		this.createSpawner(Bat, 36, 24, 2000);
		this.createSpawner(Bat, 37, 22, 2000);
	};
	this.update = function() {
		for(var i = 0; i < this.allSpawners.length; i++){
			var s = this.allSpawners[i];
			if(!s.mob && gameState.frameTime - s.timeOfDeath > s.respawnTime){
				allMobs[s.id] = new s.mobConstructor(gameState, s.id, s.x, s.y);
				allMobs[s.id].exposeMap(map);
				s.mob = allMobs[s.id];
				map.mobEnterChunk(allMobs[s.id], allMobs[s.id].currentChunk.x, allMobs[s.id].currentChunk.y);
				// s.mob = new s.mobClass(gameState, id, s.x, s.y);
				// s.mob.exposeMap(map);
				// allMobs[id] = s.mob;
			}
			else if(s.mob && s.mob.isDead){
				s.mob = null;
				s.timeOfDeath = gameState.frameTime;
			}
		}
	};
}
// function Mob(gameState, id, spawn_x, spawn_y, name)

function Bat(gameState, id, spawn_x, spawn_y){
  Mob.call(this, gameState, id, spawn_x, spawn_y, 'Bat', 1000);
  // add setters & getters in mob
}
Bat.prototype = Object.create(Mob.prototype);
Bat.prototype.constructor = Bat;