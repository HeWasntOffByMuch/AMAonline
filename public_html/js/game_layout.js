function GameLayout(ctx) {
	var gh = gameState.tileSize
    var activeCallTabs = {};
    var curId = 0;
	this.draw = function() {
	   this.drawCombatIcon();
       this.drawPlayerHealthBar();
       this.drawPlayerManaBar();
       this.drawExperienceBar();
	};
    this.drawCombatIcon = function() {
        if(GAME.player.inCombat)
            ctx.drawImage(GAME.allImages['combat_icon'], GAME.canvas.width - 2*gh, gh, gh, gh);
    };
    this.drawPlayerHealthBar = function() {
        ctx.strokeStyle = 'black';
        ctx.strokeRect(130, 30, 180, 25);
        ctx.fillStyle = 'red';
        ctx.fillRect(130, 30, 180 * (GAME.player.healthCur / GAME.player.healthMax), 25);
        ctx.font="20px Tibia Font";
        ctx.fillStyle = 'black';
        ctx.fillText(GAME.player.healthCur + ' / ' + GAME.player.healthMax, 145, 50);
    };
    this.drawPlayerManaBar = function() {
        ctx.strokeStyle = 'black';
        ctx.strokeRect(330, 30, 180, 25);
        ctx.fillStyle = 'blue';
        ctx.fillRect(330, 30, 180 * (GAME.player.manaCur / GAME.player.manaMax), 25);
        ctx.font="20px Tibia Font";
        ctx.fillStyle = 'black';
        ctx.fillText(GAME.player.manaCur + ' / ' + GAME.player.manaMax, 345, 50);
    };
    this.drawExperienceBar = function() {
        ctx.fillStyle = '#454BFF';
        ctx.fillRect(0, GAME.canvas.height - 4, GAME.canvas.width, 4);
        ctx.fillStyle = '#FFDD00';
        ctx.fillRect(0, GAME.canvas.height - 4, GAME.canvas.width * GAME.player.expPercent.toFixed(2), 4);

    };
    this.incomingCallTab = function(player_id, player_name, peer_id) {
        var tab = new incomingCallTab({
            id: player_id,
            text: player_name,
            peerId: peer_id
        });
        activeCallTabs[player_id] = tab;
    };
    this.activeCallTab = function(player_id, player_name, peer_id) {
        var tab = new phoneTab({
            text: player_name,
            id: player_id
        });
        activeCallTabs[player_id] = tab;
    };
    this.callingNowTab = function(player_id, player_name, peer_id) {
        var tab = new callingNowTab({
            text: player_name,
            id: player_id
        });
        activeCallTabs[player_id] = tab;
    };
    this.removePhoneTabById = function(id) {
        activeCallTabs[id].close();
    };
    this.changeIntoActiveCallTabById = function(id) {
        activeCallTabs[id].changeIntoActiveCallTab();
    };


    this.openEntity = function(data) {
        if(data.type == 'corpse'){
            newLootWindow(data);
        }
        else if(data.type == 'container'){
            newContainerWindow(data);
        }
    };

    this.setSkillLevelAfterLeveling = function(branch, name, level) {
        $('#' + name).text(level);
        GAME.player.skillTree[branch][name] = level;
    };
}
function makeAllOfThemWindowsNow(playerData) {


	makeBackpackWindow(playerData);
	makeEquipmentWindow(playerData);
    makeCharacterWindow(playerData);
    makeDeathWindow(playerData);
    makeRightclickContextMenus(playerData);
   
}
function makeBackpackWindow(playerData) {
    var serverBackpack = playerData.equipment.backpack;
    // console.log(playerData);
    GAME.WIN_BP = new guiWindow({
        width: 128,
        height: 160,
        title: "BACKPACK",
        icon: "bp.gif",
        onclose: function() {
            $('#backpack').toggle({duration: 150});
        },
        position: { y: 20, x: 20 },
        content: ['<div id=' + serverBackpack.name + ' class="slot bp" size_x=' + serverBackpack.w + ' size_y=' + serverBackpack.h + '></div>']
    }).setId('backpack');
    // function itemElement(size_x, size_y, parent, pos_x, pos_y, id, src)
    // var item = new itemElement(1, 1, bp, 0, 0, 1, 'item1.gif');
    var testid = 0;
    var bp = $('#backpack .bp').makeContainer();
    for(var i = 0; i < serverBackpack.w; i++){
        for(var j = 0; j < serverBackpack.h; j++){
            if(serverBackpack.contents[i][j]){
                var item = serverBackpack.contents[i][j];
                var img = GAME.allImages[item.name] || GAME.allImages['placeholder'];
                var itemEl = new itemElement(1, 1, bp, i, j, item.id, img.src, item);
            }
        }
    }
}
function makeEquipmentWindow(playerData) {
    WIN_EQ = new guiWindow({
        width: 141,
        height: 200,
        title: "EQ",
        icon: "items/phantom_ganon.gif",
        onclose: function() {
            $('#equipment').toggle({duration: 150});
        },
        position: { y: 20, x: 182 },
        content: [
                    '<div id="head" class="slot head" size_x=1 size_y=1 pos_x="50px" pos_y="5px" ></div>',
                    '<div id="primary" class="slot primary" size_x=1 size_y=1 pos_x="10px" pos_y="45px" ></div>',
                    '<div id="secondary" class="slot secondary" size_x=1 size_y=1 pos_x="90px" pos_y="45px" ></div>',
                    '<div id="body" class="slot body" size_x=1 size_y=1 pos_x="50px" pos_y="45px" ></div>',
                    '<div id="legs" class="slot legs" size_x=1 size_y=1 pos_x="50px" pos_y="85px" ></div>',
                    '<div id="boots" class="slot boots" size_x=1 size_y=1 pos_x="50px" pos_y="125px" ></div>',
                    '<div id="skill0" class="slot skill" size_x=1 size_y=1 pos_x="2px" pos_y="165px" ></div>',
                    '<div id="skill1" class="slot skill" size_x=1 size_y=1 pos_x="37px" pos_y="165px" ></div>',
                    '<div id="skill2" class="slot skill" size_x=1 size_y=1 pos_x="72px" pos_y="165px" ></div>',
                    '<div id="skill3" class="slot skill" size_x=1 size_y=1 pos_x="107px" pos_y="165px" ></div>'
                ]
    }).setId('equipment');
    var eq = $('#equipment .slot').makeContainer(1, 1);
    $('#equipment .gui-window-content').children().each(function() {
        var div = $( this );
        var item = playerData.equipment[div.attr('id')].contents[0][0];
        if(item){
            var img = GAME.allImages[item.name] || GAME.allImages['placeholder'];
            itemEl = new itemElement(1, 1, div, 0, 0, item.id, img.src, item);
        }
    });
}
function makeCharacterWindow(playerData) {
    WIN_STATS = new guiWindow({
        width: 496 - 12,
        height: 375 - 37,
        title: 'SKILLS',
        icon: "player_icon.png",
        resizable: false,
        position: { y: 20, x: 1096 }
    });
    var talent_icons_path = '../img/skills/talents_resized/'
    var talent_icons = {
        accuracy: 'accuracy.jpg',
        armorEfficiency: 'armor_efficiency.jpg',
        attackDamage: 'attack_damage.jpg',
        attackSpeed: 'attack_speed.jpg',
        blocking: 'blocking.jpg',
        criticalHits: 'critical_hits.jpg',
        dualWielding: 'dual_wielding.jpg',
        evasion: 'evasion.jpg',
        healingMagic: 'healing_magic.jpg',
        healthPool: 'health_pool.jpg',
        magicResistance: 'magic_resistance.jpg',
        manaPool: 'mana_pool.jpg',
        offensiveCurses: 'curse_offensive_magic.jpg',
        offensiveInstant: 'instant_offensive_magic.jpg',
        parry: 'parry.jpg',
        physicalResistance: 'physical_resistance.jpg',
        protectionMagic: 'protection_magic.jpg',
        rangedCombat: 'ranged_combat.jpg',
        supportiveBuffs: 'supportive_buff_magic.jpg',
        supportiveUtility: 'supportive_utility_magic.jpg',
        useHeavyWeapons: 'use_heavier_weapons.jpg',
        weightCapacity: 'weight_capacity.jpg'
    };
    WIN_STATS.setId('stats');
    WIN_STATS.close = function() {
        $('#stats').toggleClass('hidden-right');
    };
    // $('#stats').addClass('hidden-right');
    var charWindow = $('#stats .gui-window-content')[0];
    // var branches = [];
    // branches.push( $( document.createElement("div") ).addClass("talent_tree_agility").appendTo(charWindow).attr('id', 'agility_branch' + i) );
    var progressionTree = playerData.skillTree.tree;
    for(var i in progressionTree){
        for(var j in progressionTree[i]){
            var container = $( document.createElement("div") ).addClass("talent-container").appendTo(charWindow).attr('id', 'talent_container ' + j);
            var icon = $( document.createElement("div") ).addClass("talent-icon").appendTo(container);
            icon.data('name', {branch: i, name: j});
            icon.css('background-image', 'url(' + talent_icons_path + talent_icons[j] + ')');
            var levelIndicator = $( document.createElement('div') ).addClass('talent-level').appendTo(icon).attr('id', j);
            levelIndicator.append( document.createTextNode( progressionTree[i][j]) );
        }
    }
    $('.talent-icon').click(function() {
        var data = $(this).data('name');
        GAME.player.requestSkillLevelUp(data);
    });
}
function makeDeathWindow() {
    WIN_DEATH = new guiWindow({
        width: 255,
        height: 60,
        title: "YOU ARE DEAD.",
        icon: "tombstone-icon.png"
    });
    WIN_DEATH.appendHTML("<div class='gui-clist-footer'><center><div class='form-field'><button type='button' id='button_respawn' class='anim-alt'>RESPAWN</button><button id='button_logout' type='button'>LOGOUT</button></div></center></div>");
    WIN_DEATH.center();
    WIN_DEATH.hide();
    $('#button_respawn').click(function() {
        GAME.socket.emit('player-respawn-request', {});
    });
    $('#button_logout').click(function() {
        GAME.socket.emit('player-logout-request', {});
    });
}
function makeRightclickContextMenus () {
    
    var ctxMenuEntity = $( document.createElement("ul") ).addClass("ctx_menu").appendTo(document.body).attr('id', 'ctx_menu_entity').hide();
        $("#ctx_menu_entity").append($( document.createElement("li") ).addClass("ctx_item").attr('id', 'ctx_open').text('open'));
    var ctxMenuMob = $( document.createElement("ul") ).addClass("ctx_menu").appendTo(document.body).attr('id', 'ctx_menu_mob').hide();
        $("#ctx_menu_mob").append($( document.createElement("li") ).addClass("ctx_item").attr('id', 'ctx_attack_mob').text('target'));
    var ctxMenuPlayer = $( document.createElement("ul") ).addClass("ctx_menu").appendTo(document.body).attr('id', 'ctx_menu_player').hide();
        $("#ctx_menu_player").append($( document.createElement("li") ).addClass("ctx_item").attr('id', 'ctx_attack_player').text('target'));
        $("#ctx_menu_player").append($( document.createElement("li") ).addClass("ctx_item").attr('id', 'ctx_talk_to_player').text('talk to'));
    var ctxMenuItem = $( document.createElement("ul") ).addClass("ctx_menu").addClass("ctx_dark_border").appendTo(document.body).attr('id', 'ctx_menu_item').hide();
        $("#ctx_menu_item").append($( document.createElement("li") ).addClass("ctx_item").attr('id', 'ctx_use').text('use'));
        $("#ctx_menu_item").append($( document.createElement("li") ).addClass("ctx_item").attr('id', 'ctx_use_with').text('use with...'));

    var ctxMenuGround = $( document.createElement("ul") ).addClass("ctx_menu").appendTo(document.body).attr('id', 'ctx_menu_default').hide();
        $("#ctx_menu_default").append($( document.createElement("li") ).addClass("ctx_item").attr('id', 'ctx_goto').text('move here'));
        // all context menus will have that
        $(".ctx_menu").append($( document.createElement("li") ).addClass("ctx_sep"));
        $(".ctx_menu").append($( document.createElement("li") ).addClass("ctx_item").attr('id', 'ctx_inspect').text('inspect'));
}
function newLootWindow(entity) {
    console.log(entity);
    $('#' + entity.id).parent().parent().remove(); // remove window when opened again.
    var size = Object.keys(entity.loot).length || 1;
    var WIN_LOOT = new guiWindow({
        width: 128,
        height: Math.ceil(size/4) * 32,
        title: entity.type,
        icon: "player_icon.png",
        position: { y: 220, x: 20 },
        'z-index': _globalZIndex++,
        content: ['<div id=' + entity.id + ' class="slot corpse" size_x=' + 4 + ' size_y=' + Math.ceil(size/4) + '></div>']
    });
    WIN_LOOT.setId('loot');
    var eq = $('#' + entity.id + '.slot').makeContainer();

    GAME.entityManager.getEntities()[entity.id].contents = entity.loot;
    //add client side entity/contents

    for(var i in entity.loot){
        if(entity.loot[i]){
            var item = entity.loot[i];
            var img = GAME.allImages[item.name] || GAME.allImages['placeholder'];
            var itemEl = new itemElement(1, 1, eq, i % 4, Math.floor(i/4), item.id, img.src, item);
        }
    }
}
function newContainerWindow(entity) { //expected content is 2dArray
    console.log(entity);
    $('#' + entity.id).parent().parent().remove(); // remove window when opened again.

    var width = entity.loot.length;
    var height = entity.loot[0].length;
    var WIN_LOOT = new guiWindow({
        width: width * 32,
        height: height * 32,
        title: entity.type,
        icon: "player_icon.png",
        position: { y: 300, x: 20 },
        content: ['<div id=' + entity.id + ' class="slot container" size_x=' + width + ' size_y=' + height + '></div>']
    });
    WIN_LOOT.setId('loot');
    var eq = $('#' + entity.id + '.slot').makeContainer();

    GAME.entityManager.getEntities()[entity.id].contents = entity.loot;
    //add client side entity/contents


    for(var i = 0; i < width; i++){
        for(var j = 0; j < height; j++){
            if(entity.loot[i][j]){
                var item = entity.loot[i][j];
                var img = GAME.allImages[item.name] || GAME.allImages['placeholder'];
                var itemEl = new itemElement(1, 1, eq, i, j, item.id, img.src, item);
            }
        }
    }
}