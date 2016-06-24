GAME.animationFunctions = {
	groundSmash: (data) => { // ring around origin
		var x = data.x;
		var y = data.y;
        for(var i = x - 1; i <= x + 1; i++){
        	for(var j = y - 1; j <= y + 1; j++){
        		if(x === i && y === j) continue;
            	GAME.anims.push(new ShortAnimation(i, j, 'Red Magic Blast Short', {speed: 50}));
        	}
        }
	},
	magicWave: (data) => {
		var x = data.x;
		var y = data.y;
		for (var i = x - 5; i < x + 6; i++) {
			if(x === i) continue;
			GAME.anims.push(new ShortAnimation(i, y, 'Red Magic Blast Short', {speed: 50}));
		}
		for (var j = y - 5; j < y + 6; j++) {
			if(y === j) continue;
			GAME.anims.push(new ShortAnimation(x, j, 'Red Magic Blast Short', {speed: 50}));
		}
	},
	healUnit: (data) => {
		var x = data.x;
		var y = data.y;
		GAME.anims.push(new ShortAnimation(x, y, 'Heal Animation', {speed: 20}));
	},
	fireball: (data) => {
		var origin_x = data.x;
		var origin_y = data.y;
		var target_x = data.tx;
		var target_y = data.ty;
		var type_ammo = 'Fireball Projectile';
		var type_hit = 'Fireball Explosion';
		GAME.anims.push( new ProjectileAnimation(origin_x, origin_y, target_x, target_y, type_ammo, type_hit));
	},
	strongProjectile: (data) => {
		var origin_x = data.x;
		var origin_y = data.y;
		var target_x = data.tx;
		var target_y = data.ty;
		var type_ammo = 'SD Projectile';
		var type_hit = 'SD Explosion';
		options = {
			projectileSpeed: 120,
			animationSpeed: 80
		}
		GAME.anims.push( new ProjectileAnimation(origin_x, origin_y, target_x, target_y, type_ammo, type_hit, options));
	}
}