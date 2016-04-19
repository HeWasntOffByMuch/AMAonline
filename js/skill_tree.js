module.exports = playerTreeProgression;

var treeDefaults = {
	skillLevelCap: 20
};

function playerTreeProgression(data) {
	var unusedSkillPoints;
	var usedSkillPoints;
	var tree;
	if(data){
		unusedSkillPoints = data.unusedSkillPoints;
		usedSkillPoints = data.usedSkillPoints;
		tree = data.tree;
	}
	else {
		unusedSkillPoints = 0;
		usedSkillPoints = 0;
		tree = new Tree();
	}
	this.addSkillPoint = function() {
		unusedSkillPoints++;
	};
	this.spendSkillPoint = function(branch, skill_name){
		tree[branch][skill_name] ++;
		unusedSkillPoints --;
		usedSkillPoints ++;
	}
	this.canSpendSkillPoint = function(branch, skill_name) {
		if(hasUnusedSkillPoints() && isViableForSpending(branch, skill_name)){
			return true;
		}
		else {
			return false;
		}
	};
	this.checkTreeIntegrity = function() { // finish and use on login to report broken players
		var count = getSpentPointsCount();
		if(count === usedSkillPoints){
			return true;
		}
		else {

		}
	};
	this.getSkillLevel = function(branch, skill_name) {
		return tree[branch][skill_name]
	};
	function getSpentPointsCount() {
		var count = 0;
		for(var branch in tree){
			for(var skill in branch){
				count += tree[branch][skill];
			}
		}
		return count;
	}
	function hasUnusedSkillPoints() {
		if(unusedSkillPoints > 0){
			return true;
		}
		else{
			return false;
		}
	}
	function isViableForSpending(branch, skill_name) {
		if(tree[branch].hasOwnProperty(skill_name) && tree[branch][skill_name] < treeDefaults.skillLevelCap){
			return true;
		}
		else{
			return false;
		}
	}
	this.getAssociatedStats = function(branch, skill_name) {
		return skillToStatisticTable[branch][skill_name];
	};


	this.getDataForDatabase = function() {
		return {
			unusedSkillPoints: unusedSkillPoints,
			usedSkillPoints: usedSkillPoints,
			tree: tree
		};
	};
	this.getDataForClient = function() {
		return {
			unusedSkillPoints: unusedSkillPoints,
			tree: tree
		};
	};
}

function Tree() {
	this.intelligence = {
		offensiveCurses: 0,
		offensiveInstant: 0,
		healingMagic: 0,
		protectionMagic: 0,
		supportiveBuffs: 0,
		supportiveUtility: 0,
		manaPool: 0
	};
	this.strength = {
		attackDamage: 0,
		blocking: 0,
		useHeavyWeapons: 0
	};
	this.agility = {
		accuracy: 0,
		armorEfficiency: 0,
		attackSpeed: 0,
		criticalHits: 0,
		dualWielding: 0,
		evasion: 0,
		parry: 0,
		rangedCombat: 0
	};
	this.physique = {
		physicalResistance: 0,
		magicResistance: 0,
		weightCapacity: 0,
		healthPool: 0
	};
}

skillToStatisticTable = {
	intelligence: {
		offensiveCurses: {

		},
		offensiveInstant: {
			offensiveInstant: 0.1
		},
		healingMagic: {
			healingMagic: 0.1
		},
		protectionMagic: {

		},
		supportiveBuffs: {

		},
		supportiveUtility: {

		},
		manaPool: {
			manaMax: 10
		}
	},
	strength: {
		attackDamage: {
			damageMod: 0.05
		},
		blocking: {
			blockRating: 30
		},
		useHeavyWeapons: {

		}
	},
	agility: {
		accuracy: {
			accuracyRating: 30
		},
		armorEfficiency: {

		},
		attackSpeed: {
			attackSpeed: 0.05
		},
		criticalHits: {
			critChance: 0.0125,
			critDamage: 0.05
		},
		dualWielding: {

		},
		evasion: {
			evasionRating: 30
		},
		parry: {
			parryRating: 30
		},
		rangedCombat: {

		}
	},
	physique: {
		physicalResistance: {

		},
		magicResistance: {

		},
		weightCapacity: {

		},
		healthPool: {
			maxHealth: 10
		}
	}
};