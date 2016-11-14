module.exports = EntityManager;
var entityDefaults = {
    defaultDecayTime: 240*1000
};
function Entity(options) {
    this.id = options.id;
    this.gonerId = options.gonerId;
    this.contents = options.contents || {};
    this.x = options.x;
    this.y = options.y;
    this.cx = options.cx;
    this.cy = options.cy;
    this.type = options.type;
    this.blocking = options.blocking;
    this.name = options.name || 'default name';
    this.creationTime = new Date().getTime();
    this.decayTime = options.decayTime || entityDefaults.defaultDecayTime;
    this.isDecaying = options.isDecaying;
}
function EntityManager(gameState) {
    var curId = 0; //non persistent objects
    var allEntities = {}; //entities by id

    this.populateEntities = function() {
        var chestContents = [
                                [IFAC.createWeapon(1) , IFAC.createWeapon(2) , IFAC.createWeapon(3)],
                                [IFAC.createWeapon(4) , IFAC.createWeapon(5) , IFAC.createWeapon(6)],
                                [IFAC.createWeapon(7) , 0                    , IFAC.createWeapon(8)],
                                [IFAC.createWeapon(9) , IFAC.createWeapon(5) , IFAC.createWeapon(6)]
                            ];
        var emptyContents = [
                                [IFAC.createItem(4), IFAC.createArmor(2), 0, 0, 0],
                                [IFAC.createItem(7), IFAC.createItem(8), 0, 0, 0],
                                [IFAC.createItem(9), 0, 0, 0, 0],
                                [0, 0, 0, 0, 0]
                            ];
        this.createContainer({x: 54, y: 52, name: 'Chest', contents: chestContents});
        this.createContainer({x: 56, y: 52, name: 'Chest', contents: emptyContents});
    };

    this.createCorpse = function(options) {
        var id = curId++;
        var cx = Math.floor(options.x/gameState.chunkSize.x);
        var cy = Math.floor(options.y/gameState.chunkSize.y);
        allEntities[id] = new Entity(Object.assign(options, {id, cx, cy, type: 'corpse', isDecaying: true}));
        MAP.getChunk(cx, cy).addEntity(id, allEntities[id]);
    };

    this.createContainer = function(options) {
        var id = curId++;
        var cx = Math.floor(options.x/gameState.chunkSize.x);
        var cy = Math.floor(options.y/gameState.chunkSize.y);
        var e = new Entity(Object.assign(options, {id, cx, cy, type: 'container', decayTime: null, isDecaying: false}));
        allEntities[id] = e;
        MAP.getChunk(cx, cy).addEntity(id, allEntities[id]);
    };
    this.createSymbol= function(options) { // this is for transmutation symbols.
        var id = curId++;
        var cx = Math.floor(options.x/gameState.chunkSize.x);
        var cy = Math.floor(options.y/gameState.chunkSize.y);
        allEntities[id] = new Entity(Object.assign(options, {id, cx, cy, type: 'symbol', isDecaying: true}));
        MAP.getChunk(cx, cy).addEntity(id, allEntities[id]);
    };
    this.createPumpkin= function(options) { // this is for transmutation symbols.
        console.log(options)
        var id = curId++;
        var cx = Math.floor(options.x/gameState.chunkSize.x);
        var cy = Math.floor(options.y/gameState.chunkSize.y);
        allEntities[id] = new Entity(Object.assign(options, {id, cx, cy, type: 'symbol', isDecaying: true}));
    };
    this.createBlockingEntity= function(options) {
        var id = curId++;
        var cx = Math.floor(options.x/gameState.chunkSize.x);
        var cy = Math.floor(options.y/gameState.chunkSize.y);
        allEntities[id] = new Entity(Object.assign(options, {id, cx, cy, type: 'blockade', isDecaying: true, blocking: true}));
        MAP.getChunk(cx, cy).addEntity(id, allEntities[id]);
        console.log(options)
        MAP.occupySpotBlocking(options.x, options.y);
    };

    this.removeEntity = function(_id) {
        MAP.getChunk(allEntities[_id].cx, allEntities[_id].cy).removeEntity(_id);
        if(allEntities[_id].blocking) {
            MAP.freeSpot(allEntities[_id].x, allEntities[_id].y);
        }
        delete allEntities[_id];
    };
    this.update = function() {
        var e;
        for(var id in allEntities){
            e = allEntities[id];
            if(e.isDecaying && gameState.frameTime - e.creationTime > e.decayTime){
                this.removeEntity(id);
            }
        }
    };
    this.getAllEntities = function() {
        return allEntities;
    };
    this.getEntity = function(id) {
        return allEntities[id];
    };
}
