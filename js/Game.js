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
            [GameConfig.TILE_TYPES.IRON]: 50,
            [GameConfig.TILE_TYPES.COAL]: 10
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
        this.loop.start(); // Start the game loop
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
            // First detonate all dynamite
            await this.detonatePlacedDynamite();
            
            // Then process timers and collapse dirt
            this.tileManager.processCollapseTimers();
            await this.tileManager.collapseAllDirt();
            
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

    async detonatePlacedDynamite() {
        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        const EXPLOSION_DELAY = 200; // Time between each dynamite explosion
        let minedOres = 0;

        // Process each dynamite placement
        for (const placement of this.tileManager.dynamitePlacements) {
            const [x, y] = placement.split(',').map(Number);
            
            // First clear the visual effects in the 3x3 area
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const targetX = x + dx;
                    const targetY = y + dy;
                    if (targetX >= 0 && targetX < GameConfig.MAP_WIDTH &&
                        targetY >= 0 && targetY < GameConfig.MAP_HEIGHT) {
                        const tile = document.querySelector(`[data-x="${targetX}"][data-y="${targetY}"]`);
                        if (tile) {
                            tile.classList.remove('dynamite-preview');
                            tile.removeAttribute('data-has-dynamite');
                            tile.style.fontSize = '';
                            tile.innerText = '';
                        }
                    }
                }
            }

            // Process 5x5 area (3x3 blast + adjacent tiles)
            for (let dy = -2; dy <= 2; dy++) {
                for (let dx = -2; dx <= 2; dx++) {
                    const targetX = x + dx;
                    const targetY = y + dy;
                    
                    if (targetX >= 0 && targetX < GameConfig.MAP_WIDTH &&
                        targetY >= 0 && targetY < GameConfig.MAP_HEIGHT) {
                        const targetTile = this.tileManager.getTile(targetX, targetY);
                        const isInBlastArea = Math.abs(dx) <= 1 && Math.abs(dy) <= 1;
                        const isAdjacent = Math.abs(dx) <= 2 && Math.abs(dy) <= 2 && !isInBlastArea;

                        if (targetTile !== GameConfig.TILE_TYPES.LADDER &&
                            targetTile !== GameConfig.TILE_TYPES.SHORING &&
                            targetTile !== GameConfig.TILE_TYPES.EMPTY &&
                            targetTile !== GameConfig.TILE_TYPES.SKY) {

                            if (isInBlastArea) {
                                // Direct blast area - destroy everything
                                if (targetTile !== GameConfig.TILE_TYPES.DIRT) {
                                    minedOres++;
                                }
                                this.tileManager.mineTile(targetX, targetY, false);
                            } else if (isAdjacent) {
                                // Adjacent tiles
                                const key = `${targetX},${targetY}`;
                                if (targetTile === GameConfig.TILE_TYPES.DIRT) {
                                    // Destroy adjacent dirt
                                    this.tileManager.mineTile(targetX, targetY, false);
                                } else {
                                    // Just set the initial timer for non-dirt tiles
                                    if (!this.tileManager.collapseTimes[key]) {
                                        this.tileManager.collapseTimes[key] = GameConfig.INITIAL_COLLAPSE_TIMER;
                                        this.tileManager.updateTileDisplay(targetX, targetY);
                                    }
                                }
                            }
                        }
                    }
                }
            }
            
            await sleep(EXPLOSION_DELAY);
        }

        // Clear all dynamite placements
        this.tileManager.dynamitePlacements.clear();
        
        // Update mined tiles counter
        this.minedTiles += minedOres;
        this.displayManager.updateMiningDisplay();
        this.checkDayEnd();
    }
}