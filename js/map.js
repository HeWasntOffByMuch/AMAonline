function Chunk(x, y, w, h){
	var x = x;
	var y = y;
	var w = w || 32;
	var h = h || 16;
	var playersBySocket = {}; //players by socket.id
	var playersById = {}; //those are socket ids
	var mobsInside = {};
	var neighboringChunks; // -CPU +memory // typeof array
	var chunkForeground = [];
	var chunkCollisions = [];

	//vars for a 2 step process to turn off chunks.
	var live = false;
	var marked = false; //marked for sleep
    this.isMarked = function() {
    	return marked;
    };
    this.toggleStateMarker = function(m) {
    	if(m === undefined)
    		marked = !marked;
    	else
    		marked = m;
    };
	this.toggleState = function(state) { //toggles state with an optional argument to set state.
		if(state === undefined)
			live = !live;
		else
			live = state;
	};
	this.isLive = function() {
		return live;
	};
    this.getPosition = function() { //gets data u prick.
        return {
            x: x,
            y: y
        }
    };
    this.getPlayersById = function() {
    	return playersById;
    };
    this.getPlayersBySocket = function() {
    	return playersBySocket;
    };
    this.getChunkForeground = function() {
    	return chunkForeground;
    };
    this.getChunkCollisions = function() {
    	return chunkCollisions;
    };
    this.passNeighbors = function(n) {
    	neighboringChunks = n;
    };
    this.areNeighborsEmpty = function() {
    	for(var i in neighboringChunks){
    		if(!neighboringChunks[i].isEmpty())
    			return false;
    	}
    	return true;
    };
    this.getNeighbors = function() {
    	return neighboringChunks;
    };
	this.playerEnter = function(sId, player) {
			// console.log(playersBySocket);
		if(!playersBySocket.hasOwnProperty(sId)){
			playersBySocket[sId] = player;
			playersById[player.getData()._id] = sId;
			console.log('player enters chunk', x, y, 'with neighbors count:', this.getNeighbors().length);
			var map_data = {};
			map_data.tiles = [];
			map_data.tiles.push({pos: {x: x, y: y}, tile_data: chunkForeground, col_data: chunkCollisions});
			for(var i=0; i<neighboringChunks.length; i++){
				map_data.tiles.push({pos: neighboringChunks[i].getPosition(), tile_data: neighboringChunks[i].getChunkForeground(), col_data: neighboringChunks[i].getChunkCollisions()})
			}
			io.to(sId).emit('map-update', map_data);
		}
		else
			console.log('player already there');
	};
	this.playerLeave = function(sId, player) {
			// console.log(playersBySocket);
		if(playersBySocket.hasOwnProperty(sId)){
			delete playersBySocket[sId];
			delete playersById[player.getData()._id];
			console.log('player leaves chunk');
		}
		else
			console.log('that player is not there');
	};
	this.isEmpty = function() {
		if(Object.keys(playersBySocket).length == 0)
			return true;
		else
			return false;
	};
	this.update = function() {

	};
	this.assignChunkTiles = function(source) { //every chunk has tiledata ready to send
		for(var i=0; i<w; i++){
			chunkForeground[i] = [];
			for(var j=0; j<h; j++){
				chunkForeground[i][j] = source[w*x + i][h*y + j];
			}
		}
	};
	this.assignChunkCollisions = function(source) { //every chunk has tiledata ready to send
		for(var i=0; i<w; i++){
			chunkCollisions[i] = [];
			for(var j=0; j<h; j++){
				chunkCollisions[i][j] = source[w*x + i][h*y + j];
			}
		}
	};
}


function loadCollisions(fs, mapDetails, callback) {
	var gh = mapDetails.tileSize;
    var collisions = [];
    for (var i = 0; i < mapDetails.size.x; i++) {
        collisions[i] = [];
        for (var j = 0; j < mapDetails.size.y; j++) {
            collisions[i][j] = 0;
        }
    }
    fs.readFile('map/map.json', 'utf-8', function(err, data) {
        if (err) callback(err, null);
        data = eval("(" + data + ")");
    	data = data.layers[4];
        var x, y, h, w, i, j, count=0;
        for (var o in data.objects) {
            h = Math.round(data.objects[o].height / gh);
            w = Math.round(data.objects[o].width / gh);
            x = Math.round(data.objects[o].x / gh);
            y = Math.round(data.objects[o].y / gh);
            for (i = x; i < (x + w); i++) {
                for (j = y; j < (y + h); j++) {
                    collisions[i][j] = 1;
                    count++
                }
            }
        }
        callback(null, collisions, count);
    });
}
function loadTiles(fs, gh, callback) {
    fs.readFile('map/map.json', 'utf-8', function(err, data) {
    	if(err) callback(err);
    	data = eval("(" + data + ")");
    	var foreground = [];
    	var count = 0; //non empty tiles
    	for(var i=0; i< data.layers[1].width; i++){
    		foreground[i] = [];
    		for(var j=0; j<data.layers[1].height; j++){
    			foreground[i][j] = data.layers[1].data[i*data.layers[1].width + j];
    			if(foreground[i][j] != 0)
    				count++;
    		}
    	}
    	callback(null, foreground, count);
    });
}
function generateChunks(map_size, chunk_size, callback){
	var gridWidth = Math.floor(map_size.x/chunk_size.x);
	var gridHeight = Math.floor(map_size.y/chunk_size.y);
	console.log('chunks', gridWidth, 'by',gridHeight);
	var chunks = [], count=0;
	for(var i=0; i<gridWidth; i++){
		chunks[i] = [];
		for(var j=0; j<gridHeight; j++){
			chunks[i][j] = new Chunk(i, j, chunk_size.x, chunk_size.y);
			count++
		}
	}
	callback(count, chunks);
}

var io;
var collisions;
var foreground;

module.exports = function Map(fs, gameState){
    var mapDetails = {
        size: {
            x: gameState.mapSize.x || 96,
            y: gameState.mapSize.y || 96
        },
        tileSize: 32,
        chunkSize: gameState.chunkSize,
        liveChunks: 0,
        lastChunkCheck: new Date().getTime()
    }
    var chunks = false;
    loadCollisions(fs, mapDetails, function(err, data, count) {
    	if(err){
    		console.log('collision loading failed.')
    	}
    	else{
    		collisions = data;
    		// collisions.shift(); //somehow first element is shit, or is it?
    		console.log(count + " map collisions loaded kinda");
    		for(var i=0; i<chunks.length; i++){
    			for(var j=0; j<chunks[0].length; j++){
    				chunks[i][j].assignChunkCollisions(collisions);
    			}
    		}
    	}
    });
    loadTiles(fs, mapDetails.tileSize, function(err, data, count) {
    	if(err) {
    		console.log(err)
    	}
    	else{
    		foreground = data;
    		console.log(count + " map tiles loaded kinda");
    		for(var i=0; i<chunks.length; i++){
    			for(var j=0; j<chunks[0].length; j++){
    				chunks[i][j].assignChunkTiles(foreground);
    			}
    		}
    	}
    });

    
    var getNeighboringChunks = function(chunk) {
    	var x = chunk.getPosition().x;
    	var y = chunk.getPosition().y;
    	var arr = [];
    	for(var i = x-1; i <= x+1; i++){
    		for(var j = y-1; j <= y+1; j++){
    			if(i < 0 || j < 0 || i > chunks.length-1 || j > chunks[0].length-1 || chunks[i][j] === chunk)
    				continue;
    			arr.push(chunks[i][j]);
    		}
    	}
    	return arr;
    };
    var areNeighborsEmpty = function(chunk) {  //deprecated?
    	var x = chunk.getPosition().x;
    	var y = chunk.getPosition().y;
    	for(var i = x-1; i <= x+1; i++){
    		for(var j = y-1; j <= y+1; j++){
    			if(i < 0 || j < 0 || i > chunks.length-1 || j > chunks[0].length-1)
    				continue;
    			if(!chunks[i][j].isEmpty()){
    				return false;
    			}
    		}
    	}
    	return true;
    };

    generateChunks(mapDetails.size, mapDetails.chunkSize, function(count, data) {
		chunks = data;
		for(var i=0; i<chunks.length; i++){
			for(var j=0; j<chunks[i].length; j++){
				chunks[i][j].passNeighbors(getNeighboringChunks(chunks[i][j]))
			}
		}
		mapDetails.liveChunks += count;
		console.log(count + ' chunks initiated kinda');
    });
    
    this.exposeIO = function(_io) {
    	io = _io;
    };
    this.getChunks = function() {
    	return chunks;
    }
    this.isValid = function(x, y) {
    	if(collisions[x][y] == 0)
    		return true;
    	else
    		return false;
    }
    this.playerEnterChunk = function(sId, player, chunk_x, chunk_y) {
    	var x, y;
    	if(chunk_x == undefined)
    		x = Math.floor(player.getData().x/gameState.chunkSize.x);
    	else
    		x = chunk_x;
    	if(chunk_y == undefined)
    		y = Math.floor(player.getData().y/gameState.chunkSize.y)
    	else
    		y = chunk_y;

    	var c = chunks[x][y];
    	var g = c.getNeighbors();
    	if(!c.isLive() || c.isEmpty()){ // if chunk asleep, wake up the area.
    		c.toggleState(true);
    		c.toggleStateMarker(false);
    		for(var i=0; i < g.length; i++){
    			g[i].toggleState(true);
    			g[i].toggleStateMarker(false);
    		}
    	}
    	c.playerEnter(sId, player);
    };
    this.playerLeaveChunk = function(sId, player, chunk_x, chunk_y) {
    	var x, y;
    	if(chunk_x == undefined)
    		x = Math.floor(player.getData().x/gameState.chunkSize.x);
    	else
    		x = chunk_x;
    	if(chunk_y == undefined)
    		y = Math.floor(player.getData().y/gameState.chunkSize.y)
    	else
    		y = chunk_y;
    	chunks[x][y].playerLeave(sId, player)
    };
    this.update = function() {
    	for (var i = 0; i < chunks.length; i++) {
            for (var j = 0; j < chunks[i].length; j++) {
            	if(chunks[i][j].isLive())
            		chunks[i][j].update();
            }
        }


    	//turning off unused chunks - 2 step process
    	if(chunks && gameState.frameTime - mapDetails.lastChunkCheck > 60*1000){ //ideally do this at some interval
    		console.time('chunk ops: ');
    		mapDetails.lastChunkCheck = new Date().getTime();
    		for(var i=0; i<chunks.length; i++){
    			for(var j=0; j<chunks[i].length; j++){
    				var c = chunks[i][j];
    				if(!c.isLive()) //already off
    					continue;
    				if(c.isEmpty() && c.areNeighborsEmpty()){ //check neighbors and turn off
    					if(c.isMarked()){
    						c.toggleState(false);
    					}
    					else{
    						c.toggleStateMarker(true);
    					}
    				}
    			}
    		}
    		console.timeEnd('chunk ops: ');
    	}
    };
    this.getChunkStateMap = function() {
        var arr = [];
        for (var i = 0; i < chunks.length; i++) {
            arr[i] = [];
            for (var j = 0; j < chunks[i].length; j++) {
                if (chunks[i][j].isLive()) {
                    if (chunks[i][j].isMarked()){
                        arr[i][j] = '-';
                    }
                    else{
                    	if(chunks[i][j].isEmpty())
                    		arr[i][j] = '0';
                    	else
                        	arr[i][j] = '1';
                    }
                }
                else
                    arr[i][j] = 'x';
            }
        }
        console.log(arr);
    };
}