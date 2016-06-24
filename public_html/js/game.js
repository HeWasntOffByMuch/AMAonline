function Game(playerData, map_size, chunkSize) {
    console.log('new game instance created')
    gameState = {
        chunkSize: {x: 32, y: 16},
        frameTime: new Date().getTime(),
        lastFrameTime: Date.now(),
        tileSize: 32,
        mapSize: map_size,
        dev: {
            drawPlayerPath: false
        }
    }

    this.acceptConnectionAndCall = function(id, peerId) {
        socket.emit('player-call-accept', id);
        console.log('initiating with peerid:', peerId)
        peerTools.initiatePeerAudioCall(id, peerId);
    }
    this.refuseCallAndCancel = function(id) {
        console.log('refusecalland cancel');
        peerTools.endActiveCall(id);
        socket.emit('player-call-refuse', id);;
    };

    var canvas = GAME.canvas;
    var gh = gameState.tileSize;
    var ctx = GAME.ctx;
    var socket = GAME.socket;
    var map = GAME.map = new Map(playerData.x, playerData.y, gameState);
    var player = GAME.player = new Player(null, gameState, playerData);
    makeAllOfThemWindowsNow(playerData);

    this.ping = function(a) {
        socket.emit('ping', a);
    }

    var statusMessage = GAME.statusMessage = new StatusMessage(canvas);
    var movementCheck = new MovementCheck(playerData);
    var entityManager = GAME.entityManager = new EntityManager();
    var popupManager = GAME.popupManager = new PopupManager();
    var anims = GAME.anims = new AnimationManager();
        anims.push(new ShortAnimation(player.x, player.y, 'spawn_puff'));
    var gameLayout = GAME.layout = new GameLayout(ctx);
    var peerTools = GAME.peerTools = new peerJsTools();
    /* GAME OBJECTS */
    var players_data = {};
    this.getMobsData = function() {
        return mobs_data;
    };
    var mobs_data = {};
    this.getPlayersData = function() {
        return players_data;
    };

    // this is basically a queue object updating popups until they're removed
    var popups = [];

    var rightClickedItem = null;
    var rightClickedGamePosition = null;
    var rightClickedUnit = null;
    var targetingWithItem = false;
    

    /* FRAME HANDLING */
    var lastKeyEvent;
    

    var destX;
    var destY;
    var mousepos = {
        x: 0,
        y: 0
    };

    var targetedUnit = GAME.targetedUnit = null;
    var targetedEntity = GAME.targetedEntity = null;


    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = (function() {
            return window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame ||
                window.oRequestAnimationFrame ||
                window.msRequestAnimationFrame ||
                function(callback, element) {
                    window.setTimeout(callback, 1000 / 60);
                };
        })();
    }
    requestAnimationFrame(update);

    function autoTarget() {
        if (GAME.targetedUnit) GAME.targetedUnit.isTargeted = false;
        GAME.targetedUnit = mobzz.min(function(e) {
            return Math.pow((e.x - player.x), 2) + Math.pow((e.y - player.y), 2);
        });
        GAME.targetedUnit && (GAME.targetedUnit.isTargeted = true);
    };

    /* CLICK EVENT HANDLER */
    function handleLeftClick(e) {
        $('.ctx_menu').hide();
        
        if (event.which == 2 || event.which == 3) return; //return on middle and right click

        // mousepos = {
        //     x: (e.clientX - canvas.getBoundingClientRect().left),
        //     y: (e.clientY - canvas.getBoundingClientRect().top)
        // };

        var mpos_x = (mousepos.x / gh) + map.x - 16;
        var mpos_y = (mousepos.y / gh) + map.y - 8;
        destX = GAME.destX = Math.floor(mpos_x);
        destY = GAME.destY = Math.floor(mpos_y);



        if(!player.isDead){
            player.moveQ.findPath(player.tx, player.ty, destX, destY);
            player.movingToTarget = false;
            if (0 < mpos_x - (player.x + player.ax) && mpos_x - (player.x + player.ax) < 1 && 0 < mpos_y - (player.y + player.ay) && mpos_y - (player.y + player.ay) < 1){
                if(targetingWithItem){
                    targetingWithItem = false;
                    document.body.style.cursor = 'default';
                    ctxMenuUseHandler();
                    return;
                }
            }

        }

        for (var i in mobs_data) {
            var enemy = mobs_data[i];
            if (0 < mpos_x - enemy.x && mpos_x - enemy.x < 1 && 0 < mpos_y - enemy.y && mpos_y - enemy.y < 1) {
                player.moveQ.currentPath = [];
                //if currently targeting
                if(targetingWithItem){
                    targetingWithItem = false;
                    document.body.style.cursor = 'default';
                    var itemElement = $('#' + rightClickedItem.id );
                    var itemData = {
                        x: parseInt(itemElement.css('left'), 10)/gh,
                        y: parseInt(itemElement.css('top'), 10)/gh,
                        parentId: itemElement.parent().attr('id')
                    };
                    console.log('itemElement', itemElement)
                    console.log('itemData', itemData)
                    console.log('rightClickedItem', rightClickedItem)
                    // use current right clciked item on whatever is clicked
                    player.useItemOnMob(itemData, enemy);
                    return;
                }
                if (GAME.targetedUnit && GAME.targetedUnit != enemy)
                    GAME.targetedUnit.isTargeted = false;
                GAME.targetedUnit = enemy;
                if(GAME.targetedUnit.isTargeted){
                    GAME.targetedUnit.isTargeted = false;
                    GAME.targetedUnit = null;
                } else {
                    GAME.targetedUnit.isTargeted = true;
                }
                return;
            }
        }
        for (var i in players_data) {
            if (players_data[i].id == player.id) continue;
            var enemy = players_data[i];
            if (0 < mpos_x - enemy.x && mpos_x - enemy.x < 1 && 0 < mpos_y - enemy.y && mpos_y - enemy.y < 1) {
                player.moveQ.currentPath = [];
                //if currently targeting
                if(targetingWithItem){
                    targetingWithItem = false;
                    document.body.style.cursor = 'default';
                    var itemElement = $('#' + rightClickedItem.id );
                    var itemData = {
                        x: parseInt(itemElement.css('left'), 10)/gh,
                        y: parseInt(itemElement.css('top'), 10)/gh,
                        parentId: itemElement.parent().attr('id')
                    };
                    // use current right clciked item on whatever is clicked
                    player.useItemOnPlayer(itemData, enemy);
                    return;
                }
                if (GAME.targetedUnit && GAME.targetedUnit != enemy) GAME.targetedUnit.isTargeted = false;
                (GAME.targetedUnit = enemy).isTargeted = !(GAME.targetedUnit.isTargeted);
                return;
            }
        }

        //if currently targeting and no player nor mob has been selected as target
        //so those would be using items on ground/entities/water/etc.

        // if(targetingWithItem){
        //     targetingWithItem = false;
        //     document.body.style.cursor = 'default';
        //     // use current right clciked item on whatever is clicked
        //     player.useItemOnSomethingElse(rightClickedItem, somethingelse);
        //     return;
        // }


    };
    function ctxMenuInspectHandler() {
        console.log('inspect function')
    };
    function ctxMenuAttackHandler() {
        if (GAME.targetedUnit && GAME.targetedUnit != rightClickedUnit) GAME.targetedUnit.isTargeted = false;
        (GAME.targetedUnit = rightClickedUnit).isTargeted = true;
    };
    function ctxMenuGoToHandler() {

        if(!player.isDead){
            player.moveQ.findPath(player.tx, player.ty, rightClickedGamePosition.x, rightClickedGamePosition.y);
            player.movingToTarget = false;
        }
    };
    function ctxTalkToHandler() {
        GAME.layout.callingNowTab(rightClickedUnit.id, rightClickedUnit.name);
        socket.emit('player-call-request', {peerId: peerTools.getPeerId(), playerCalled: rightClickedUnit.id});
    }
    function ctxMenuUseHandler() {
        var itemElement = $('#' + rightClickedItem.id );
        var itemData = {
            x: parseInt(itemElement.css('left'), 10)/gh,
            y: parseInt(itemElement.css('top'), 10)/gh,
            parentId: itemElement.parent().attr('id')
        };
        player.useItemOnSelf(itemData);
    };
    function ctxMenuUseOnTargetHandler() {
        if(!rightClickedItem) return;
        targetingWithItem = true;
        // check right clicked item use type to check self use etc.
        // add use type

        // document.body.style.cursor = rightClickedItem.style.backgroundImage + ", auto";
        document.body.style.cursor = 'crosshair';
    };
    function ctxMenuOpenHandler() {
        GAME.targetedEntity = null;
        var openX = rightClickedGamePosition.x;
        var openY = rightClickedGamePosition.y;

        var e = entityManager.getEntities();
        for(var i in e){
            if(e[i].x == openX && e[i].y == openY){
                GAME.targetedEntity = e[i];
            }
        }
        if(!player.isDead){
            player.moveQ.findPathToDist(player.tx, player.ty, openX, openY, 1.5);
            player.movingToTarget = true;
        }
    }
    function drawChunks(ctx){
        var player = GAME.player;
    }
    function drawFPS(ctx){
        ctx.save();
        if(fps_skipper++ > 20){
            fps = 1 / ((Date.now() - (gameState.lastFrameTime || gameState.frameTime)) / 1000);
            fps_skipper = 0;
        }
        ctx.font = "12px Tibia Font";
        if(fps >= 60)
            ctx.fillStyle = 'rgba(0, 255, 0, 1)';
        else
            ctx.fillStyle = 'rgba(255, 0, 0, 1)';
        ctx.fillText(Math.round(fps), 2, 14);
        ctx.restore();
    }
    /* DRAW OBJECTS */
    var fps = 60;
    var fps_skipper = 0;
    function draw(ctx) {
        ctx.clearRect(0, 0, GAME.canvas.width, GAME.canvas.height);

        map.draw(ctx);
        entityManager.draw(ctx);
        for(var i in mobs_data){
            mobs_data[i].draw(ctx);
        }
        for(var i in players_data){
            players_data[i].draw(ctx);
        }
        player.draw(ctx);
        
        popupManager.draw(ctx);
        anims.draw(ctx);
        gameLayout.draw();

        ctx.fillStyle = "rgba(0,0,0,0.1)";
        ctx.fillRect(Math.floor(mousepos.x / gh) * gh, Math.floor(mousepos.y / gh) * gh, gh, gh);
        
        //DEBUG
        drawChunks(ctx);
        drawFPS(ctx);

    }


    /* GAME LOOP */
    function update() {
        gameState.frameTime = new Date().getTime();
        // audio.update();
        checkInput();
        player.update();
        map.update();
        for(var i in players_data){
            players_data[i].update();
        }
        for(var i in mobs_data){
            mobs_data[i].update();
        }
        movementCheck.update();
        popupManager.update();
        anims.update();
        statusMessage.update();
        entityManager.update();
        // map.update(player);
        // entities.update();
        // actionBar.update();
        // experienceBar.update();

        // player.update();

        // for(var i in players_data) players_data[i].update();
        // for(var i in mobs_data) mobs_data[i].update();

        // missiles.update();

        // statusMessage.update();
        // for(var i = 0; i<popups.length;i++) popups[i].update();
        draw(ctx);

        gameState.lastFrameTime = Date.now();

        requestAnimationFrame(update);
    }

    function checkInput() {
        if (!lastKeyEvent) return;

        var e = lastKeyEvent;
        var key = e.which;
        if (key == "87") {
            GAME.player.move(0, -1);
        }
        if (key == "83") {
             GAME.player.move(0, 1);
        }
        if (key == "68") {
             GAME.player.move(1, 0);
        }
        if (key == "65") {
             GAME.player.move(-1, 0);
        }
        if (key == "117") { // F6
            this.ping();
        }
        if (key == "49") { //1
            if(GAME.targetedUnit)
                GAME.player.attack(GAME.targetedUnit);
        }
        if (key == "50") { //2
            rightClickedItem = $('#skill0')[0].children[0];
            ctxMenuUseOnTargetHandler();
            $('.ctx_menu').hide();
        }
        if (key == "51") { //3
            rightClickedItem = $('#skill1')[0].children[0];
            ctxMenuUseOnTargetHandler();
            $('.ctx_menu').hide();
        }
        if (key == "52") { //4
            rightClickedItem = $('#skill2')[0].children[0];
            ctxMenuUseOnTargetHandler();
            $('.ctx_menu').hide();
        }
        if (key == "53") { //5
            rightClickedItem = $('#skill3')[0].children[0];
            ctxMenuUseOnTargetHandler();
            $('.ctx_menu').hide();
        }
        if (key == "67") { // C
            $('#equipment').toggle({duration: 150});
        }
        if (key == "73") { // I
            $('#backpack').toggle({duration: 150});
        }
        if (key == "75") { // K
            $('#stats').toggleClass('hidden-right');
        }


        lastKeyEvent = null;
    }

    $(function() {
        $(document).ready(function() {
            window.onbeforeunload =  function() {
                if(player.inCombat)
                    return "IF YOU'RE IN COMBAT YOU WILL NOT BE LOGGED OUT WHEN YOU REFRESH THE PAGE.";
            };
        });
        $(document).keydown(function(e) {
            lastKeyEvent = e;
        });
        $('.game-container').mousemove(function(e){
            var canvasX = canvas.width/$('.canvas').width();
            var canvasY = canvas.height/$('.canvas').height();
            mousepos = {x: (e.clientX - canvas.getBoundingClientRect().left)*canvasX, y:(e.clientY - canvas.getBoundingClientRect().top)*canvasY};
        });
        $('.game-container').on('dragstart', function(event) { event.preventDefault(); });
        $('.game-container').mouseup(handleLeftClick);
        
        //disable context menu on all gui windows.
        $(document).on('contextmenu', '.gui-window', function(e) {
            e.preventDefault();
            //set up custom ctx menu for items.
        });
        $(document).on('contextmenu', '.item', function(e) {
            $('.ctx_menu').hide();
            rightClickedItem = this;
            $('#ctx_menu_item').css({left: e.clientX, top: e.clientY}).show();
            //set up custom ctx menu for items.
        });
        $('.gui-window').click(function(e) {
            $('.ctx_menu').hide();
        })
        $(".game-container")[0].oncontextmenu = function(e){
            e.preventDefault();
            $('.ctx_menu').hide();

            targetingWithItem = false;
            document.body.style.cursor = 'default';

            var mpos_x = (mousepos.x / gh) + map.x - 16;
            var mpos_y = (mousepos.y / gh) + map.y - 8;
            var tileX = Math.floor(mpos_x);
            var tileY = Math.floor(mpos_y);
            rightClickedGamePosition = {x: tileX, y: tileY};
            // if entity clicked
            var allEnt = entityManager.getEntities(); //optimize
            for(var i in allEnt){
                if(allEnt[i].x == tileX && allEnt[i].y == tileY){
                    $("#ctx_menu_entity").css({left: e.clientX, top: e.clientY}).show();
                    return false;
                }
            }

            //if mob clicked
            for(var i in mobs_data){
                if(0 < mpos_x - mobs_data[i].x && mpos_x - mobs_data[i].x < 1 && 0 < mpos_y - mobs_data[i].y && mpos_y - mobs_data[i].y < 1){
                    rightClickedUnit = mobs_data[i];
                    $("#ctx_menu_mob").css({left: e.clientX, top: e.clientY}).show();
                    return false;
                }
            }
            //if player clicked
            for(var i in players_data){
                if(0 < mpos_x - players_data[i].x && mpos_x - players_data[i].x < 1 && 0 < mpos_y - players_data[i].y && mpos_y - players_data[i].y < 1){
                    rightClickedUnit = players_data[i];
                    $("#ctx_menu_player").css({left: e.clientX, top: e.clientY}).show();
                    return false;
                }
            }

             $("#ctx_menu_default").css({left: e.clientX, top: e.clientY}).show();
            return false;
        };
        $('.ctx_menu').each(function() {
            $(this)[0].oncontextmenu = function(e) { //disable contextmenu on custom rightclick element
                // save mouse position for later use?
                e.preventDefault();
            };
        });
        $('#ctx_attack_mob').click(function() {
            ctxMenuAttackHandler();
            $('.ctx_menu').hide();
        });
         $('#ctx_attack_player').click(function() {
            ctxMenuAttackHandler();
            $('.ctx_menu').hide();
        });
        $('#ctx_open').click(function() {
            ctxMenuOpenHandler();
            $('.ctx_menu').hide();
        });
        $('#ctx_inspect').click(function() {
            // if dist > defaultInspectDistance
            ctxMenuInspectHandler();
            $('.ctx_menu').hide();
        });
        $('#ctx_goto').click(function() {
            ctxMenuGoToHandler();
            $('.ctx_menu').hide();
        });
        $('#ctx_use').click(function() {
            ctxMenuUseHandler();
            $('.ctx_menu').hide();
        });
        $('#ctx_use_with').click(function() {
            ctxMenuUseOnTargetHandler();
            $('.ctx_menu').hide();
        });
        $('#ctx_talk_to_player').click(function() {
            ctxTalkToHandler();
            $('.ctx_menu').hide();
        });
    });
    socket.on('player-data-update', function(data) {
        for(var p in data){
            var id = data[p]._id;
            if(data[p].type === enums.objType.PLAYER){
                if(id == player.id){
                    // movementCheck.addClientMove(player.tx, player.ty);
                    // movementCheck.addServerMove(data[p].tx, data[p].ty);
                    // movementCheck.check(data[p].tx, data[p].ty)
                    player.updateHealth(data[p].healthCur);
                    player.healthMax = data[p].healthMax;
                    player.manaCur = data[p].manaCur;
                    player.manaMax = data[p].manaMax;
                    player.speedCur = data[p].speedCur;
                    player.isVisible = data[p].isVisible;
                    player.attackSpeed = data[p].attackSpeed;
                    // obviously a player will be off by a fraction. use this to log if position is wrong by a whole number
                    // if(!player.moving && ( player.tx != data[p].tx || player.ty != data[p].ty )){
                    //     GAME.statusMessage.showMessage({message: 'Player position out of sync', color: 'green', time: 1000});
                    // }
                    continue; // that means dont create nor update otherPlayer for GAME.player
                }
                if(!players_data.hasOwnProperty(id)){
                    players_data[id] = new OtherPlayer(gameState, data[p]);
                    // console.log('added player from server');
                } else {
                    if(players_data[id].tx != data[p].tx || players_data[id].ty != data[p].ty)
                        players_data[id].move(data[p].tx, data[p].ty);
                    players_data[id].updateHealth(data[p].healthCur);
                    players_data[id].speedCur = data[p].speedCur;
                }
            } else if(data[p].type === enums.objType.MOB) {
                if(!mobs_data.hasOwnProperty(id)){
                    mobs_data[id] = new Mob(gameState, data[p]);
                    // console.log('added mob from server');
                } else {
                    if(mobs_data[id].tx != data[p].tx || mobs_data[id].ty != data[p].ty){
                        mobs_data[id].move(data[p].tx, data[p].ty);
                    }
                    mobs_data[id].updateHealth(data[p].healthCur);
                }
            }
        }
    });
    socket.on('mob-death', function(data) { //primitive for now.
        if(mobs_data.hasOwnProperty(data.id))
            mobs_data[data.id].die();
    });
    socket.on('move-queue-invalid', function(data) { //data is player pos from server
        console.log('snapback from server')
        player.x = data.x;
        player.y = data.y;
        player.tx = data.x;
        player.ty = data.y
        player.moveQ.currentPath = [];
    });
    socket.on('you-have-died', function() {
        console.log('player died')
        player.die();
        //add come cover
        //add button to respawn
    });
    socket.on('player-logout-response', function() {
        player.inCombat = false;
        $(location)[0].reload();
    });
    socket.on('player-respawn-response', function(data) {
        player.respawn(data.x, data.y);
    });
    socket.on('map-entity-added', function(data) {
        entityManager.addEntity(data.id, data.entity);
    });
    socket.on('map-entity-removed', function(data) {
        entityManager.removeEntity(data.id);
    });
    socket.on('other-player-died', function(data) {
        if(data.id != player.id)
            players_data[data.id].die();
    });
    socket.on('player-logged-out', function(_id) {
        if(players_data.hasOwnProperty(_id)){
            GAME.map.freeSpot(players_data[_id].tx, players_data[_id].ty)
            delete players_data[_id];
        }
    });
    socket.on('player-combat-start', function() {
        player.inCombat = true;
    });
    socket.on('player-combat-end', function() {
        player.inCombat = false;
    });
    socket.on('player-gained-exp', function(data) {
        player.gainExperience(data);
    });
    socket.on('player-level-up', function() {
        // player.levelUp();
    });
    socket.on('player-attack-melee', function(data) {
        if(players_data.hasOwnProperty(data.id)){
            players_data[data.id].attack(data.target, 'melee');
        }
    });
    socket.on('player-attack-range', function(data) {
        if(players_data.hasOwnProperty(data.id)){
            players_data[data.id].attack(data.target, 'ranged', data.hit);
        }
    });
    socket.on('entity-content-response', function(data) {
        GAME.layout.openEntity(data);
    });
    socket.on('player-used-item', function(data) {
        player.removeItem(data);
    });
    socket.on('player-call-incoming', function(data) {
        GAME.layout.incomingCallTab(data.callerId, data.callerName, data.peerId);
    });
    socket.on('player-call-refuse', function(id) {
        GAME.layout.removePhoneTabById(id);
    });
    socket.on('player-call-accept', function(id) {
        GAME.layout.changeIntoActiveCallTabById(id);
    });
    socket.on('player-skill-response', function(data) {
        GAME.layout.setSkillLevelAfterLeveling(data.branch, data.name, data.level);
    });
    socket.on('you-toggled-invisibility', function(data) {
        player.toggleInvisibility(data);
    });
    socket.on('other-player-toggled-invisibility', function(data) {
        if(data.id != player.id)
            players_data[data.id].toggleInvisibility();
    });
    socket.on('server-message', function(data) {
        statusMessage.showMessage(data);
    });
    socket.on('spell-effect-triggered', function(data) {
        GAME.animationFunctions[data.name](data);
    });
}