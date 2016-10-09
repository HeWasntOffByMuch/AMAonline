var Item = require('./item.js');

Skill.prototype = Object.create(Item.prototype);
Skill.prototype.constructor = Skill;
function Skill(data){
	Item.call(this, data);
	this.desc = data.description;
	this.manaCost = data.mana_cost;
	this.useFunction = data.use_function;
	this.useValue = data.use_value;
	this.range = data.cast_range;
	this.onEquip = data.on_equip;
}
module.exports = Skill;