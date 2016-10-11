var combatDefaults = {
	evasionCap: 0.3,
	evasionDamage: 0,
	parryCap: 0.4,
	parryDamage: 0.4,  // means taking 40% damage
	blockCap: 0.5,
	blockDamage: 0.7
};


module.exports = {
	dist: function(a, b) {
		return Math.sqrt((a.tx-b.tx)*(a.tx-b.tx)+(a.ty-b.ty)*(a.ty-b.ty));
	},
	customDist: function(ax, ay, bx, by) {
		return Math.sqrt((ax-bx)*(ax-bx)+(ay-by)*(ay-by));
	},
	calcPlayerDamage: function(attacker, target) {
		var attackerEq = attacker.getEquipment();
		//limits damage disparity to 1000
		var baseDamage = Math.random() * (attackerEq.primary.contents[0][0].damageMax - attackerEq.primary.contents[0][0].damageMin) + attackerEq.primary.contents[0][0].damageMin;
		var evasionChance = Math.min((target._.evasionRating- attacker._.accuracyRating) / 1000, combatDefaults.evasionCap);
		var parryChance = Math.min((target._.parryRating- attacker._.accuracyRating) / 1000, combatDefaults.parryCap);
		var blockChance = Math.min((target._.blockRating- attacker._.accuracyRating) / 1000, combatDefaults.blockCap);
		// console.log('e', evasionChance, 'p', parryChance, 'b', blockChance);
		var damage = baseDamage * attacker._.damageMod;
        if (Math.random() < evasionChance) {
            damage = Math.round(baseDamage * combatDefaults.evasionDamage);
        } else if (Math.random() < parryChance) {
            damage = Math.round(baseDamage * combatDefaults.parryDamage);
        } else if (Math.random() < blockChance) {
            damage = Math.round(baseDamage * combatDefaults.blockDamage);
        }
        //critical hits
        var critChance = attacker._.critChance;
        var critDamage = attacker._.critDamage;
        if(Math.random() < critChance){
        	damage *= critDamage;
        }

        //target defense
        //add armor efficiency mechanic
        damage -= target._.physicalResistance;

		return (damage>=0)?Math.round(damage):0;
	},
	calcMobDamage: function(attacker, target) {
		var attackerEq = attacker.getEquipment();
		//limits damage disparity to 1000
		var baseDamage = (Math.random()*1000) % (attackerEq.primary.contents[0][0].damageMax - attackerEq.primary.contents[0][0].damageMin) + attackerEq.primary.contents[0][0].damageMin;
		var evasionChance = Math.min((target._.evasionRating- attacker._.accuracyRating) / 1000, combatDefaults.evasionCap);
		var parryChance = Math.min((target._.parryRating- attacker._.accuracyRating) / 1000, combatDefaults.parryCap);
		var blockChance = Math.min((target._.blockRating- attacker._.accuracyRating) / 1000, combatDefaults.blockCap);
		// console.log('e', evasionChance, 'p', parryChance, 'b', blockChance);
		var damage = baseDamage;
        if (Math.random() < evasionChance) {
            damage = Math.round(baseDamage * combatDefaults.evasionDamage);
        } else if (Math.random() < parryChance) {
            damage = Math.round(baseDamage * combatDefaults.parryDamage);
        } else if (Math.random() < blockChance) {
            damage = Math.round(baseDamage * combatDefaults.blockDamage);
        }



        //target defense
        //add armor efficiency mechanic
        damage -= target._.physicalResistance;

		return (damage>=0)?Math.round(damage):0;
	},
	calcLineOfSight: function(a, b) {
		var x1 = a.tx;
		var y1 = a.ty;
		var x2 = b.tx;
		var y2 = b.ty;
		var coordinatesArray = [];
		var dx = Math.abs(x2 - x1);
		var dy = Math.abs(y2 - y1);
		var sx = (x1 < x2) ? 1 : -1;
		var sy = (y1 < y2) ? 1 : -1;
		var err = dx - dy;
		coordinatesArray.push([y1, x1]);
		// Main loop
		while (!((x1 == x2) && (y1 == y2))) {
			var e2 = err << 1;
			if (e2 > -dy) {
				err -= dy;
				x1 += sx;
			}
			if (e2 < dx) {
				err += dx;
				y1 += sy;
			}
			coordinatesArray.push([y1, x1]);
		}
		for(var i=0; i<coordinatesArray.length; i++){
			var y = coordinatesArray[i][0];
			var x = coordinatesArray[i][1];
			if(!MAP.isShotValid(x, y)){
				return {isClear: false, obstacle: {x: x, y:y}};
			}
		}
		return {isClear: true, obstacle: {x: x, y: y}};
	}
}