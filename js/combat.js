module.exports = {
		calcLineOfSight: function(x1, y1, x2, y2) {
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
			if(map.world[x][y] >= 1) return {isClear: false, obstacle: {x: x, y:y}};
		}
		return {isClear: true, obstacle: {x: x, y: y}};
	},
	dist: function(a, b) {
		return Math.sqrt((a.tx-b.tx)*(a.tx-b.tx)+(a.ty-b.ty)*(a.ty-b.ty));
	},
	calcDamage: function(attacker, target) {
		attackerEq = attacker.getEquipment();
		damage = (Math.random()*100) % (attackerEq.primary.damageMax - attackerEq.primary.damageMin) + attackerEq.primary.damageMin;
		return (damage>=0)?Math.round(damage):0;
	}
}