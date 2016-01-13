module.exports = function Container(size_x, size_y, name, parent_container){
  this.name = name || 'container';
  this.w = size_x || 4;
  this.h = size_y || 5;
  this.contents = [];
  for(var i=0; i<this.w; i++){
    this.contents[i] = [];
    for(var j=0; j<this.h; j++){
      this.contents[i][j] = 0;
    }
  }
  this.addItem = function(item, position){
    console.time('dicks: ')
    if(position == -1  || !item) return;
    var position = position || [0, 0];
    var s = this.contents[position[0]][position[1]];
    if(s){//if slot is taken
      if(s.name == item.name && s.stackable){
        this.stackItems(s, item);
        return;
      }
      position = this.getFirstEmptySlot();
    }
    if(position == -1) return;
    this.contents[position[0]][position[1]] = item;
    console.timeEnd('dicks: ');
  }

  this.getFirstEmptySlot = function(){
    for(var i=0; i<this.h; i++){
      for(var j=0; j<this.w; j++){
        if(!this.contents[j][i])
          return [j, i];
      }
    }
    return (-1);
  }
  this.stackItems = function(item1, item2){
    item1.quantity += item2.quantity;
  }
}