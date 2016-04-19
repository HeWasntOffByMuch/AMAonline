var lootDefaults = {
	globalLuck: 1
};

module.exports = {
	rollForLoot: function(possible_loot){
		var loot = {};
		var itemsAdded = 0;
		for(var i in possible_loot) {
			if(Math.random() < possible_loot[i].dropChance * lootDefaults.globalLuck){
				loot[itemsAdded] = possible_loot[i].item;
				if(possible_loot[i].maxQuantity){
					var quantityRoll = Math.floor(Math.random() * possible_loot[i].maxQuantity);
					loot[itemsAdded].quantity = quantityRoll;
					loot[itemsAdded].weight *= quantityRoll;
				}
				itemsAdded++;

			}
		}
		return loot;
	}
};