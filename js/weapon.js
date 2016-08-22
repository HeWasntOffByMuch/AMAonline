var Item = require('./item.js');

Weapon.prototype = Object.create(Item.prototype);
Weapon.prototype.constructor = Weapon;
function Weapon(data){
	Item.call(this, data);
	this.desc = data.desc;
	this.rarity = data.rarity;
	this.range = data.range;
	this.damageMin = data.damageMin;
	this.damageMax = data.damageMax;
	this.attackCooldown = data.attackCooldown;
	this.onEquip = data.onEquip;
}
module.exports = Weapon;
