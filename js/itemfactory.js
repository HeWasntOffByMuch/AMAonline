var Weapon = require('./weapon.js');
var Consumable = require('./consumable.js');
var Armor = require('./armor.js');
var Item = require('./item.js');
var Skill = require('./skill.js');

var db = require('./database.js');

function ItemFactory(){
	this.createWeapon = function(template_num) {
		var data = Object.assign(weaponTemplates[template_num], {
            id: db.newObjectId(),
            quantity: 1
        });
		return new Weapon(data);
	};
	this.createArmor = function(template_num) {
        var data = Object.assign(armorTemplates[template_num], {
            id: db.newObjectId(),
            quantity: 1
        });
		return new Armor(data);
	};
	this.createItem = function(template_num) {
        var data = Object.assign(itemTemplates[template_num], {
            id: db.newObjectId(),
            quantity: 1
        });
        console.log(data)
		return new Consumable(data);
	};
    this.createSkill = function(template_num) {
        var data = Object.assign(skillTemplates[template_num], {
            id: db.newObjectId(),
            quantity: 1
        });
        return new Skill(data);
    };
	this.createCustomItem = function() { // debug only ??

	};
    this.createGold = function() {
        var data = Object.assign({}, {
            id: db.newObjectId(),
            name: 'Gold',
            stackable: true,
            quantity: 1,
            type: 'gold',
            weight: 5
        });
        return new Item(data);
    };
}

module.exports = ItemFactory;

var weaponTemplates = {
  1: {
    name: 'Hunting Knife',
    stackable: false,
    quantity: 1,
    type: 'melee',
    level: 1,
    desc: 'Standard issue knife.',
    damageMin: 1,
    damageMax: 3,
    range: 1.5,
    attackCooldown: 2000,
    weight: 250
  },
  2: {
    name: 'Shortbow',
    stackable: false,
    quantity: 1,
    type: 'ranged',
    level: 1,
    desc: 'Mediocre quality bow made of a stick.',
    damageMin: 3,
    damageMax: 6,
    range: 6,
    attackCooldown: 1600,
    weight: 800
  },
  3: {
    name: 'Epee',
    stackable: false,
    quantity: 1,
    type: 'melee',
    level: 30,
    desc: 'You dare to impugn my honor.',
    damageMin: 18,
    damageMax: 25,
    range: 1.5,
    attackCooldown: 1600,
    weight: 900
  },
  4: {
    name: 'Bread Knife',
    stackable: false,
    quantity: 1,
    type: 'melee',
    level: 1,
    desc: 'Get rekt.',
    damageMin: 4,
    damageMax: 7,
    range: 1.5,
    attackCooldown: 2000,
    weight: 150
  },
  5: {
    name: 'Cleaver',
    stackable: false,
    quantity: 1,
    type: 'melee',
    level: 1,
    desc: 'Get rekt.',
    damageMin: 7,
    damageMax: 11,
    range: 1.5,
    attackCooldown: 2000,
    weight: 750
  },
  6: {
    name: 'Pinaka',
    stackable: false,
    quantity: 1,
    type: 'ranged',
    level: 1,
    desc: 'Arrows from this bow cannot be intercepted.',
    damageMin: 7,
    damageMax: 15,
    range: 7,
    attackCooldown: 2000,
    weight: 1200
  },
  7: {
    name: 'Composite Bow',
    stackable: false,
    quantity: 1,
    type: 'ranged',
    level: 1,
    desc: 'Made of old water closet shack wood.',
    damageMin: 16,
    damageMax: 19,
    range: 16,
    attackCooldown: 2000,
    weight: 600
  },
  8: {
    name: 'Sawed-Off Shotgun',
    stackable: false,
    quantity: 1,
    type: 'ranged',
    level: 1,
    desc: 'Deadly close range weapon.',
    damageMin: 32,
    damageMax: 95,
    range: 4,
    attackCooldown: 3000,
    weight: 950
  },
  9: {
    name: 'Claymore',
    stackable: false,
    quantity: 1,
    type: 'melee',
    rarity: 'legendary',
    level: 30,
    desc: 'You dare to impugn my honor.',
    damageMin: 26,
    damageMax: 49,
    range: 1.5,
    attackCooldown: 2200,
    weight: 1800
  }
}

var armorTemplates = {
	1: {
		name: 'Iron Armor',
		stackable: false,
		quantity: 1,
		type: 'body',
		level: 1,
		defense: 3,
        weight: 2400
	},
    2: {
        name: 'Generic Boots',
        stackable: false,
        quantity: 1,
        type: 'boots',
        level: 1,
        desc: 'Just ordinary boots. Or are they?',
        onEquip: [
            {name: 'speedCur', value: -50}
        ],
        weight: 500
    },
    3: {
        name: 'Generic Shorts',
        stackable: false,
        quantity: 1,
        type: 'legs',
        level: 1,
        defense: 1,
        weight: 800
    },
    4: {
        name: 'Generic Helmet',
        stackable: false,
        quantity: 1,
        type: 'helm',
        level: 1,
        defense: 1,
        weight: 450
    },
    5: {
        name: 'Top Hat',
        stackable: false,
        quantity: 1,
        desc: 'Woosh! Where is he?',
        rarity: 'set',
        type: 'helm',
        level: 1,
        onEquip: [
            {name: 'toggleInvisibility', type: 'function'}
        ],
        weight: 1200
    },
    6: {
        name: 'Leather Armor',
        stackable: false,
        quantity: 1,
        desc: 'Woosh! Where is he?',
        rarity: 'set',
        type: 'body',
        level: 1,
        onEquip: [
            {name: 'physicalResistance', value: 20}
        ],
        weight: 1200
    },
    7: {
        name: 'Divine Shield',
        stackable: false,
        quantity: 1,
        desc: 'Woosh! Where is he?',
        rarity: 'legendary',
        type: 'off-hand',
        level: 1,
        onEquip: [
            {name: 'healingMagic', value: 0.12},
            {name: 'physicalResistance', value: 11}
        ],
        weight: 1200
    },
    8: {
        name: 'Conjuring Wand',
        stackable: false,
        quantity: 1,
        desc: 'Man, thats some nice stick.',
        rarity: 'set',
        type: 'off-hand',
        level: 1,
        onEquip: [
            {name: 'manaMax', value: 2500}
        ],
        weight: 3000
    }
}

var itemTemplates = {
	1: {
		name: 'Potato',
		stackable: false,
		quantity: 1,
		type: 'consumable',
        desc: 'Le Potato',
        usesLeft: 1,
        weight: 180,
        useFunction: 'heal',
        useValue: 15
	},
    2: {
        name: 'Mana Potion',
        stackable: false,
        quantity: 1,
        type: 'consumable',
        weight: 80,
        desc: 'For the soul.',
        usesLeft: 1,
        useFunction: 'giveMana',
        useValue: 200
    },
    3: {
        name: 'Health Potion',
        stackable: false,
        quantity: 1,
        type: 'consumable',
        weight: 80,
        desc: 'For overall well-being',
        usesLeft: 1,
        useFunction: 'heal',
        useValue: 20
    },
    4: {
        name: 'Resurrection Scroll',
        stackable: false,
        quantity: 1,
        type: 'consumable',
        weight: 80,
        desc: "I'm back!",
        usesLeft: 1,
        useFunction: 'resurrect',
        useValue: 0.1
    },
    5: {
        name: 'Heal Stick',
        stackable: false,
        quantity: 1,
        type: 'non-consumable',
        weight: 800,
        desc: "Poke - heal cancer, poke - heal anything",
        usesLeft: 1,
        useFunction: 'heal',
        useValue: 2000
    },
    6: {
        name: 'Shovel',
        stackable: false,
        quantity: 1,
        type: 'non-consumable',
        weight: 800,
        desc: "Poke - heal cancer, poke - heal anything",
        usesLeft: 1,
        useFunction: 'digGround'
    }
};

var skillTemplates = {
    1: {
        name: 'Quick Slashes',
        stackable: false,
        quantity: 1,
        type: 'skill',
        weight: 80,
        desc: "Leash out two striking fast attacks!",
        usesLeft: 1,
        useFunction: 'quickSlashes',
        manaCost: 50,
        range: 1.5
    },
    2: {
        name: 'Passive Damage Amp',
        stackable: false,
        quantity: 1,
        type: 'skill',
        weight: 80,
        desc: "Amplify damage",
        onEquip: [
            {name: 'damageMod', value: 10}
        ],
        range: 1.5
    },
    3: {
        name: 'Healer Boon',
        stackable: false,
        quantity: 1,
        type: 'skill',
        weight: 80,
        desc: "Your healing ability flourishes",
        onEquip: [
            {name: 'healingMagic', value: 2}
        ],
        range: 1.5
    },
    4: {
        name: 'Mistery Box',
        stackable: false,
        quantity: 1,
        type: 'skill',
        weight: 80,
        desc: "You hear strange whispers coming from it.",
        onEquip: [
            {name: 'lifeSteal', value: 0.25}
        ]
    },
    5: {
        name: 'Magic Wave',
        stackable: false,
        quantity: 1,
        type: 'skill',
        weight: 80,
        desc: "Spew magical energy in front of you",
        usesLeft: 1,
        useValue: 45,
        useFunction: 'magicWave',
        manaCost: 5
    },
    6: {
        name: 'Ground Smash',
        stackable: false,
        quantity: 1,
        type: 'skill',
        weight: 80,
        desc: "Shake the ground around you, Skadoosh!",
        usesLeft: 1,
        useValue: 10,
        useFunction: 'groundSmash',
        manaCost: 5
    },
    7: {
        name: 'Fireball',
        stackable: false,
        quantity: 1,
        type: 'skill',
        weight: 80,
        desc: "Throw a blazing turd.",
        usesLeft: 1,
        useValue: 15,
        useFunction: 'fireball',
        manaCost: 2
    },
    8: {
        name: 'Sudden Death',
        stackable: false,
        quantity: 1,
        type: 'skill',
        weight: 80,
        desc: "O żesz chuj.",
        usesLeft: 1,
        useValue: 50000,
        useFunction: 'strongProjectile',
        manaCost: 0
    }
}

