var Item = require('./item.js');

Consumable.prototype = Object.create(Item.prototype);
Consumable.prototype.constructor = Consumable;
function Consumable(data){
	Item.call(this, data);
	this.desc = data.desc;
	this.useFunction = data.useFunction;
	this.useValue = data.useValue;
}
module.exports = Consumable;