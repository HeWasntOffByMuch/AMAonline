var Item = require('./item.js');

Skill.prototype = Object.create(Item.prototype);
Skill.prototype.constructor = Skill;
function Skill(data){
	Item.call(this, data);
	this.desc = data.desc;
	this.manaCost = data.manaCost;
	this.useFunction = data.useFunction;
	this.useValue = data.useValue;
	this.range = data.range;
	this.onEquip = data.onEquip;
}
module.exports = Skill;