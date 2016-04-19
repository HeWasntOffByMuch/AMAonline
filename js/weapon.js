var Item = require('./item.js');

Weapon.prototype = Object.create(Item.prototype);
Weapon.prototype.constructor = Weapon;
function Weapon(id, name, stackable, quantity, type, weight, description, rarity, range, damage_min, damage_max, attack_cooldown, on_equip){
	Item.call(this, id, name, stackable, quantity, type, weight);
	this.desc = description;
	this.rarity = rarity;
	this.range = range;
	this.damageMin = damage_min;
	this.damageMax = damage_max;
	this.attackCooldown = attack_cooldown;
	this.onEquip = on_equip;
}
module.exports = Weapon;