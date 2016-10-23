var Item = require('./item.js');

Armor.prototype = Object.create(Item.prototype);
Armor.prototype.constructor = Armor;
function Armor(data){
	Item.call(this, data);
	this.desc = data.desc;
	this.onEquip = data.onEquip;
}
module.exports = Armor;