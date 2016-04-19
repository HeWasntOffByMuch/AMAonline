module.exports = Item;

function Item(id, name, stackable, quantity, type, weight){
  this.id = id;
  this.name = name;
  this.stackable = stackable;
  this.quantity = quantity;
  this.type = type;
  this.weight = weight;
}