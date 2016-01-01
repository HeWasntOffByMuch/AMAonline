var enums = require('./enums.js');
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
module.exports = function Player(gameState, creationDate, lastlogin, time_played, id, name, level, belongs_to, x, y, speed_base, speed_cur) {
    var map;
    this.exposeMap = function(m) {
        map = m;
    };

    var _id = id;
    name = name;
    var type = enums.objType.PLAYER;
    level = level || 1;
    var lastLogin = lastlogin || new Date();
    creationDate = creationDate || new Date();
    var belongsTo = belongs_to;
    var timePlayed = time_played || 0; //only saves if u log out properly.


    //unsafe defaults
    x = x || 32;
    y = y || 24;
    var tx = x || 32;
    var ty = y || 24;
    this.currentChunk = {x: Math.floor(x/gameState.chunkSize.x), y: Math.floor(y/gameState.chunkSize.y)};
    var moveQ = new MovementQueue();
	var moveTime = false;
	var moving = false;
    var nextMove = false;
	//All RPG variables
	var speedBase = speed_base || 400; //for readability, this should represent moving time in ms. figure it out.
	var speedCur = speed_cur || 400;
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
            speedCur: speedCur
        };
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
                moveTime = gameState.frameTime;
                tx += nextMove[0];
                ty += nextMove[1];
                moving = true;
                //chunk tracking
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
    this.move = function(dx, dy, sId) {
        if(map.isValid(x+dx, y+dy)){
            moveQ.queueMove(dx, dy);
        }
    	
    };
    this.addTimePlayed = function(logoutTime) { //invoked on logout
    	timePlayed += logoutTime-lastLogin;
    };
};