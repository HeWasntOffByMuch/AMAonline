var enums = require('./enums.js');
var Player = require('./player.js');
function ExistingPlayer(gameState, socket_id, options){
	Object.assign(options, {gameState}, {socket_id});
	console.log(options)
	Player.call(this, options);
}
ExistingPlayer.prototype = Object.create(Player.prototype);
ExistingPlayer.prototype.constructor = ExistingPlayer;

module.exports = ExistingPlayer;
