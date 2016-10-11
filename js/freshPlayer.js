var enums = require('./enums.js');
var Player = require('./player.js');

function FreshPlayer(options) {
    Object.assign(options, {
        creationDate: new Date(),
        lastLogin: new Date(),
        timePlayed: 0,
        level: 1
    });

    Player.call(this, options);
}
FreshPlayer.prototype = Object.create(Player.prototype);
FreshPlayer.prototype.constructor = FreshPlayer;
module.exports = FreshPlayer;
