var enums = require('./enums.js')

module.exports = function Player(gameState, creationDate, lastlogin, time_played, id, name, level, belongs_to, x, y, speed_base, speed_cur) {
    var map;
    this.exposeMap = function(m) {
        map = m;
    };

    var _id = id;
    var name = name;
    var type = enums.objType.PLAYER;
    var level = level || 1;
    var lastLogin = lastlogin || new Date();
    var creationDate = creationDate || new Date();
    var belongsTo = belongs_to;
    var timePlayed = time_played || 0; //only saves if u log out properly.


    //unsafe defaults
    var x = x || 32;
    var y = y || 24;
    var tx = x || 32;
    var ty = y || 24;
    this.currentChunk = {x: Math.floor(x/gameState.chunkSize.x), y: Math.floor(y/gameState.chunkSize.y)}

	var moveTime = false;
	var moving = false;

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
    }
    this.move = function(dx, dy, sId) {
    	if(!moving && map.isValid(x+dx, y+dy)){
    		moveTime = gameState.frameTime;
    		tx += dx;
    		ty += dy;
    		moving = true;
            //chunk tracking
            var cx = Math.floor(tx/gameState.chunkSize.x);
            var cy = Math.floor(ty/gameState.chunkSize.y);
            if(this.currentChunk.x != cx || this.currentChunk.y != cy){
                console.log('chunk change')
                map.playerLeaveChunk(sId, this, this.currentChunk.x, this.currentChunk.y)
                map.playerEnterChunk(sId, this, cx, cy);
                this.currentChunk.x = cx;
                this.currentChunk.y = cy;
            }

    	}
    }
    this.addTimePlayed = function(logoutTime) { //invoked on logout
    	timePlayed += logoutTime-lastLogin;
    };
}