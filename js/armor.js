var Item = require('./item.js');

Armor.prototype = Object.create(Item.prototype);
Armor.prototype.constructor = Armor;
function Armor(id, name, stackable, quantity, type, weight, description, rarity, onEquip){
	Item.call(this, id, name, stackable, quantity, type, weight);
	this.desc = description;
	this.rarity = rarity;
	this.onEquip = onEquip;
}
module.exports = Armor;