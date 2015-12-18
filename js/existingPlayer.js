var enums = require('./enums.js');
var Player = require('./player.js');
function existingPlayer(gameState, data){
	Player.call(	this,
			    	gameState,
			    	data.creationDate,
			    	new Date(), //lastLogin
			    	data.timePlayed,
			    	data._id,
			    	data.name,
			    	data.level,
					data.belongsTo,
					data.x,
					data.y,
					data.speedBase,
					data.speedCur
				)

}
existingPlayer.prototype = Object.create(Player.prototype);
existingPlayer.prototype.constructor = existingPlayer;
module.exports = existingPlayer;