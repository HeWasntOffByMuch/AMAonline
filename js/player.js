var logger = require('tracer').colorConsole();
var enums = require('./enums.js');
var Container = require('./container.js');
var combatTools = require('./combat.js')
var expTools = require('./exp.js');
var MovementQueue = function(){
    var currentPath = [];
    this.getMove = function(){
        return currentPath.shift();
    };
    this.queueMove = function(x, y){
        currentPath.push([x, y]);
    };
    this.getLength = function(){
        return currentPath.length;
    };
    this.clearQueue = function(){
        currentPath = [];
    };
};
module.exports = function Player(gameState, socket_id, creationDate, lastlogin, time_played, id, name, level, belongs_to, spawn_x, spawn_y, speed_base, speed_cur, health_cur, health_max, level, experience) {
    var map;
    this.exposeMap = function(m) {
        map = m;
        map.occupySpot(tx, ty);
    };
    var _id = id;
    var sId = socket_id || null;
    name = name;
    var type = enums.objType.PLAYER;
    level = level || 1;
    var lastLogin = lastlogin || new Date();
    creationDate = creationDate || new Date();
    var belongsTo = belongs_to;
    var timePlayed = time_played || 0; //only saves if u log out properly.


    //unsafe defaults
    var x = spawn_x || 32;
    var y = spawn_y || 24;
    var tx = x || 32;
    var ty = y || 24;
    this.currentChunk = {x: Math.floor(x/gameState.chunkSize.x), y: Math.floor(y/gameState.chunkSize.y)};
    var moveQ = new MovementQueue();
	var moveTime = false;
	var moving = false;
    var nextMove = false;
	//All RPG variables
	var speedBase = speed_base || 200; //for readability, this should represent moving time in ms. figure it out.
	var speedCur = speed_cur || 200;

    //attacking and HP
    var isDead = false;
    var healthMax = health_max || 100;
    var healthCur = health_cur || healthMax;
    var lastAttack = gameState.frameTime;
    var attackCooldown = 400;
    var attackSpeed = 1;

    //levels and EXP
    var level = level || 1;
    var experience = experience || 0;
    var equipment = {
        primary: {type: 'sword', range: 1.5, damageMin: 15, damageMax: 30},
        secondary: 0,
        body: 0,
        legs: 0,
        boots: 0,
        head: 0,
        backpack: new Container()
    };
    this.getData = function(value) { //this is also all the stuff that gets saved into and pulled from db
        return {
            _id: _id,
            name: name,
            type: type,
            level: level,
            lastLogin: lastLogin,
            creationDate: creationDate,
            belongsTo: belongsTo,
            timePlayed: timePlayed,
            x: x,
            y: y,
            tx: tx,
            ty: ty,
            speedBase: speedBase,
            speedCur: speedCur,
            healthCur: healthCur,
            healthMax: healthMax,
            level: level,
            experience: experience
        };
    };
    this.getEquipment = function() {
        return equipment;
    };
    this.update = function() {
    	if(moveTime){
    		if(gameState.frameTime - moveTime > speedCur){
    			//time to stop moving
    			moving = false;
    			moveTime = false;
                x = tx;
                y = ty;
    		}
    	}
        if(!moving){
            nextMove = moveQ.getMove();
            if(nextMove && map.isValid(nextMove[0], nextMove[1])){
                this.move(nextMove[0], nextMove[1]);
                //chunk tracking. maybe consider moving this to a separate function.
                var cx = Math.floor(tx/gameState.chunkSize.x);
                var cy = Math.floor(ty/gameState.chunkSize.y);
                if(this.currentChunk.x != cx || this.currentChunk.y != cy){
                    console.log('chunk change');
                    map.playerLeaveChunk(sId, this, this.currentChunk.x, this.currentChunk.y);
                    map.playerEnterChunk(sId, this, cx, cy);
                    this.currentChunk.x = cx;
                    this.currentChunk.y = cy;
                }
            }
    	}
    };
    this.queueMove = function(dx, dy) {
        if(map.isValid(tx+dx, ty+dy)){
            moveQ.queueMove(tx  + dx, ty + dy);
        }
    	
    };
    this.move = function(move_x, move_y) {
        moveTime = gameState.frameTime;
        map.freeSpot(tx, ty);
        tx = move_x;
        ty = move_y;
        map.occupySpot(tx, ty);
        moving = true;
    };
    this.attack = function(target) {
        if(!isDead){
            if(gameState.frameTime - lastAttack > attackCooldown/attackSpeed && combatTools.dist(this.getData(), target.getData()) < equipment.primary.range){
                lastAttack = gameState.frameTime;

                if(equipment.primary.type == 'bow'){
                    // do bow stuff and possibly return here i fline of sight is broken
                }
                var damage = combatTools.calcDamage(this, target);
                var damageDealt = target.takeDamage(this, damage); //this is for further use in lifesteal etc
            }
        }
    };
    this.takeDamage = function() {

    };
    this.die = function() {
        //lose xp?
        //health to 100%
        //set spawn
        //

    };
    this.gainExperience = function(gained_exp) {
        experience += gained_exp;
        while(experience >= expTools.getLevelExp(level + 1))
            this.levelUp();
    };
    this.levelUp = function() {
        level++;
        logger.log('LEVEL UP ! player xp=', experience, "level=", level);
    };
    this.addTimePlayed = function(logoutTime) { //invoked on logout
    	timePlayed += logoutTime-lastLogin;
    };
};