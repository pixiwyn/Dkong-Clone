var GameState = {
    init: function(customParams) {
        this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        this.scale.pageAlignHorizontally = true;
        this.scale.pageAlignVertically = true;

        this.game.physics.startSystem(Phaser.Physics.ARCADE);
        this.game.physics.arcade.gravity.y = 1000;

        this.cursors = this.game.input.keyboard.createCursorKeys();
        this.spaceBar = this.game.input.keyboard.addKey(Phaser.KeyCode.SPACEBAR);
        
        this.game.world.setBounds(0, 0, 360, 700);
        this.customParams = customParams;
    },
    preload: function() {
        this.load.text('level1', 'assets/data/level1.json');
        this.load.text('level2', 'assets/data/level2.json');
        this.load.text('level3', 'assets/data/level3.json');

        this.load.image('ground', 'assets/images/ground.png');
        this.load.image('barrel', 'assets/images/barrel.png');
        //this.load.image('actionButton', 'assets/images/actionButton.png');
        //this.load.image('arrowButton', 'assets/images/arrowButton.png');
        this.load.image('platform', 'assets/images/platform.png');
        this.load.image('princess', 'assets/images/princess.png');
        this.load.image('bowser', 'assets/images/bowser.png');

        this.load.audio('stage_1_audio', ['assets/audio/luigis.mp3']);

        this.load.spritesheet('fire', 'assets/images/fire_spritesheet.png', 20, 21, 2, 1, 1);
        this.load.spritesheet('player', 'assets/images/player_spritesheet.png', 29, 30, 5, 1, 1);
    },
    create: function() {
        this.winner = false;
        this.levelData = JSON.parse(this.game.cache.getText('level' + this.customParams.level));

        //play music for stage
        this.music = this.add.audio('stage_1_audio');
        this.music.play('', 0, 1, true);

        this.ground = this.add.sprite(0, 638, 'ground');
        
        this.game.physics.arcade.enable(this.ground);
        this.ground.body.allowGravity = false;
        this.ground.body.immovable = true;

        /*var platformData = [
            {"x": 0, "y": 430},
            {"x": 45, "y": 560},
            {"x": 90, "y": 290},
            {"x": 0, "y": 140}
        ];*/

        this.platforms = this.add.group();
        this.platforms.enableBody = true;

        this.levelData.platformData.forEach(function(element){
            this.platforms.create(element.x, element.y, 'platform');
        }, this);

        this.platforms.setAll('body.immovable', true);
        this.platforms.setAll('body.allowGravity', false);

       /*this.platform = this.add.sprite(0, 300, 'platform');

        this.game.physics.arcade.enable(this.platform);
        this.platform.body.allowGravity = false;
        this.platform.body.immovable = true;*/
        
        //fires
        this.fires = this.add.group();
        this.fires.enableBody = true;
        
        this.levelData.fireData.forEach(function(element){
            var fire = this.fires.create(element.x, element.y, 'fire');            
            fire.animations.add('fire', [0,1], 4, true);
            fire.play('fire');
        }, this);

        this.fires.setAll('body.allowGravity', false);

        //gorilla
        this.princess = this.add.sprite(this.levelData.goal.x, this.levelData.goal.y, 'princess');
      //  this.gorilla.anchor.setTo(0.5);
        this.game.physics.arcade.enable(this.princess);
        this.princess.body.allowGravity = false;

        this.bowser = this.add.sprite(this.levelData.goal.x + 42, this.levelData.goal.y, 'bowser');
        this.game.physics.arcade.enable(this.bowser);
        this.bowser.body.allowGravity = false;

        //player
        this.player = this.add.sprite(this.levelData.playerStart.x, this.levelData.playerStart.y, 'player', 3);
        this.player.anchor.setTo(0.5);
        this.player.animations.add('walking', [0,1,2,1], 6, true);
        this.player.scale.setTo(this.levelData.playerStart.d, 1);

        this.game.physics.arcade.enable(this.player);
        
        //wrap around requires use of 2 sprites on each side
        //so having it just collide for now.
        this.player.body.collideWorldBounds = true; 

        this.game.camera.follow(this.player);

        var style = {
            font: 'bold 14pt Courier New',
            fill: '#fff',
            align: 'center'
        }

        this.lifeCount = this.game.add.text(this.game.width - 38, 20, 'Life: ' + this.customParams.life, style);
        this.levelCount = this.game.add.text(this.game.width - 44, 40, 'Level: ' + this.customParams.level, style);
        
        this.lifeCount.anchor.setTo(0.5);
        this.lifeCount.fixedToCamera = true;

        this.levelCount.anchor.setTo(0.5);
        this.levelCount.fixedToCamera = true;


        //barrels
        this.barrels = this.add.group();
        this.barrels.enableBody = true;
        
        this.createBarrel();
        this.barrelCreator = this.game.time.events.loop(Phaser.Timer.SECOND * this.levelData.barrelFrequency, this.createBarrel, this);
    },
    update: function() {
        this.game.physics.arcade.collide(this.player, this.ground);
        this.game.physics.arcade.collide(this.player, this.platforms);
        
        this.game.physics.arcade.collide(this.barrels, this.ground);
        this.game.physics.arcade.collide(this.barrels, this.platforms);

        if(!this.levelData.debug){
            this.game.physics.arcade.overlap(this.player, this.princess, this.win, null, this);
            this.game.physics.arcade.overlap(this.player, this.fires, this.killPlayer, null, this);
            this.game.physics.arcade.overlap(this.player, this.barrels, this.killPlayer, null, this);
            this.game.physics.arcade.overlap(this.player, this.bowser, this.killPlayer, null, this);
        }
    
        //this.game.physics.arcade.overlap(this.player, this.platform);        

        this.player.body.velocity.x = 0;
        
        if(this.cursors.left.isDown){
            this.player.body.velocity.x = -180;
            
            this.player.scale.setTo(1, 1);
            this.player.play("walking");
        } else if(this.cursors.right.isDown){
            this.player.body.velocity.x = 180;
            
            this.player.scale.setTo(-1, 1);
            this.player.play("walking");
        } else {
            this.player.animations.stop();
            this.player.frame = 3;
        }

        if(this.spaceBar.isDown && this.player.body.touching.down){
            this.player.body.velocity.y = -550;
        }

        this.barrels.forEach(function(element){
            if(element.x < 10 && element.y > 600){
                element.kill();
            }
        }, this);
    },
    killPlayer: function(player, fire){
        if(!this.winner){
            this.music.stop();
            this.customParams.life -= 1;
            if(this.customParams.life == 0){
                alert("Loser!");
                this.customParams.life = 3;
                this.customParams.level = 1;
            }
            game.state.start('GameState',  true, false, this.customParams);
        }
    },
    win: function(player, princess){
        this.winner = true;
        this.music.stop();
        alert("Winner!");
        //this.customParams.life = 3;
        if(this.customParams.level < 3){
            this.customParams.level += 1;
        }
        game.state.start('GameState',  true, false, this.customParams);
    },
    createBarrel: function(){
        //give first dead sprite
        var barrel = this.barrels.getFirstExists(false);

        if(!barrel){
            barrel = this.barrels.create(0, 0, 'barrel');
        }

        barrel.reset(this.levelData.goal.x + 82, this.levelData.goal.y + 30);
        barrel.body.velocity.x = this.levelData.barrelSpeed;
        barrel.body.collideWorldBounds = true;
        barrel.body.bounce.set(1, 0);
    }
};

var customParams = {"life": 3, "level": 1};

var game = new Phaser.Game(360, 592, Phaser.AUTO);
game.state.add('GameState', GameState);
game.state.start('GameState',  true, false, customParams);