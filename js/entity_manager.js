module.exports = EntityManager;
var entityDefaults = {
    defaultDecayTime: 240*1000
};
function Entity(id, x, y, cx, cy, type, name, contents, decay_time, is_decaying, gonerId) {
    this.id = id;
    this.gonerId = gonerId;
    this.contents = contents || {};
    this.x = x;
    this.y = y;
    this.cx = cx;
    this.cy = cy;
    this.type = type;
    this.name = name || 'default name';
    this.creationTime = new Date().getTime();
    this.decayTime = decay_time || entityDefaults.defaultDecayTime;
    this.isDecaying = is_decaying;

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
                                [IFAC.createItem(4), 0, 0, 0, 0],
                                [0, 0, 0, 0, 0],
                                [0, 0, 0, 0, 0],
                                [0, 0, 0, 0, 0]
                            ];
        this.createContainer(45, 33, 'Trash Bag', chestContents);
        this.createContainer(47, 33, 'Trash Bag', emptyContents);
    };

    this.createCorpse = function(options) {
        var id = curId++;
        var cx = Math.floor(options.x/gameState.chunkSize.x);
        var cy = Math.floor(options.y/gameState.chunkSize.y);
        allEntities[id] = new Entity(id, options.x, options.y, cx, cy, 'corpse', options.name, options.contents, options.decayTime, true, options.gonerId);
        MAP.getChunk(cx, cy).addEntity(id, allEntities[id]);
    };

    this.createContainer = function(x, y, name, contents) {
        var id = curId++;
        var cx = Math.floor(x/gameState.chunkSize.x);
        var cy = Math.floor(y/gameState.chunkSize.y);
        var e = new Entity(id, x, y, cx, cy, 'container', name, contents, null, false);
        allEntities[id] = e;
        MAP.getChunk(cx, cy).addEntity(id, allEntities[id]);
    };

    this.removeEntity = function(_id) {
        MAP.getChunk(allEntities[_id].cx, allEntities[_id].cy).removeEntity(_id);
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
