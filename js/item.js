module.exports = Item;

function Item(data){
	// this.id = data.id;
	// this.name = data.name;
	// this.type = data.type;
	// this.weight = data.weight;
	Object.assign(this, data);
	this.stackable = data.stackable || false;
	this.rarity = data.rarity || 'common';
	this.quantity = data.quantity || 1;
}