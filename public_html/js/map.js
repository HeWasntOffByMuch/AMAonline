var tilesSprite = GAME.allImages['base_tiles'];

function Map(x, y, gameState){
	var gh = gameState.tileSize;
	var chunkSize = gameState.chunkSize || {x: 32, y: 16};
	var mapForeground = []; // inverted coordinates y is x, x is y.
	for(var i=0; i<gameState.mapSize.x; i++){ //get map size from server later
		mapForeground[i] = [];
	}
	var mapCollisions = [];
	for(var i=0; i<gameState.mapSize.x; i++){ //get map size from server later
		mapCollisions[i] = [];
	}
	f = $('.foreground')[0];
	this.chunksLoaded = [];
	this.x = x;
	this.y = y;
	this.appendTiles = function() { //can't call this without a player. deprecated.
		var x = this.x;
		var y = this.y;
		console.log(x, y)
		for(var i = -2; i < 34; i++){
			for(var j = -2; j < 18; j++){
				var sprite = mapForeground[y - 8 + j][x-16+i];
				if(sprite === 0) continue;
				new Tile(null, i, j, sprite -1);
			}
		}
	};
	this.update = function(player) {
		this.x = GAME.player.x + GAME.player.ax;
		this.y = GAME.player.y + GAME.player.ay;
	};
	this.draw = function(ctx) {
		for(var i = -1; i < 33; i++){
			for(var j = -1; j < 17; j++){
				var sprite = mapForeground[GAME.player.x - 16 + i][GAME.player.y - 8 + j];
				// if(sprite == 0) continue; //if not many empty spaces on the map are used this is practically useless;
				if(sprite !=0) sprite--; //adjust sprite position
				var x_pos = (sprite % tilesSprite.tilesW);
				var y_pos = (Math.floor(sprite / tilesSprite.tilesW) % tilesSprite.tilesH);
				var ax = GAME.player.ax;
				var ay = GAME.player.ay;
				ctx.drawImage(tilesSprite, x_pos*32, y_pos*32, 32, 32, Math.floor((i-ax)*32), Math.floor((j-ay)*32), 32, 32);

				// DRAW COLLIDING TILES GRAYISH
				// if(mapCollisions[GAME.player.x - 16 + i][GAME.player.y - 8 + j] === 0.5){
				// 	ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
				// 	ctx.fillRect(Math.floor((i-ax)*32), Math.floor((j-ay)*32), 32, 32);
				// }
				// else if(mapCollisions[GAME.player.x - 16 + i][GAME.player.y - 8 + j] === 1){
				// 	ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
				// 	ctx.fillRect(Math.floor((i-ax)*32), Math.floor((j-ay)*32), 32, 32);
				// }
			}
		}
	};
	this.populateTiles = function(map_data) {
		for(var k=0; k < map_data.length; k++){
			var map_part = map_data[k];
			var x = map_part.pos.x;
			var y = map_part.pos.y;
			this.chunksLoaded.push([x, y]);
			var w = chunkSize.x;
			var h = chunkSize.y;
			// console.log('populating tiles for chunk', x, y, w, h);
			for(var i = 0; i < map_part.tile_data.length; i++){
				for(var j = 0; j < map_part.tile_data[i].length; j++){
					mapForeground[x*w + i][y*h + j] = map_part.tile_data[i][j];
				}
			}
			// console.log('loaded chunk ', x, y);
		}
	};
	this.populateCollisions = function(map) {
		for(var k=0; k<map.length; k++){
			var map_part = map[k];
			var x = map_part.pos.x;
			var y = map_part.pos.y;
			var w = chunkSize.x;
			var h = chunkSize.y;
			for(var i=0; i<map_part.col_data.length; i++){//initialise map_partForeground somehow
				for(var j=0; j<map_part.col_data[i].length; j++){
					mapCollisions[x*w + i][y*h + j] = map_part.col_data[i][j];
				}
			}
		}
	};
	this.getForeground = function() {
		return mapForeground;
	};
	this.getCollisions = function() {
		return mapCollisions;
	};
	this.occupySpot = function(x, y) {
		mapCollisions[x][y] = 0.5;
	};
	this.freeSpot = function(x, y) {
		mapCollisions[x][y] = 0;
	};
	this.isValid = function(x, y) {
    	if(mapCollisions[x][y] < 0.5)
    		return true;
    	else
    		return false;
    }
    this.isShotValid = function(x, y) { //used in calcLineOfSight
        if(mapCollisions[x][y] < 1)
            return true;
        else
            return false;
            
    };
}