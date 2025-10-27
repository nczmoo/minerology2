class Game {
    constructor() {
        this.loop = new Loop();
        this.tileManager = new TileManager(this);
        this.displayManager = new DisplayManager(this);
        this.player = new Player(this);
        this.totalTiles = 0;
        this.minedTiles = 0;
        this.miningEnabled = true;
        this.money = 0;
        this.day = 1;
        this.oreValues = {
            [GameConfig.TILE_TYPES.GOLD]: 100,
            [GameConfig.TILE_TYPES.COPPER]: 30,
            [GameConfig.TILE_TYPES.IRON]: 50,
            [GameConfig.TILE_TYPES.COAL]: 15
        };
        this.init();
    }

    init() {
        this.tileManager.generateMap();
        this.totalTiles = this.tileManager.countTotalTiles();
        this.tileManager.renderMap();
        this.tileManager.checkForCollapsingTiles();
        this.player.create();
        this.setupControls();
        this.displayManager.createDisplays();
        setInterval(() => this.loop.go(), GameConfig.loop_interval_timing);
    }

    setupControls() {
        document.addEventListener('keydown', (e) => {
            let direction = null;
            if (e.key === 'ArrowLeft' || e.key === 'a') direction = GameConfig.DIRECTIONS.LEFT;
            if (e.key === 'ArrowRight' || e.key === 'd') direction = GameConfig.DIRECTIONS.RIGHT;
            if (e.key === 'ArrowDown' || e.key === 's') direction = GameConfig.DIRECTIONS.DOWN;
            if (e.key === 'ArrowUp' || e.key === 'w') direction = GameConfig.DIRECTIONS.UP;

            if (direction) {
                this.player.tryMove(direction);
            }
        });
    }

    checkDayEnd() {
        const maxMineable = 10;
        if (this.minedTiles >= maxMineable) {
            this.miningEnabled = false;
            this.displayManager.showNextDayButton();
            this.player.hide();
            this.displayManager.enableShop();
        }
    }

    async startNextDay() {
        try {
            await this.tileManager.collapseAllDirt();
            this.tileManager.processCollapseTimers();
            
            this.day++;
            this.displayManager.updateDayDisplay();
            this.displayManager.hideNextDayButton();
            
            this.player.resetPosition();
            this.player.show();
            
            this.miningEnabled = true;
            this.minedTiles = 0;
            this.displayManager.updateMiningDisplay();
            this.displayManager.disableShop();
        } catch (error) {
            console.error('Error during next day:', error);
            // Ensure the game is still playable even if there's an error
            this.miningEnabled = true;
            this.player.show();
            this.displayManager.hideNextDayButton();
            this.displayManager.disableShop();
        }
    }
}