var Item = require('./item.js');

Consumable.prototype = Object.create(Item.prototype);
Consumable.prototype.constructor = Consumable;
function Consumable(id, name, stackable, quantity, type, weight, description, uses_left, use_function, use_value){
	Item.call(this, id, name, stackable, quantity, type, weight);
	this.desc = description;
	this.usesLeft = uses_left;
	this.useFunction = use_function;
	this.useValue = use_value;
}
module.exports = Consumable;