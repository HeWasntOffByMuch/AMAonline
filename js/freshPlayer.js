var enums = require('./enums.js');
var Player = require('./player.js');
function freshPlayer(gameState, socket_id, newId, name, acc_user){
	Player.call(this, gameState, socket_id, new Date(), new Date(), 0, newId, name, 1, acc_user);
}
freshPlayer.prototype = Object.create(Player.prototype);
freshPlayer.prototype.constructor = freshPlayer;
module.exports = freshPlayer;