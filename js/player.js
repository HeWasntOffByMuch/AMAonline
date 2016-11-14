var logger = require('tracer').colorConsole();
var enums = require('./enums.js');
var Container = require('./container.js');
var combatTools = require('./combat.js');
var expTools = require('./exp.js');
var Inventory = require('./inventory.js');
var SkillTree = require('./skill_tree.js');
var MovementQueue = function(){
    var currentPath = [];
    this.getMove = function(){
        return currentPath.shift();
    };
    this.queueMove = function(x, y){
        currentPath.push([x, y]);
    };
    this.getLength = function(){
        return currentPath.length;
    };
    this.clearQueue = function(){
        currentPath = [];
    };
    this.getQueue = function(){
        return currentPath;
    };
};
var defaultValues = {
    accuracyRating: 400,
    evasionRating: 400,
    parryRating: 400,
    blockRating: 400,
    speedBase: 600,
    speedBonusPerLevel: 4,
    maxHealthPerLevel: 10,
    maxManaPerLevel: 5,
    healthMax: 90,
    manaMax: 5
};

module.exports = function Player(options) {
    var gameState = options.gameState;
    var map = MAP;
    var _id = options.id;
    var sId = options.socketId || null;
    this.setNewSocketId = function(new_sid) { sId = new_sid };
    this.getSocketId = function() { return sId };

    var name = options.name;
    var type = enums.objType.PLAYER;
    var lastLogin = options.lastLogin || new Date();
    var creationDate = options.creationDate || new Date();
    var belongsTo = options.belongsTo;
    var timePlayed = options.timePlayed || 0; //only saves if u log out properly.

    //unsafe defaults
    var x = options.x || gameState.globalSpawnPoint.x;
    var y = options.y || gameState.globalSpawnPoint.y;
    var tx = x;
    var ty = y;

    map.occupySpot(tx, ty);
    this.currentChunk = {x: Math.floor(x / gameState.chunkSize.x), y: Math.floor(y / gameState.chunkSize.y)};

    var moveQ = new MovementQueue();
    var skillTree = new SkillTree(options.skillTree);
    var moveTime = false;
    var moving = false;
    var nextMove = false;

    //attacking and HP
    var isDead = false;
    var isVisible = true;
    var timeOfDeath;
    var deathHistory = options.deathHistory || [];


    var inCombat = false; //is currently engaged in combat
    var lastCombatEngagement = gameState.frameTime; // last time combat was triggered
    var combatEngagementInterval = 30 * 1000; // the time it takes to remove combat status

    var lastAttack = gameState.frameTime;
    var attackSpeed = 1;

    // these are in case client validation passes and server validation fails
    // due to clock differences and possible latency
    var prematureAttackRequestFromClient = false;
    var prematureAttackTarget = null;

    var level = options.level || 1;
    var experience = options.experience || 0;


    // RPG PROPERTIES
    var strength = strength || 10;
    var agility = agility || 10;
    var intelligence = intelligence || 10;

    var speedBase = defaultValues.speedBase - level * defaultValues.speedBonusPerLevel;
    var speedCur = speedBase;

    var passiveRegenValue = 2;
    var passiveRegenInterval = 6000;
    var passiveRegenTime = gameState.frameTime;

    this._ = {
        healthMax: defaultValues.healthMax + level * defaultValues.maxHealthPerLevel + skillTree.getSkillLevel('physique', 'healthPool') * 10,
        manaMax: defaultValues.manaMax + level * defaultValues.maxManaPerLevel + skillTree.getSkillLevel('intelligence', 'manaPool') * 10,
        accuracyRating: defaultValues.accuracyRating + skillTree.getSkillLevel('agility', 'accuracy') * 30,
        evasionRating: defaultValues.evasionRating + skillTree.getSkillLevel('agility', 'evasion') * 30,
        parryRating: defaultValues.parryRating + skillTree.getSkillLevel('agility', 'parry') * 30,
        blockRating: defaultValues.blockRating + skillTree.getSkillLevel('strength', 'blocking') * 30,
        physicalResistance: 0,
        // dev note: max crit chance from skillTree alone is 25%
        critChance: skillTree.getSkillLevel('agility', 'criticalHits') * 0.0125,
        // dev note: max is 2 and on hit is multiplied
        critDamage: 1 + skillTree.getSkillLevel('agility', 'criticalHits') * 0.05,
        // dev note: max is 2 and on hit is multiplied
        damageMod: 1 + skillTree.getSkillLevel('strength', 'attackDamage') * 0.05,
        // dev note: max 2 from skills alone
        attackSpeed: 1 + skillTree.getSkillLevel('agility', 'attackSpeed') * 0.05,
        // in [ms]
        speedCur: speedBase,
        // dev note: max 3 from skills alone
        healingMagic: 1 + skillTree.getSkillLevel('intelligence', 'healingMagic') * 0.1,
        lifeSteal: 0,
        offensiveInstant: 1 + skillTree.getSkillLevel('intelligence', 'offensiveInstant') * 0.1
    };


    var healthCur = options.healthCur || this._.healthMax;

    var manaCur = options.manaCur || this._.manaMax;

    var equipment = options.equipment;
    
    if(equipment){
        equipment = {
            primary:    new Container(equipment.primary.id, 1, 1, equipment.primary.contents, 'primary'),
            secondary:  new Container(equipment.secondary.id, 1, 1, equipment.secondary.contents, 'secondary'),
            body:       new Container(equipment.body.id, 1, 1, equipment.body.contents, 'body'),
            legs:       new Container(equipment.legs.id, 1, 1, equipment.legs.contents, 'body'),
            boots:      new Container(equipment.boots.id, 1, 1, equipment.boots.contents, 'boots'),
            head:       new Container(equipment.head.id, 1, 1, equipment.head.contents, 'head'),
            backpack:   new Container(equipment.backpack.id, equipment.backpack.w, equipment.backpack.h, equipment.backpack.contents, 'backpack'),
            skill0:     new Container(equipment.skill0.id, 1, 1, equipment.skill0.contents, 'skill0'),
            skill1:     new Container(equipment.skill1.id, 1, 1, equipment.skill1.contents, 'skill1'),
            skill2:     new Container(equipment.skill2.id, 1, 1, equipment.skill2.contents, 'skill2'),
            skill3:     new Container(equipment.skill3.id, 1, 1, equipment.skill3.contents, 'skill3')
        };
    }
    else{   // IF NEW CHARACTER
        equipment = {
            primary:    new Container(null, 1, 1, null, 'primary'),
            secondary:  new Container(null, 1, 1, null, 'secondary'),
            body:       new Container(null, 1, 1, null, 'body'),
            legs:       new Container(null, 1, 1, null, 'legs'),
            boots:      new Container(null, 1, 1, null, 'boots'),
            head:       new Container(null, 1, 1, null, 'head'),
            backpack:   new Container(null, 4, 5, null, 'backpack'),
            skill0:     new Container(null, 1, 1, null, 'skill0'),
            skill1:     new Container(null, 1, 1, null, 'skill1'),
            skill2:     new Container(null, 1, 1, null, 'skill2'),
            skill3:     new Container(null, 1, 1, null, 'skill3')
        };
        // SET UP STARTING ITEMS:
        equipment.backpack.contents[0][0] = IFAC.createWeapon(1);
        equipment.backpack.contents[1][0] = IFAC.createItem(1);
        equipment.backpack.contents[2][0] = IFAC.createItem(3);
        equipment.backpack.contents[3][0] = IFAC.createWeapon(2);
    }
    this.isDead = function() {
        return isDead;
    };
    this.isVisible = function() {
        return isVisible;
    };
    this.getEquipment = function() {
        return equipment;
    };
    this.setWeapon = function(item) {
        equipment.primary = item;
    };
    this.update = function() {
        this.prematureAttackCompensation(); // hopefully this is inlined by the optimizer
    	this.moveUpdate();
        this.combatCheck();
        this.passiveRegen();
        if(isDead && gameState.frameTime - timeOfDeath > gameState.globalRespawnTime){
            this.respawn();
        }
    };
    this.moveUpdate = function() {
        if(moveTime){
            if(gameState.frameTime - moveTime > this._.speedCur){
                //time to stop moving
                moving = false;
                moveTime = false;
                x = tx;
                y = ty;
            }
        }
        if(!moving){
            nextMove = moveQ.getMove();
            if(nextMove && map.isValid(x + nextMove[0], y + nextMove[1])){
                this.move(nextMove[0], nextMove[1]);
                this.chunkCheck();
            }
            else if(nextMove){
                //i really wanna clear the queue at this point and snap the player back
                IO.to(sId).emit('move-queue-invalid', {x: tx, y: ty});
                moveQ.clearQueue();
            }
        }
    };
    this.chunkCheck = function() {
        var cx = Math.floor(tx/gameState.chunkSize.x);
            var cy = Math.floor(ty/gameState.chunkSize.y);
            if(this.currentChunk.x != cx || this.currentChunk.y != cy){
                // console.log('chunk change');
                map.playerLeaveChunk(sId, this, this.currentChunk.x, this.currentChunk.y);
                map.playerEnterChunk(sId, this, cx, cy);
                this.currentChunk.x = cx;
                this.currentChunk.y = cy;
            }
    };
    this.queueMove = function(dx, dy) {
        if(isDead){
            console.log('dead cannot walk this earth. yet')
            return;
        }
        dx = Math.sign(dx);
        dy = Math.sign(dy);
        if((!Math.abs(dx) && Math.abs(dy)) || (Math.abs(dx) && !Math.abs(dy)) ){ // XOR
            moveQ.queueMove(dx, dy);
        } else {
            console.log('some monkey business on client side.')
        }
    };
    this.move = function(dx, dy) {
        moveTime = gameState.frameTime;
        map.freeSpot(tx, ty);
        tx = x + dx;
        ty = y + dy;
        map.occupySpot(tx, ty);
        moving = true;
    };
    this.setPosition = function(spawn_x, spawn_y) {
        x = spawn_x;
        y = spawn_y;
        tx = spawn_x;
        ty = spawn_y;
        this.chunkCheck(); //force chunk check - otherwise 'onmove'
    };
    this.isSurrounded = function() {
        for(var i = tx - 1; i <= tx + 1; i++){
            for(var j = ty - 1; j <= ty + 1; j++){
                if(i == tx && j == ty) continue;
                if(map.isValid(i, j))
                    return false;
            }
        }
        return true;
    };
    this.engageInCombat = function() {
        if(!inCombat){
            IO.to(sId).emit('player-combat-start', {});
        }
        inCombat = true;
        lastCombatEngagement = gameState.frameTime;
    };
    this.combatCheck = function() {
        if(inCombat && gameState.frameTime - lastCombatEngagement > combatEngagementInterval){
            inCombat = false;
            IO.to(sId).emit('player-combat-end', {});
        }
    };
    this.inCombat = function() {
        return inCombat;
    };
    this.prematureAttackCompensation = function() {
        if(prematureAttackRequestFromClient && gameState.frameTime - lastAttack > equipment.primary.contents[0][0].attackCooldown / this._.attackSpeed){
            prematureAttackRequestFromClient = false;
            this.attackRequest(prematureAttackTarget);
            prematureAttackTarget = null;
        }
    };
    this.attackRequest = function(target) {
        if(!isDead && equipment.primary){
            if(gameState.frameTime - lastAttack > equipment.primary.contents[0][0].attackCooldown / this._.attackSpeed && combatTools.dist(this.getData(), target.getData()) < equipment.primary.contents[0][0].range){
                lastAttack = gameState.frameTime;
                this.attack(target);
            }
            else {
                prematureAttackRequestFromClient = true;
                prematureAttackTarget = target;
                // console.log('attack missfired by:', gameState.frameTime - lastAttack - equipment.primary.contents[0][0].attackCooldown/attackSpeed)
            }
        }
    };
    this.attack = function(target) {
        if(this === target) {
            console.log('player attempts to attack himself.');
            return;
        }
        var nearbyPlayers = MAP.getChunk(this.currentChunk.x, this.currentChunk.y).getNearbyPlayers();
        if(equipment.primary.contents[0][0].type == 'ranged'){
            // do ranged stuff and possibly return here i fline of sight is broken
            var los = combatTools.calcLineOfSight(this.getData(), target.getData());
            for(var socketid in nearbyPlayers){
                IO.to(socketid).emit('player-attack-range', {id: _id, target: {x: los.obstacle.x, y: los.obstacle.y}, hit: los.isClear});
            }
            if(!los.isClear)
                return;
        }
        else if(equipment.primary.contents[0][0].type == 'melee'){
            for(var socketid in nearbyPlayers){
                IO.to(socketid).emit('player-attack-melee', {id: _id, target: {x: target.getData().tx, y: target.getData().ty}});
            }
        }
        this.engageInCombat();
        var damage = combatTools.calcPlayerDamage(this, target);
        var damageDealt = target.takeDamage(this, damage); //this is for further use in lifesteal etc
        var damageStolen = Math.floor(damageDealt * this._.lifeSteal);
        this.healSelf(damageStolen);
    };
    this.emitSpellEffect = function(options) {
        var nearbyPlayers = MAP.getChunk(this.currentChunk.x, this.currentChunk.y).getNearbyPlayers();
        for(var socketid in nearbyPlayers){
            IO.to(socketid).emit('spell-effect-triggered', options);
        }
    };
    this.aoeAttack = function(areaFunction, damage, options) {
        var unitsAffected = {};
        var currentChunk = MAP.getChunk(this.currentChunk.x, this.currentChunk.y);
        var nearbyPlayers = currentChunk.getNearbyPlayers();
        var nearbyMobs = currentChunk.getNearbyMobs();
        // depending on AoE come up with resulting affected units
        var mobsHit = this.checkMobsAgainstAreaOfEffect(nearbyMobs, areaFunction);
        for(var i in mobsHit){
            mobsHit[i].takeDamage(this, damage);
        }
        var playersHit = this.checkPlayersAgainstAreaOfEffect(nearbyPlayers, areaFunction);
        for(var i in playersHit){
            playersHit[i].takeDamage(this, damage)
        }

        this.emitSpellEffect(options);
    };
    this.checkPlayersAgainstAreaOfEffect = function(nearbyPlayers, areaFunction) {
        var affectedPlayers = areaFunction(nearbyPlayers);
        delete affectedPlayers[sId];// dont wanna hit yourself
        return affectedPlayers;
    };
    this.checkMobsAgainstAreaOfEffect = function(nearbyMobs, areaFunction) {
        var affectedMobs = areaFunction(nearbyMobs);
        return affectedMobs;
    };
    this.fireball = function(damage, target) {
        if(isDead) return;
        damage = damage * this._.offensiveInstant;
        if(target && !damage.isNan){
            target.takeDamage(this, damage)

            var options = {
                name: 'fireball',
                x: tx,
                y: ty,
                tx: target.getData().tx,
                ty: target.getData().ty
            };
            this.emitSpellEffect(options);
        }
    };
    this.strongProjectile = function(damage, target) {
        if(isDead) return;
        if(target && !damage.isNan && target !== this){
            target.takeDamage(this, damage)
            this.engageInCombat();

            var options = {
                name: 'strongProjectile',
                x: tx,
                y: ty,
                tx: target.getData().tx,
                ty: target.getData().ty
            };
            this.emitSpellEffect(options);
        }
    };
    this.placeSymbol = (value, target) => {
        if(target.hasOwnProperty('getData')) {
            target = {x: target.getData().x, y: target.getData().y}
        }
        ENTMAN.createSymbol({x: target.x, y: target.y, name: 'Basic Symbol', decayTime: 8000});
    };
    this.placePumpkin = (value, target) => {
        if(target.hasOwnProperty('getData')) {
            target = {x: target.getData().x, y: target.getData().y}
        }
        ENTMAN.createPumpkin({x: target.x, y: target.y, name: 'Pumpkin', decayTime: 300000});
    };
    this.placeBlockingEntity = (value, target) => {
        if(target.hasOwnProperty('getData')) {
            target = {x: target.getData().x, y: target.getData().y}
        }
        if(map.isValid(target.x, target.y)) {
            ENTMAN.createBlockingEntity({x: target.x, y: target.y, name: 'Stone Wall', decayTime: 15000});
        }
    };
    this.groundSmash = function(damage) {
        if(isDead) return;
        var areaFunction = function(units) { //attacks units around player
            var affectedUnits = {};
            for(var id in units){
                var u = units[id].getData();
                if(Math.abs(u.tx - tx) <= 1 && Math.abs(u.ty - ty) <= 1)
                    affectedUnits[id] = units[id];
            }
            return affectedUnits;
        };
        var options = {
            name: 'groundSmash',
            x: tx,
            y: ty
        };
        this.aoeAttack(areaFunction, damage, options);
    };
    this.magicWave = function(damage) {
        if(isDead) return;
        var areaFunction = function(units) { //attacks units around player
            var range = 5;
            var affectedUnits = {};
            for(var id in units){
                var u = units[id].getData();
                if((u.tx === tx && Math.abs(u.ty - ty) <= range) || (u.ty === ty && Math.abs(u.tx - tx) <= range))
                    affectedUnits[id] = units[id];
            }
            return affectedUnits;
        };

        var options = {
            name: 'magicWave',
            x: tx,
            y: ty
        };
        this.aoeAttack(areaFunction, damage, options);
    };
    this.takeDamage = function(attacker, damage) { //only damage from autoattacks. for different -> define more functions
        if(!isDead){
            var damageTaken = Math.floor(Math.min(damage, healthCur));
            healthCur -= damageTaken;
            this.engageInCombat();
            if(healthCur <= 0)
                this.die(attacker);
            return damageTaken;
        }
    };
    this.passiveRegen = function() {
        if(!isDead && gameState.frameTime - passiveRegenTime > passiveRegenInterval){
            passiveRegenTime = gameState.frameTime;
             healthCur += Math.min(passiveRegenValue, this._.healthMax - healthCur);
        }
    };
    this.checkMana = function(val) {
        if(manaCur >= val)
            return true;
        else
            return false;
    };
    this.useMana = function(val) {
        manaCur -= Math.min(manaCur, val); //ca't go below 0
    };
    this.restoreMana = function(val) {
        manaCur += Math.min(val, this._.manaMax - manaCur);
    };
    this.checkItemRange = function(item, target) {
        if(!item.range || combatTools.dist(this.getData(), target.getData()) <= item.range){
            return true;
        } else {
            return false;
        }
    };
    // THOSE ARE USABLE SKILL/ITEM FUNCTIONS
    this.giveMana = function(val, target) {
        if(target.restoreMana !== undefined) {
            console.log(`restoring someone's mana`)
            target.restoreMana(val);
        }
    };
    this.heal = function(val, target) { //heal self or target
        var healAmount = Math.floor(val * this._.healingMagic);

        target.getHealed(healAmount);
        var options = {
            name: 'healUnit',
            x: target.getData().tx,
            y: target.getData().ty
        };

        this.emitSpellEffect(options)
    };
    this.healSelf = function(val) {
        healthCur += Math.min(val, this._.healthMax - healthCur);
    };
    this.getHealed = function(val) { // won't trigger self  healing cooldowns
        healthCur += Math.min(val, this._.healthMax - healthCur);
    };
    this.resurrect = function(percent, target) { //cannot use on yourself
        if(target && target !== this && target.isDead()){
            target.getResurrected(percent);
        }
        else{
            IO.to(sId).emit('server-message', {message: 'That player already respawned. Too bad for him.', color: 'yellow'});
        }
    };
    this.getResurrected = function(percent) {
        healthCur = this._.healthMax * percent;
        isDead = false;
        this.setPosition(tx, ty);
        IO.to(sId).emit('player-respawn-response', {x: x, y: y});
        logger.log('player ' + name + ' ressed at ', x, y);
    };
    this.quickSlashes = function(value, target) { // client sends target.id along with request
        if(target){
            this.attack(target);
            setTimeout(this.attack.bind(this, target), 300);
        }
        else{

        }
    };
    this.toggleInvisibility = function(equipping) {
        if(equipping){
            isVisible = false;
            IO.to(sId).emit('you-toggled-invisibility', {isVisible: isVisible});
            var nearbyPlayers = MAP.getChunk(this.currentChunk.x, this.currentChunk.y).getNearbyPlayers();
            for(var socketid in nearbyPlayers){
                IO.to(socketid).emit('other-player-toggled-invisibility', {id: _id});
            }
        }
        else{
            // need canTurnVisible check if no other sources of invis are active
            isVisible = true;
            IO.to(sId).emit('you-toggled-invisibility', {isVisible: isVisible});
        }
    };
    this.digGround = function() {
        console.log('digging')
        //would want the target too be diggable entity
    };
    this.die = function(killer) {
        isDead = true;
        inCombat = false;
        moveQ.clearQueue();
        moving = false;

        timeOfDeath = new Date().getTime();

        map.freeSpot(tx, ty);
        deathHistory.push({killedBy: killer.getData().name, date: new Date().getTime()});
        IO.to(sId).emit('you-have-died', {});
        var nearbyPlayers = MAP.getChunk(this.currentChunk.x, this.currentChunk.y).getNearbyPlayers();
        for(var socketid in nearbyPlayers){
            IO.to(socketid).emit('other-player-died', {id: _id});
        }
        var loot = {};
        ENTMAN.createCorpse({x: tx, y: ty, name: 'Grave', contents: loot, decayTime: 60000, gonerId: _id});
        //lose xp?
        //health to 100%
    };
    this.gainExperience = function(gained_exp) {
        experience += gained_exp;
        IO.to(sId).emit('player-gained-exp', gained_exp);
        while(experience >= expTools.getLevelExp(level + 1)){
            this.levelUp();
            IO.to(sId).emit('player-level-up', level);
        }
    };
    this.levelUp = function() {
        level++;
        this._.speedCur -= defaultValues.speedBonusPerLevel;
        
        skillTree.addSkillPoint();
        
        logger.log('LEVEL UP ! player xp=', experience, "level=", level);
    };
    this.respawn = function() {
        healthCur = this._.healthMax;
        isDead = false;
        this.setPosition(gameState.globalSpawnPoint.x, gameState.globalSpawnPoint.y);
        // map.occupySpot(tx, ty);// -- most likely needed 
        IO.to(sId).emit('player-respawn-response', {x: x, y: y});
        logger.log('player ' + name + ' respawned at ', x, y);
    };
    this.addTimePlayed = function(logoutTime) { //invoked on logout
    	timePlayed += logoutTime - lastLogin;
    };
    this.useItemOnSelf = function(from) { //rewrite needed for this - item property checks
        var item = equipment[from.id].contents[from.x][from.y];
        console.log('player using item', item)
        if(item){
            if(item.useFunction){ // this is not a definitive no go for using items - redesign? use hasOwnProperty?
                this.removeUsesFromConsumable(from, item);
                if(item.manaCost){
                    if(this.checkMana(item.manaCost))
                        this.useMana(item.manaCost)
                    else
                        return;
                }

                this[item.useFunction](item.useValue, this);
            }
        }
    };
    this.useItemOnTarget = function(data) { //need distance checks and item needs range property/split into separate functions
        console.log('player using item on target');
        var usedOn;
        var item = equipment[data.id].contents[data.x][data.y];
        if(data.targetType === enums.objType.PLAYER) {
            usedOn = GAME.getAllPlayersById()[data.targetId];
        }
        else if(data.targetType === enums.objType.MOB) {
            usedOn = GAME.getAllMobs()[data.targetId];
        }
        else if(data.targetType === enums.objType.ENTITY) {
            var entity = ENTMAN.getAllEntities()[data.targetId];
            var playerTarget = GAME.getAllPlayersById()[entity.gonerId];
            if (!playerTarget) {
                return;
            }
            usedOn = playerTarget;
        }
        else if(data.targetType === enums.objType.GROUND)  {
            if(data.targetPos && !MAP.isValid(data.targetPos.x, data.targetPos.y))  {
                return;
            }
            if(item.target !== 'ground') {
                return;
            }
            usedOn = data.targetPos;
        }
        if(item && usedOn && item.useFunction){
            if(!this.checkItemRange(item, usedOn))
                return;
            if(item.manaCost){
                if(this.checkMana(item.manaCost))
                    this.useMana(item.manaCost);
                else
                    return;
            }
            this.removeUsesFromConsumable(data, item);
            this[item.useFunction](item.useValue, usedOn);
        }
    };
    this.removeUsesFromConsumable = function(from, item) {
        if(item.type == 'consumable'){
            IO.to(sId).emit('player-used-item', {parentId: from.id, id: item.id}); //add uses left and handle on client
            if(--item.quantity <= 0)
                equipment[from.id].contents[from.x][from.y] = 0; // removes item
        }
    };
    this.removeItem = function(item, from) {
        // misleading name. think about changing it.
        //this is just technical function that handles moving items with respect to equip bonuses
        if(equipment[from.id].name != 'backpack' && item.onEquip){
            for(var i = 0; i < item.onEquip.length; i++){
                this.applyEquipmentBonusesOnItemTakeOff(item.onEquip[i]);
            }
        }
        equipment[from.id].removeItem(from.x, from.y);
    };
    this.addItem = function(item, to) {
        // misleading name. think about changing it
        //this is just technical function that handles moving items with respect to equip bonuses
        if(equipment[to.id].name != 'backpack' && item.onEquip){
            for(var i = 0; i < item.onEquip.length; i++){
                this.applyEquipmentBonusesOnItemEquip(item.onEquip[i]);
            }
        }
        equipment[to.id].addItem(item, to.x, to.y);
    };
    this.moveInventoryItem = function(from, to) { // retarded but works for now. this is a request but handles all item moving?
        var item = equipment[from.id].contents[from.x][from.y];
        if(!equipment[to.id].isSlotEmpty(to.x, to.y) || item === equipment[to.id].contents[to.x][to.y]) // move item into self
            return;

        this.addItem(item, to);
        this.removeItem(item, from);
    };
    this.stackInventoryItems = (from, to) => {
        var item1 = equipment[from.id].contents[from.x][from.y];
        var item2 = equipment[to.id].contents[to.x][to.y];

        item2.quantity += item1.quantity;
        equipment[from.id].removeItem(from.x, from.y);
    };
    this.takeItemFromContainer = function(from, to) {
        var item = ENTMAN.getEntity(from.id).contents[from.x][from.y];

        if(!item) return; //possibly send client message because obviously something went wrong

        ENTMAN.getEntity(from.id).contents[from.x][from.y] = 0; // clear previous position

        this.addItem(item, to);
    };
    this.putItemIntoContainer = function(from, to) {
        var item = equipment[from.id].contents[from.x][from.y];
        console.log(item)
        if(item == ENTMAN.getEntity(to.id).contents[to.x][to.y]) // move item into self
            return;

        if(!ENTMAN.getEntity(to.id).contents[to.x][to.y]){
            this.removeItem(item, from);
            ENTMAN.getEntity(to.id).contents[to.x][to.y] = item;
        }
    };
    this.moveItemInsideContainer = function(from, to) {
        var item1 = ENTMAN.getEntity(from.id).contents[from.x][from.y];

        if(!item1) return; //possibly send client message because obviously something went wrong

        ENTMAN.getEntity(from.id).contents[from.x][from.y] = 0; // clear previous position
        ENTMAN.getEntity(to.id).contents[to.x][to.y] = item1;
    };
    this.stackItemFromContainer = (from, to) => {
        var item1 = ENTMAN.getEntity(from.id).contents[from.x][from.y];
        var item2 = equipment[to.id].contents[to.x][to.y];

        if (item1.stackable && item1.name === item2.name) {
            item2.quantity += item1.quantity;
            ENTMAN.getEntity(from.id).contents[from.x][from.y] = 0;
        }
    };
    this.stackItemIntoContainer = (from, to) => {
        var item1  = equipment[from.id].contents[from.x][from.y];
        var item2 = ENTMAN.getEntity(to.id).contents[to.x][to.y];

        if (item1.stackable && item1.name === item2.name) {
            item2.quantity += item1.quantity;
            equipment[from.id].contents[from.x][from.y] = 0;
        }
    };
    this.stackItemsInsideContainer= function(from, to) {
        var item1 = ENTMAN.getEntity(from.id).contents[from.x][from.y];
        var item2 = ENTMAN.getEntity(to.id).contents[to.x][to.y];

        if (item1.stackable && item1.name === item2.name) {
            item2.quantity += item1.quantity;
            ENTMAN.getEntity(from.id).contents[from.x][from.y] = 0
        }
    };
    this.lootEntity = function(from, to) { //missing feedback?? also for other clients
        var item1 = ENTMAN.getEntity(from.id).contents[from.pos];

        if(!item1) return;

        if(equipment[to.id].isSlotEmpty(to.x, to.y)){
            delete ENTMAN.getEntity(from.id).contents[from.pos]; // modifies entity.
            this.addItem(item1, to);
        }
        else{
1            // obviously need client correction when this happens and stack check fails
            var item2 = equipment[to.id].contents[to.x][to.y]
            if (item1.stackable && item1.name === item2.name) {
                item2.quantity += item1.quantity;
                delete ENTMAN.getEntity(from.id).contents[from.pos];
            }
        }
        //let other clients nearby know item is no longer there!! perhaps only one player at a time can view an inventory
    };
    this.applyEquipmentBonusesOnItemEquip = function(data) {
        if(data.type === 'function'){
            this[data.name](true);
        }
        else{
            this._[data.name] += data.value;
        }
    };
    this.applyEquipmentBonusesOnItemTakeOff = function(data) {
        if(data.type === 'function'){
            this[data.name](false);
        }
        else{
            this._[data.name] -= data.value;
        }
    };
    this.applyEquipmentBonusesOnLogin = function(){
        for(var i in equipment){
            var item = equipment[i].contents[0][0];
            if(i != 'backpack' && item.onEquip){
                for(var j = 0; j < item.onEquip.length; j++){
                    this.applyEquipmentBonusesOnItemEquip(item.onEquip[j]);
                }
            }
        }
    };
    //immediately call that method while constructing player
    this.applyEquipmentBonusesOnLogin();

    this.spendSkillRequest = function(skill_data) {
        if(skillTree.canSpendSkillPoint(skill_data.branch, skill_data.name)){
            skillTree.spendSkillPoint(skill_data.branch, skill_data.name);

            // do some sort of update on that one. might have to update all _ stats
            var relevantStats = skillTree.getAssociatedStats(skill_data.branch, skill_data.name);
            this.updateStatsWhenSkillPointIsUsed(relevantStats);


            var level = skillTree.getSkillLevel(skill_data.branch, skill_data.name);
            IO.to(sId).emit('player-skill-response', {branch: skill_data.branch, name: skill_data.name, level: level });
        }
        else {
            // console.log('cant increase skill', skill_data.name)
        }
    };
    this.updateStatsWhenSkillPointIsUsed = function(stats) {
        for(var name in stats){
            console.log(name, 'incremented by', stats[name])
            this._[name] += stats[name];
            console.log(name,  'is now', this._[name]);
        }
    };
    this.getData = function() { //this is also all the stuff that gets saved into and pulled from db
        return {
            _id: _id,
            name: name,
            type: type,
            level: level,
            lastLogin: lastLogin,
            creationDate: creationDate,
            belongsTo: belongsTo,
            timePlayed: timePlayed,
            x: x,
            y: y,
            tx: tx,
            ty: ty,
            speedBase: speedBase,
            speedCur: this._.speedCur,
            healthCur: healthCur,
            healthMax: this._.healthMax,
            manaCur: manaCur,
            manaMax: this._.manaMax,
            isDead: isDead,
            isVisible: isVisible,
            deathHistory: deathHistory,
            experience: experience,
            equipment: {
                primary: equipment.primary,
                secondary: equipment.secondary,
                body: equipment.body,
                legs: equipment.legs,
                boots: equipment.boots,
                head: equipment.head,
                backpack: equipment.backpack,
                skill0: equipment.skill0,
                skill1: equipment.skill1,
                skill2: equipment.skill2,
                skill3: equipment.skill3
            },
            skillTree : skillTree.getDataForDatabase(),
            attackSpeed: this._.attackSpeed
        };
    };
    this.getDataForClientInitiation = function() {
        return{
            _id: _id,
            name: name,
            level: level,
            type: type,
            x: x,
            y: y,
            tx: tx,
            ty: ty,
            isVisible: isVisible,
            speedCur: this._.speedCur,
            healthCur: healthCur,
            healthMax: this._.healthMax,
            manaCur: manaCur,
            manaMax: this._.manaMax,
            experience: experience,
            equipment: {
                primary: equipment.primary,
                secondary: equipment.secondary,
                body: equipment.body,
                legs: equipment.legs,
                boots: equipment.boots,
                head: equipment.head,
                backpack: equipment.backpack,
                skill0: equipment.skill0,
                skill1: equipment.skill1,
                skill2: equipment.skill2,
                skill3: equipment.skill3
            },
            attackSpeed: this._.attackSpeed,
            inCombat: inCombat,
            skillTree: skillTree.getDataForClient()
        }
    };
    this.getCombatData = function() {
        return {
            accuracyRating: accuracyRating,
            evasionRating: evasionRating,
            parryRating: parryRating,
            blockRating: blockRating,
            equipment: equipment,
            skillTree: skillTree
        }
    };
    this.getEquipment  = function() {
        return equipment;
    };
};
