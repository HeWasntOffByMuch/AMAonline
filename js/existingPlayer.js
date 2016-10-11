var enums = require('./enums.js');
var Player = require('./player.js');
function ExistingPlayer(gameState, socketId, options){
	Object.assign(options, {
		gameState,
		socketId,
		lastLogin: new Date()
	});
	Player.call(this, options);
}
ExistingPlayer.prototype = Object.create(Player.prototype);
ExistingPlayer.prototype.constructor = ExistingPlayer;

module.exports = ExistingPlayer;
