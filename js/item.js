module.exports = Item;

function Item(data){
	this.id = data.id;
	this.name = data.name;
	this.stackable = data.stackable;
	this.quantity = data.quantity;
	this.rarity = data.rarity || 'common';
	this.type = data.type;
	this.weight = data.weight;
}