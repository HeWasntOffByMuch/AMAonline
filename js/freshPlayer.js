var enums = require('./enums.js');
var Player = require('./player.js');

function FreshPlayer(gameState, socket_id, newId, name, acc_user) {
    const options = {
        gameState,
        socket_id,
        creationDate: new Date(),
        lastlogin: new Date(),
        time_played: 0,
        id: newId,
        name,
        level: 1,
        belongs_to: acc_user
    };
    Player.call(this, options);
}
FreshPlayer.prototype = Object.create(Player.prototype);
FreshPlayer.prototype.constructor = FreshPlayer;
module.exports = FreshPlayer;
