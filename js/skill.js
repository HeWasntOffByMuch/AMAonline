var Item = require('./item.js');

Skill.prototype = Object.create(Item.prototype);
Skill.prototype.constructor = Skill;
function Skill(id, name, stackable, quantity, type, weight, description, mana_cost, use_function, use_value, cast_range, on_equip){
	Item.call(this, id, name, stackable, quantity, type, weight);
	this.desc = description;
	this.manaCost = mana_cost;
	this.useFunction = use_function;
	this.useValue = use_value;
	this.range = cast_range;
	this.onEquip = on_equip;
}
module.exports = Skill;