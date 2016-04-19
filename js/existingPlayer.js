var enums = require('./enums.js');
var Player = require('./player.js');
function existingPlayer(gameState, socket_id, data){
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
					data.manaCur,
					data.manaMax,
					data.level,
					data.experience,
					data.equipment,
					data.skillTree,
					data.accuracyRating,
					data.evasionRating,
					data.parryRating,
					data.blockRating
				)

}
existingPlayer.prototype = Object.create(Player.prototype);
existingPlayer.prototype.constructor = existingPlayer;

module.exports = existingPlayer;