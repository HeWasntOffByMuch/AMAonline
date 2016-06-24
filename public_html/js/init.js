// PRE-GAME STUFF
var GAME = {}; // all in one
$(function() {
    var t; // tmp for every fucking thing

    
    var SOCKET = GAME.socket = io(server_address, {secure: true, forceNew: true});


    var gameContainer = GAME.gameContainer = document.createElement("div");
    gameContainer.className = "game-container";
    document.body.appendChild(gameContainer);
    // 1. create game canvas
    var C = GAME.canvas = document.createElement('canvas');
    var ctx = GAME.ctx = C.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    C.className = 'canvas';
    C.width = 1024;
    C.height = 512;
    gameContainer.appendChild(C);

    // var F = GAME.foreground = document.createElement("div");
    // F.className = 'foreground';
    // gameContainer.appendChild(F);

    // gameContainer.appendChild((t = document.createElement("img"), t.src = "./img/gradient_border.png", t.className = 'game-container-filter', t));


    // 2. login screen and logic
    $(".modal-cover").fadeIn();
    var WIN_LOGIN = new guiWindow({
        width: 300,
        height: 200,
        title: "LOG IN",
        icon: "login.png"
    });
    WIN_LOGIN.center();

    WIN_LOGIN.appendHTML("<form><div class='form-field'><label for='username'>USERNAME</label><br><input id='username' name='username' placeholder='USERNAME' type='text'></div><div class='form-field'><label for='password'>PASSWORD</label><br><input id='password' name='password' type='password' placeholder='PASSWORD'></div><br><div class='form-field'><label><input id='remember' name='remember' type='checkbox' disabled='true'> Remember me</label></div><br><div class='form-field'><button type='button' id='button_login' class='anim-alt'>LOG IN</button><button id='button_signup' type='button'>SIGN UP</button></div></form>");
    $('#username').focus();
    $("#password").keyup(function(event){
        if (event.keyCode == 13){
            $("#button_login").click();
            event.stopPropagation();
        }
    });
    $("#button_login").click(function() {
        WIN_LOGIN.appendHTML("<table class='loading-table'><tr><td style='text-align:center'><img src='./img/loading.gif'><br><b>PLEASE WAIT</b></td></tr></table>");
        SOCKET.emit('login-info', {user: $("#username").val(), pass: $("#password").val()});
    });

    // YES AND NO WINDOWS

    var WIN_NO = new guiWindow({
        width: 200,
        height: 75,
        title: "INVALID CREDENTIALS",
        onclose: function() {
            this.hide();
        }
        });
    WIN_NO.center();

    WIN_NO.appendHTML("<div class='gui-clist-footer'><center><button type='button' id='ok_button1'>OK</button></center></div>");
    WIN_NO.hide();
    $("#ok_button1").click(function() {
        WIN_NO.hide();
    });

    var WIN_YES = new guiWindow({
        width: 200,
        height: 75,
        title: "Account created.",
        onclose: function() {
            this.hide();
        }
    });
    WIN_YES.center();

    WIN_YES.appendHTML("<div class='gui-clist-footer'><center><button type='button' id='ok_button2'>OK</button></center></div>");
    WIN_YES.hide();

    $("#ok_button2").click(function() {
        WIN_YES.hide();
    });


    //SIGNUP WINDOW

    var WIN_SIGNUP = new guiWindow({
            width:300,
            height: 200,
            title: 'SIGNUP',
            icon: 'login.gif',
            onclose: function() {
                this.hide();
                WIN_LOGIN.show();
            }
        });
    WIN_SIGNUP.center();

    WIN_SIGNUP.appendHTML( "<form>"+
                                "<div class='form-field'>"+
                                    "<label for='username'>USERNAME</label><br>"+
                                    "<input id='username_signup' name='username' placeholder='USERNAME' type='text'>"+
                                "</div>"+
                                "<div class='form-field'>"+
                                    "<label for='password'>PASSWORD</label><br>"+
                                    "<input id='password_signup' name='password' type='password' placeholder='PASSWORD'>"+
                                "</div>"+
                                "<div class='form-field'>"+
                                    "<label for='password'>REPEAT PASSWORD</label><br>"+
                                    "<input id='password_repeat' name='password' type='password' placeholder='REPEAT PASSWORD'>"+
                                "</div><br>"+
                                "<div class='form-field'>"+
                                "<button id='button_register' type='button'>"+
                                "<i class='fa fa-user-plus'></i> REGISTER</button>"+
                                "</div>"+
                            "</form>");
    WIN_SIGNUP.hide();

    
    $("input:password").chromaHash({
        bars: 4,
        salt: "7be82b35cb0199120eea35a4507c9acf",
        minimum: 6
    });

    //LOGIN WINDOW

    var WIN_PICK = new guiWindow({
        width: 300,
        height: 400,
        title: "SELECT CHARACTER",
        icon: "wizard_hat.png"
    });
    WIN_PICK.center();

    WIN_PICK.hide();



    

    //window for creating a new player
    var WIN_NEWCHAR = new guiWindow({
        width: 300,
        height: 100,
        title: "CREATE PLAYER",
        icon: "newchar.png"
    });
    WIN_NEWCHAR.center();

    WIN_NEWCHAR.appendHTML("<form><div class='form-field'><label for='username'>USERNAME</label><input id='newchar' name='newchar' placeholder='PLAYER NAME' type='text'></div><div class='form-field'><button type='button' id='button_create' class='anim-alt'>CREATE</button><button id='button_back' type='button'>BACK</button></div></form>");
    WIN_NEWCHAR.hide();

    $('#button_create').click(function() {
        SOCKET.emit('create-player', {name: $("#newchar").val()});
    });
    $('#button_back').click(function() {
        WIN_NEWCHAR.hide();
    });
    // newplayer window handlers
    

    $('#button_signup').click(function() {
        WIN_SIGNUP.show()
        WIN_LOGIN.hide();
        
        $('#username_signup').focus();
        $("#password_repeat").keyup(function(event) {
            if (event.keyCode == 13)
                $("#button_register").click();
        });

        $('#button_register').click(function() {
            var register = this;
            if ( !($("#username_signup").val()) ) { // no input in username field
                $('#username_signup').parent().addClass('taken');
                $(register).parent().addClass('taken');
                register.disabled = true;
                $('#username_signup').focus(function() {
                    $('#username_signup').parent().removeClass('taken');
                    $(register).parent().removeClass('taken');
                    register.disabled = false;
                });
            }
            else if( !($("#password_signup").val() && $("#password_repeat").val()) ){
                $("#password_signup").val() || $("#password_signup").parent().addClass('taken');
                $("#password_repeat").val() || $("#password_repeat").parent().addClass('taken');
                $(register).parent().addClass('taken');
                register.disabled = true;
                $('input:password').focus(function() {
                    $('input:password').parent().removeClass('taken');
                    $(register).parent().removeClass('taken');
                    register.disabled = false;
                });
            }
            else if($("#password_signup").val() != $("#password_repeat").val()){
                $(register).parent().addClass('taken');
                register.disabled = true;
                $('input:password').focus(function() {
                    $(register).parent().removeClass('taken');
                    register.disabled = false;
                });
            }
            else{
                SOCKET.emit('sign-up', {user: $("#username_signup").val(), pass1: $("#password_signup").val(), pass2: $("#password_repeat").val()});
                
                SOCKET.on('sign-up-taken', function() {
                    console.log('server - name taken');
                    $('#username_signup').parent().addClass('taken');
                    $('#username_signup').val($('#username_signup').val() + ' is taken');
                    $(register).parent().addClass('taken');
                    register.disabled = true;
                    $('#username_signup').focus(function() {
                        $(this).parent().removeClass('taken');
                        $(this).val('');
                        $(register).removeClass('taken');
                        register.disabled = false;
                    });
                });
            }
        });
    });

    SOCKET.on('start-game-ok', function(data) {
        WIN_PICK.close();
        GAME.instance = new Game(data.playerData, data.mapSize, data.chunkSize);
        $(".game-container").css('background-color', '#000');
        $(".modal-cover").fadeOut();
    });
    SOCKET.on('map-update', function(data) {
        console.log(data)
        build();
        function build(){
            if(!GAME.instance || !GAME.map){
                setTimeout(function(){ build(); }, 100)
            }
            else{
                GAME.map.populateTiles(data.tiles);
                GAME.map.populateCollisions(data.tiles);
                GAME.entityManager.populateEntities(data.tiles);
                // GAME.map.appendTiles(); for divs only
            }
        }
        //window.localStorage format the data and put it there.
    });
    SOCKET.on('sign-up-error', function() {
        WIN_NO.show();
        SOCKET = null;
    });
    SOCKET.on('sign-up-success', function() {
        WIN_SIGNUP.hide();
        WIN_LOGIN.show();
        WIN_YES.show();
    });
    SOCKET.on('player-created', function(data) {
        WIN_NEWCHAR.hide();
        $(".gui-clist-container").append("<div class='gui-clist-item' idd='" + data.id + "'><div class='avatar'></div><div style='padding:4px;'>" + data.name + "<div style='font-size:11px;line-height:11px;'>Level " + data.level + " Human<br>played for: none</div></div></div>");
        $('#newchar').val('');
        $('#new_char').addClass('green');
        setTimeout(function() {
            $('#new_char').removeClass('green');
        }, 300)
        $(".gui-clist-item").click(function() {
            $(".gui-clist-item").removeClass("pressed");
            $(this).addClass("pressed");
        });
    });
    SOCKET.on('player-count-exceeded', function() {
        WIN_NO.changeTitle('PLAYER CAP EXCEEDED.');
        WIN_NO.show();
        console.log('no more, sorry:(');
    });
    SOCKET.on('player-name-taken', function() {
        $("#newchar").val('');
        $("#newchar").attr('placeholder', 'name taken');
        $("#newchar").addClass('taken');
        $('#button_create')[0].disabled = true;
        $("#newchar").focus(function() {
            $("#newchar").attr('placeholder', 'PLAYER NAME');
            $("#newchar").removeClass('taken');
            $('#button_create')[0].disabled = false;
        });
    });
    SOCKET.on('player-name-too-long', function() {
        $("#newchar").val('');
        $("#newchar").attr('placeholder', 'name too long ( max 12 chars )');
        $("#newchar").addClass('taken');
        $('#button_create')[0].disabled = true;
        $("#newchar").focus(function() {
            $("#newchar").attr('placeholder', 'PLAYER NAME');
            $("#newchar").removeClass('taken');
            $('#button_create')[0].disabled = false;
        });
    })
    SOCKET.on('connect', function() {
        console.log('connected to socket.');
    });
    SOCKET.on('connect_error', function(err) {
        $(".loading-table").remove();
    });
    SOCKET.on('disconnect', function() {
        SOCKET = null;
        console.log('disconnected from socket');
        if(GAME && GAME.statusMessage)
            GAME.statusMessage.showMessage({message: 'You have been disconnected, refresh the page.', color: 'red', time: 2000000})
    });
    SOCKET.on('login-failed', function() {
        WIN_NO.show();
        $(".loading-table").remove();
    });
    SOCKET.on('');
    SOCKET.on('login-success', function(data) {
        WIN_LOGIN.hide();
        $(".modal-cover").fadeOut().fadeIn(function() {
            WIN_PICK.show();

            WIN_PICK.appendHTML("<div class='gui-clist'><div class='gui-clist-container' id='gcc'></div><div class='gui-clist-footer'><div class='form-field'><button type='button' id='new_char' class='anim-alt'>NEW CHAR</button><button id='play' type='button'>PLAY</button></div></div></div>");
            for (var i = 0; i < data.length; i++) {
                var t = Math.ceil(data[i].timePlayed/1000); // [s]
                var seconds = Math.floor((t) % 60);
                var minutes = Math.floor((t/60) % 60);
                var hours = Math.floor((t/3600) % 60);
                var time = hours + "h " + minutes + "m " + seconds + "s";

                $(".gui-clist-container").append("<div class='gui-clist-item' idd='" + data[i].id + "'><div class='avatar'></div><div style='padding:4px;'>" + data[i].name + "<div style='font-size:11px;line-height:11px;'>Level " + data[i].level + " Human<br>played for: " + time + "</div></div></div>");
            }
            $(".gui-clist-item").click(function() {
                $(".gui-clist-item").removeClass("pressed");
                $(this).addClass("pressed");
            });
            $('#new_char').click(function() {
                WIN_NEWCHAR.show();
                $('#newchar').focus();
                $("#newchar").keyup(function(event){
                    if (event.keyCode == 13)
                        $("#button_create").click();
                }); 
            });
            // $(".gui-clist-container").first().addClass("pressed");
            $("#play").click(function() {
                if($(".gui-clist-item.pressed").attr("idd")){
                    SOCKET.emit('start-game-request', {
                        id: $(".gui-clist-item.pressed").attr("idd")
                    });
                }
                else{
                    $('#play')[0].disabled = true;
                    setTimeout(function() {
                        $('#play')[0].disabled = false;
                    }, 300)
                }
            });
            
        });
    });
});