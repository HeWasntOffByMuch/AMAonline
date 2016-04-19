var db = require('./database.js');
var containerDefaults = {
    maxStackSize: 100
};

module.exports = function Container(id, size_x, size_y, contents, name, parent_container) {
    this.id = id || db.newObjectId();
    this.name = name || 'backpack';
    this.w = size_x || 4;
    this.h = size_y || 5;
    if (contents)
        this.contents = contents;
    else {
        this.contents = [];
        for (var i = 0; i < this.w; i++) {
            this.contents[i] = [];
            for (var j = 0; j < this.h; j++) {
                this.contents[i][j] = 0;
            }
        }
    }
    this.addItem = function(item, x, y) {
        //item stacking is commented
        // if(!this.contents[x][y]){
            this.contents[x][y] = item;
        // }
        // else { //slot taken
        //     if(this.contents[x][y].name == item.name && item.stackable){
        //         this.stackItems(this.contents[x][y], item);
        //         return;
        //     }
        //     //do nothing
        // }
    };
    this.removeItem = function(x, y) {
        this.contents[x][y] = 0;
    };
    this.stackItemsToMax = function(item1, item2) {
        if(item1.quantity + item2.quantity > containerDefaults.maxStackSize){
            item2.quantity -= containerDefaults.maxStackSize - item1.quantity;
            item1.quantity = containerDefaults.maxStackSize;
        }
    }
    this.isSlotEmpty = function(x, y) {
        return !this.contents[x][y];
    };
}