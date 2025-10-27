class TileManager {
    constructor(game) {
        this.game = game;
        this.map = [];
        this.collapseTimes = {};
    }

    generateMap() {
        this.map = MapGenerator.generateMap();
    }

    getTile(x, y) {
        if (y < 0 || y >= GameConfig.MAP_HEIGHT || x < 0 || x >= GameConfig.MAP_WIDTH) {
            return null;
        }
        return this.map[y][x];
    }

    setTile(x, y, tileType) {
        if (y >= 0 && y < GameConfig.MAP_HEIGHT && x >= 0 && x < GameConfig.MAP_WIDTH) {
            this.map[y][x] = tileType;
            this.updateTileDisplay(x, y);
        }
    }

    countTotalTiles() {
        let count = 0;
        for (let y = 0; y < GameConfig.MAP_HEIGHT; y++) {
            for (let x = 0; x < GameConfig.MAP_WIDTH; x++) {
                if (this.map[y][x] !== GameConfig.TILE_TYPES.EMPTY && 
                    this.map[y][x] !== GameConfig.TILE_TYPES.SKY &&
                    this.map[y][x] !== GameConfig.TILE_TYPES.DIRT) {
                    count++;
                }
            }
        }
        return count;
    }

    renderMap() {
        const mapElement = document.getElementById('game-map');
        mapElement.innerHTML = '';

        for (let y = 0; y < GameConfig.MAP_HEIGHT; y++) {
            for (let x = 0; x < GameConfig.MAP_WIDTH; x++) {
                const tile = document.createElement('div');
                const tileType = this.map[y][x];
                tile.className = `tile tile-${tileType}`;
                tile.style.left = `${x * GameConfig.TILE_SIZE}px`;
                tile.style.top = `${y * GameConfig.TILE_SIZE}px`;
                tile.dataset.x = x;
                tile.dataset.y = y;
                
                tile.addEventListener('click', () => {
                    if (this.game.displayManager.selectedShopItem) {
                        this.tryPlaceItem(x, y);
                    }
                });

                mapElement.appendChild(tile);
                this.updateTileDisplay(x, y);
            }
        }
    }

    updateTileDisplay(x, y) {
        const tile = document.querySelector(`[data-x="${x}"][data-y="${y}"]`);
        if (!tile) return;

        const tileType = this.map[y][x];
        tile.className = `tile tile-${tileType}`;
        tile.innerText = '';
        tile.title = '';
        tile.style.color = 'white';
        tile.style.textAlign = 'center';
        tile.style.lineHeight = `${GameConfig.TILE_SIZE}px`;

        this.decorateTile(tile, x, y, tileType);
    }

    decorateTile(tile, x, y, tileType) {
        const key = `${x},${y}`;

        if (tileType === GameConfig.TILE_TYPES.LADDER) {
            tile.innerText = GameConfig.SHOP_ITEMS.LADDER.symbol;
        } else if (tileType === GameConfig.TILE_TYPES.SHORING) {
            tile.innerText = GameConfig.SHOP_ITEMS.SHORING.symbol;
        } else if (tileType === GameConfig.TILE_TYPES.STONE && this.collapseTimes[key]) {
            tile.innerText = this.collapseTimes[key];
            tile.style.fontSize = '16px';
        } else if (this.game.oreValues[tileType]) {
            tile.title = `${tileType}: $${this.game.oreValues[tileType]}`;
            tile.style.fontSize = '10px';
            
            if (!this.game.miningEnabled && this.collapseTimes[key]) {
                tile.innerText = this.collapseTimes[key];
                tile.style.fontSize = '16px';
            } else if (this.game.miningEnabled) {
                tile.innerText = '$' + this.game.oreValues[tileType];
            }
        }
    }

    mineTile(x, y) {
        const tileType = this.getTile(x, y);
        if (tileType !== GameConfig.TILE_TYPES.EMPTY && 
            tileType !== GameConfig.TILE_TYPES.SKY &&
            tileType !== GameConfig.TILE_TYPES.LADDER &&
            tileType !== GameConfig.TILE_TYPES.SHORING) {
            
            if (this.game.oreValues[tileType]) {
                this.game.money += this.game.oreValues[tileType];
                this.game.displayManager.updateMoneyDisplay();
            }

            if (tileType !== GameConfig.TILE_TYPES.DIRT) {
                this.game.minedTiles++;
                this.game.displayManager.updateMiningDisplay();
                this.game.checkDayEnd();
            }

            this.setTile(x, y, GameConfig.TILE_TYPES.EMPTY);

            if (y > this.game.player.y && 
                x === this.game.player.x && 
                Math.abs(y - this.game.player.y) === 1 && 
                y < GameConfig.MAP_HEIGHT && 
                this.getTile(this.game.player.x, this.game.player.y) !== GameConfig.TILE_TYPES.LADDER) {
                this.game.player.y = y;
                this.game.player.updatePosition();
            }
        }
    }

    tryPlaceItem(x, y) {
        const itemType = this.game.displayManager.selectedShopItem;
        if (!itemType || this.game.miningEnabled) return;

        const item = GameConfig.SHOP_ITEMS[itemType];
        if (this.game.money < item.price) {
            alert(`Not enough money! You need $${item.price}`);
            return;
        }

        if (this.map[y][x] !== GameConfig.TILE_TYPES.EMPTY) return;

        if (this.canPlaceItem(itemType, x, y)) {
            this.game.money -= item.price;
            this.game.displayManager.updateMoneyDisplay();
            this.setTile(x, y, GameConfig.TILE_TYPES[itemType]);
        } else {
            alert('Cannot place item here!');
        }
    }

    canPlaceItem(itemType, x, y) {
        if (itemType === 'LADDER') {
            return y === GameConfig.SURFACE_HEIGHT || 
                   (y > 0 && this.map[y-1][x] === GameConfig.TILE_TYPES.LADDER) ||
                   (y < GameConfig.MAP_HEIGHT-1 && this.map[y+1][x] === GameConfig.TILE_TYPES.LADDER) ||
                   (y < GameConfig.MAP_HEIGHT-1 && this.map[y+1][x] !== GameConfig.TILE_TYPES.EMPTY && 
                    this.map[y+1][x] !== GameConfig.TILE_TYPES.SKY);
        } else if (itemType === 'SHORING') {
            const isSolid = tile => tile !== GameConfig.TILE_TYPES.EMPTY && tile !== GameConfig.TILE_TYPES.SKY;
            return y === GameConfig.MAP_HEIGHT-1 || 
                   isSolid(this.map[y+1][x]) ||
                   this.map[y+1][x] === GameConfig.TILE_TYPES.SHORING;
        }
        return false;
    }

    hasLadderInColumn(x) {
        for (let y = 0; y < GameConfig.MAP_HEIGHT; y++) {
            if (this.map[y][x] === GameConfig.TILE_TYPES.LADDER) {
                return true;
            }
        }
        return false;
    }

    hasEmptyBelow(x, y) {
        if (y >= GameConfig.MAP_HEIGHT - 1) return false;
        return this.map[y + 1][x] === GameConfig.TILE_TYPES.EMPTY;
    }

    hasTopDiagonalDirt(x, y) {
        // Check if there's a dirt tile diagonally above this position
        if (y > 0) {
            if (x > 0 && this.map[y-1][x-1] === GameConfig.TILE_TYPES.DIRT) return true;
            if (x < GameConfig.MAP_WIDTH - 1 && this.map[y-1][x+1] === GameConfig.TILE_TYPES.DIRT) return true;
        }
        return false;
    }

    findAllEmptyColumns() {
        const columns = [];
        for (let x = 0; x < GameConfig.MAP_WIDTH; x++) {
            // Find first empty tile
            for (let y = 0; y < GameConfig.MAP_HEIGHT; y++) {
                if (this.map[y][x] === GameConfig.TILE_TYPES.EMPTY) {
                    // Check for ladder in the empty space
                    const height = this.getEmptyColumnHeight(x, y);
                    if (height > 0) {
                        columns.push({
                            x: x,
                            startY: y,
                            height: height
                        });
                    }
                    break;
                }
            }
        }
        return columns.sort((a, b) => b.height - a.height); // Sort by height descending
    }

    getEmptyColumnHeight(x, startY = 0) {
        let height = 0;
        for (let y = startY; y < GameConfig.MAP_HEIGHT; y++) {
            if (this.map[y][x] === GameConfig.TILE_TYPES.EMPTY ||
                this.map[y][x] === GameConfig.TILE_TYPES.LADDER) {
                // Only count empty spaces, not ladders
                if (this.map[y][x] === GameConfig.TILE_TYPES.EMPTY) {
                    height++;
                }
            } else {
                break;
            }
        }
        return height;
    }

    async letDirtFallAnimated() {
        const ANIMATION_DELAY = 20; // Even faster delay for falling
        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        let changed;

        do {
            changed = false;
            // Scan from top to bottom for each column
            for (let x = 0; x < GameConfig.MAP_WIDTH; x++) {
                for (let y = 0; y < GameConfig.MAP_HEIGHT - 1; y++) {
                    if (this.map[y][x] === GameConfig.TILE_TYPES.DIRT) {
                        // Try to find the lowest empty spot below this dirt
                        let newY = y;
                        while (newY < GameConfig.MAP_HEIGHT - 1 && 
                               (this.map[newY + 1][x] === GameConfig.TILE_TYPES.EMPTY)) {
                            newY++;
                        }
                        
                        // If we found a new position, move the dirt
                        if (newY !== y && !this.hasShoring(x, y)) {
                            this.setTile(x, newY, GameConfig.TILE_TYPES.DIRT);
                            this.setTile(x, y, GameConfig.TILE_TYPES.EMPTY);
                            changed = true;
                            await sleep(ANIMATION_DELAY);
                            break; // Only move one piece at a time in this column
                        }
                    }
                }
            }
        } while (changed);
    }

    shouldDirtFall(x, y) {
        if (y >= GameConfig.MAP_HEIGHT - 1) return false;
        
        // Allow falling through empty spaces or ladder tiles
        if (this.map[y + 1][x] === GameConfig.TILE_TYPES.EMPTY || 
            this.map[y + 1][x] === GameConfig.TILE_TYPES.LADDER) {
            const hasShoring = this.hasShoring(x, y);
            const isOnLadder = this.map[y][x] === GameConfig.TILE_TYPES.LADDER;
            return !hasShoring && !isOnLadder;
        }
        
        return false;
    }

    hasShoring(x, y) {
        return (x > 0 && this.map[y][x - 1] === GameConfig.TILE_TYPES.SHORING) ||
               (x < GameConfig.MAP_WIDTH - 1 && this.map[y][x + 1] === GameConfig.TILE_TYPES.SHORING);
    }

    checkForCollapsingTiles() {
        for (let y = 0; y < GameConfig.MAP_HEIGHT; y++) {
            for (let x = 0; x < GameConfig.MAP_WIDTH; x++) {
                const tile = this.getTile(x, y);
                const key = `${x},${y}`;

                if (tile === GameConfig.TILE_TYPES.STONE) {
                    // Only start collapse timer if stone is unsupported and has empty space below
                    if (!this.hasShoring(x, y) && this.hasEmptyBelow(x, y)) {
                        if (!this.collapseTimes[key]) {
                            this.collapseTimes[key] = GameConfig.INITIAL_COLLAPSE_TIMER;
                            this.updateTileDisplay(x, y);
                        }
                    } else {
                        // Remove timer if stone is now supported
                        if (this.collapseTimes[key]) {
                            delete this.collapseTimes[key];
                            this.updateTileDisplay(x, y);
                        }
                    }
                }
            }
        }
    }

    processCollapseTimers() {
        for (const key of Object.keys(this.collapseTimes)) {
            const [x, y] = key.split(',').map(Number);
            this.collapseTimes[key]--;

            if (this.collapseTimes[key] <= 0) {
                delete this.collapseTimes[key];
                // Convert stone to dirt when timer expires
                if (this.map[y][x] === GameConfig.TILE_TYPES.STONE) {
                    this.setTile(x, y, GameConfig.TILE_TYPES.DIRT);
                }
            } else {
                this.updateTileDisplay(x, y);
            }
        }
    }

    async collapseAllDirt() {
        const MAX_ITERATIONS = 100;
        let iterations = 0;
        const ANIMATION_DELAY = 20; // Faster animation

        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        const processDirtMove = async (sourceX, sourceY, targetX, targetY) => {
            this.setTile(targetX, targetY, GameConfig.TILE_TYPES.DIRT);
            this.setTile(sourceX, sourceY, GameConfig.TILE_TYPES.EMPTY);
            await sleep(ANIMATION_DELAY);
        };

        do {
            iterations++;
            let changed = false;

            // First, let any loose dirt fall straight down
            await this.letDirtFallAnimated();

            // Look for diagonal moves, scanning from top to bottom
            for (let y = 1; y < GameConfig.MAP_HEIGHT; y++) {
                for (let x = 0; x < GameConfig.MAP_WIDTH; x++) {
                    // If we find an empty space
                    if (this.map[y][x] === GameConfig.TILE_TYPES.EMPTY) {
                        // Look for dirt that can fall diagonally into it
                        if (x > 0 && this.map[y-1][x-1] === GameConfig.TILE_TYPES.DIRT && !this.hasShoring(x-1, y-1)) {
                            await processDirtMove(x-1, y-1, x, y);
                            changed = true;
                            break; // Process one move at a time
                        } 
                        else if (x < GameConfig.MAP_WIDTH - 1 && this.map[y-1][x+1] === GameConfig.TILE_TYPES.DIRT && !this.hasShoring(x+1, y-1)) {
                            await processDirtMove(x+1, y-1, x, y);
                            changed = true;
                            break; // Process one move at a time
                        }
                    }
                }
                if (changed) {
                    // Let dirt fall vertically after each diagonal move
                    await this.letDirtFallAnimated();
                    break; // Process one level at a time
                }
            }

            if (!changed) break;

        } while (iterations < MAX_ITERATIONS);

        // One final pass to ensure all dirt has fallen
        await this.letDirtFallAnimated();
    }
}