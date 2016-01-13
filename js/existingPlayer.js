var enums = require('./enums.js');
var Player = require('./player.js');
function existingPlayer(gameState, socket_id, data){
	console.log('data from db=', data)
	Player.call(	this,
			    	gameState,
					socket_id,
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
					data.speedCur,
					data.healthCur,
					data.healthMax,
					data.level,
					data.experience
				)

}
existingPlayer.prototype = Object.create(Player.prototype);
existingPlayer.prototype.constructor = existingPlayer;
module.exports = existingPlayer;