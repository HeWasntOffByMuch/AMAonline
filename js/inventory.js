module.exports = Inventory;

// currently not in use. not finished. this makes it so there are
// no unique items and instead they're only id'd by name
function Inventory(_inventory) {
	this.primary = 0;
	this.secondary = 0;
	this.helm = 0;
	this.body = 0;
	this.legs = 0;
	this.boots = 0;
	if(_inventory){
		this.populateFromDb();
	} else {
		this.makeStartingInventory();
	}

	this.populateFromDb = function() {
		this.primary = _inventory.primary ? IFAC.createWeapon(_inventory.primary) : 0;
		this.secondary = _inventory.secondary ? IFAC.createWeapon(_inventory.secondary) : 0;
		this.helm = _inventory.helm ? IFAC.createArmor(_inventory.helm) : 0;
		this.body = _inventory.body ? IFAC.createArmor(_inventory.body) : 0;
		this.legs = _inventory.legs ? IFAC.createArmor(_inventory.legs) : 0;
		this.boots = _inventory.boots ? IFAC.createArmor(_inventory.boots) : 0;
	};
	this.makeStartingInventory = function() {
		this.primary = _inventory.primary ? IFAC.createWeapon(_inventory.primary) : 0;
		this.secondary = _inventory.secondary ? IFAC.createWeapon(_inventory.secondary) : 0;
		this.helm = _inventory.helm ? IFAC.createArmor(_inventory.helm) : 0;
		this.body = _inventory.body ? IFAC.createArmor(_inventory.body) : 0;
		this.legs = _inventory.legs ? IFAC.createArmor(_inventory.legs) : 0;
		this.boots = _inventory.boots ? IFAC.createArmor(_inventory.boots) : 0;
	};
	this.getDataForDb = function() {
		return {
			primary: this.primary.name,
			secondary : this.secondary.name,
			helm: this.helm.name,
			body: this.body.name,
			legs: this.legs.name,
			boots: this.boots.name
		}
	};
}