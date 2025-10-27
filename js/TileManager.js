class TileManager {
    constructor(game) {
        this.game = game;
        this.map = [];
        this.collapseTimes = {};
        this.dynamitePlacements = new Set(); // Store dynamite placement centers
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

        // First clear any existing decorations
        tile.classList.remove('dynamite-placed', 'dynamite-hover');
        tile.removeAttribute('data-has-dynamite');
        
        // Check if this tile is part of a dynamite blast area
        for (let placement of this.dynamitePlacements) {
            const [dx, dy] = placement.split(',').map(Number);
            // Add dynamite icon to center tile
            if (x === dx && y === dy) {
                tile.innerText = '💣';
                tile.style.fontSize = '16px';
                tile.setAttribute('data-has-dynamite', 'true');
                // Set the tile type to dynamite in the map
                this.map[y][x] = GameConfig.TILE_TYPES.DYNAMITE;
            }
            // Add red highlight to 3x3 area
            if (Math.abs(x - dx) <= 1 && Math.abs(y - dy) <= 1) {
                tile.classList.add('dynamite-placed');
            }
        }

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

    async explodeDynamite(x, y) {
        // Mine a 3x3 area around the dynamite
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const targetX = x + dx;
                const targetY = y + dy;
                if (targetX >= 0 && targetX < GameConfig.MAP_WIDTH &&
                    targetY >= 0 && targetY < GameConfig.MAP_HEIGHT) {
                    // Don't explode other dynamite, ladders, or shoring
                    const targetTile = this.getTile(targetX, targetY);
                    if (targetTile !== GameConfig.TILE_TYPES.DYNAMITE &&
                        targetTile !== GameConfig.TILE_TYPES.LADDER &&
                        targetTile !== GameConfig.TILE_TYPES.SHORING) {
                        this.mineTile(targetX, targetY, false);
                    }
                }
            }
        }
        // Finally remove the dynamite itself
        this.setTile(x, y, GameConfig.TILE_TYPES.EMPTY);
    }

    mineTile(x, y, checkDynamite = true) {
        const tileType = this.getTile(x, y);
        if (tileType !== GameConfig.TILE_TYPES.EMPTY && 
            tileType !== GameConfig.TILE_TYPES.SKY &&
            tileType !== GameConfig.TILE_TYPES.LADDER &&
            tileType !== GameConfig.TILE_TYPES.SHORING) {
            
            if (checkDynamite && tileType === GameConfig.TILE_TYPES.DYNAMITE) {
                this.explodeDynamite(x, y);
                return;
            }

            if (tileType === GameConfig.TILE_TYPES.DYNAMITE) {
                // Clear surrounding highlights for dynamite
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const nearbyX = x + dx;
                        const nearbyY = y + dy;
                        if (nearbyX >= 0 && nearbyX < GameConfig.MAP_WIDTH &&
                            nearbyY >= 0 && nearbyY < GameConfig.MAP_HEIGHT) {
                            const nearbyTile = document.querySelector(`[data-x="${nearbyX}"][data-y="${nearbyY}"]`);
                            if (nearbyTile) {
                                nearbyTile.classList.remove('dynamite-placed', 'dynamite-hover');
                            }
                        }
                    }
                }
            }

            // Clear any dynamite-specific attributes from this tile
            const tile = document.querySelector(`[data-x="${x}"][data-y="${y}"]`);
            if (tile) {
                tile.classList.remove('dynamite-placed', 'dynamite-hover');
                tile.removeAttribute('data-has-dynamite');
                if (tileType === GameConfig.TILE_TYPES.DYNAMITE) {
                    tile.innerText = '';
                }
            }

            // Set the tile to empty
            this.setTile(x, y, GameConfig.TILE_TYPES.EMPTY);

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
        const displayManager = this.game.displayManager;
        const itemType = displayManager.selectedShopItem;
        if (!itemType || this.game.miningEnabled) return;

        const item = GameConfig.SHOP_ITEMS[itemType];
        if (this.game.money < item.price) {
            alert(`Not enough money! You need $${item.price}`);
            return;
        }

        // Special handling for dynamite - can be placed on any valid tile
        if (itemType === 'DYNAMITE') {
            if (this.canPlaceItem(itemType, x, y)) {
                this.dynamitePlacements.add(`${x},${y}`);
                
                // Update the center tile
                this.setTile(x, y, GameConfig.TILE_TYPES.DYNAMITE);
                const centerTile = document.querySelector(`[data-x="${x}"][data-y="${y}"]`);
                if (centerTile) {
                    centerTile.innerText = '💣';
                    centerTile.setAttribute('data-has-dynamite', 'true');
                }

                // Update the blast area
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const targetX = x + dx;
                        const targetY = y + dy;
                        if (targetX >= 0 && targetX < GameConfig.MAP_WIDTH &&
                            targetY >= 0 && targetY < GameConfig.MAP_HEIGHT) {
                            const tile = document.querySelector(`[data-x="${targetX}"][data-y="${targetY}"]`);
                            if (tile) {
                                tile.classList.add('dynamite-placed');
                            }
                        }
                    }
                }

                // Deduct cost and update display
                this.game.money -= item.price;
                this.game.displayManager.updateMoneyDisplay();
                // Don't cancel build mode - allow continued placement
            }
            return;
        }

        // First click - set start point for other items
        if (displayManager.buildStartX === null) {
            if (this.canPlaceItem(itemType, x, y)) {
                displayManager.buildStartX = x;
                displayManager.buildStartY = y;
                displayManager.updatePlaceableHighlights(x, y);
            }
            return;
        }

        // Second click - handle build or cancel
        // If clicking on start position, cancel the build
        if (x === displayManager.buildStartX && y === displayManager.buildStartY) {
            displayManager.cancelBuild();
            return;
        }

        // Get tiles to place based on current hover position
        const placeableTiles = displayManager.updatePlaceableHighlights(x, y);
        
        if (!placeableTiles || placeableTiles.length === 0) {
            return; // Invalid placement, do nothing
        }

        // Calculate total cost
        const totalCost = placeableTiles.length * item.price;
        if (this.game.money < totalCost) {
            return; // Not enough money, do nothing
        }

        // Place all items
        placeableTiles.forEach(pos => {
            this.setTile(pos.x, pos.y, GameConfig.TILE_TYPES[itemType]);
        });

        // Deduct total cost and update display
        this.game.money -= totalCost;
        this.game.displayManager.updateMoneyDisplay();
        
        // Reset build state
        displayManager.cancelBuild();
    }

    canPlaceItem(itemType, x, y) {
        if (itemType === 'LADDER') {
            // Allow ladder if:
            // 1. It's at or below surface height (y >= surface)
            // 2. OR it connects to another ladder above or below
            // 3. OR it has a solid block below (not empty/sky)
            const atOrBelowSurface = y >= GameConfig.SURFACE_HEIGHT;
            const connectsToLadder = (y > 0 && this.map[y-1][x] === GameConfig.TILE_TYPES.LADDER) ||
                                   (y < GameConfig.MAP_HEIGHT-1 && this.map[y+1][x] === GameConfig.TILE_TYPES.LADDER);
            const belowIsSolid = y < GameConfig.MAP_HEIGHT-1 && 
                                this.map[y+1][x] !== GameConfig.TILE_TYPES.EMPTY && 
                                this.map[y+1][x] !== GameConfig.TILE_TYPES.SKY;
            
            return atOrBelowSurface || connectsToLadder || belowIsSolid;
        } else if (itemType === 'SHORING') {
            const isSolid = tile => tile !== GameConfig.TILE_TYPES.EMPTY && tile !== GameConfig.TILE_TYPES.SKY;
            return y === GameConfig.MAP_HEIGHT-1 || 
                   isSolid(this.map[y+1][x]) ||
                   this.map[y+1][x] === GameConfig.TILE_TYPES.SHORING;
        } else if (itemType === 'DYNAMITE') {
            // First check if there's any dynamite in the surrounding area
            for (let dy = -2; dy <= 2; dy++) {
                for (let dx = -2; dx <= 2; dx++) {
                    const nearbyX = x + dx;
                    const nearbyY = y + dy;
                    if (nearbyX >= 0 && nearbyX < GameConfig.MAP_WIDTH &&
                        nearbyY >= 0 && nearbyY < GameConfig.MAP_HEIGHT) {
                        if (this.map[nearbyY][nearbyX] === GameConfig.TILE_TYPES.DYNAMITE) {
                            return false; // Can't place near other dynamite
                        }
                    }
                }
            }

            // Check if the target position is within 2 tiles of an access point
            for (let dy = -2; dy <= 2; dy++) {
                for (let dx = -2; dx <= 2; dx++) {
                    const checkX = x + dx;
                    const checkY = y + dy;
                    
                    // Skip if out of bounds
                    if (checkX < 0 || checkX >= GameConfig.MAP_WIDTH ||
                        checkY < 0 || checkY >= GameConfig.MAP_HEIGHT) {
                        continue;
                    }

                    const tile = this.map[checkY][checkX];
                    
                    // Check if this tile is an access point (empty, ladder, or shoring)
                    if (tile === GameConfig.TILE_TYPES.EMPTY || 
                        tile === GameConfig.TILE_TYPES.LADDER ||
                        tile === GameConfig.TILE_TYPES.SHORING) {
                        
                        // Use Euclidean distance instead of Manhattan distance
                        const distance = Math.sqrt(Math.pow(x - checkX, 2) + Math.pow(y - checkY, 2));
                        if (distance <= 2) { // Within 2 tiles reach
                            return true;
                        }
                    }
                }
            }
            return false;
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
        // Only check directly below
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
            // Scan from bottom to top to track falling pieces
            for (let y = GameConfig.MAP_HEIGHT - 2; y >= 0; y--) {
                for (let x = 0; x < GameConfig.MAP_WIDTH; x++) {
                    if (this.map[y][x] === GameConfig.TILE_TYPES.DIRT && !this.hasShoring(x, y)) {
                        if (this.map[y + 1][x] === GameConfig.TILE_TYPES.EMPTY) {
                            // Move one step at a time for smoother animation
                            this.setTile(x, y + 1, GameConfig.TILE_TYPES.DIRT);
                            this.setTile(x, y, GameConfig.TILE_TYPES.EMPTY);
                            changed = true;
                            await sleep(ANIMATION_DELAY);
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

                // Check both stone and ore tiles for collapse
                if (tile === GameConfig.TILE_TYPES.STONE || 
                    tile === GameConfig.TILE_TYPES.GOLD || 
                    tile === GameConfig.TILE_TYPES.IRON || 
                    tile === GameConfig.TILE_TYPES.COAL) {
                    
                    // Only start collapse timer if tile is unsupported and has empty space below
                    if (!this.hasShoring(x, y) && this.hasEmptyBelow(x, y)) {
                        if (!this.collapseTimes[key]) {
                            this.collapseTimes[key] = GameConfig.INITIAL_COLLAPSE_TIMER;
                            this.updateTileDisplay(x, y);
                        }
                    } else {
                        // Remove timer if tile is now supported
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
            
            // Check if the tile still needs to collapse
            if (!this.hasEmptyBelow(x, y) || this.hasShoring(x, y)) {
                delete this.collapseTimes[key];
                this.updateTileDisplay(x, y);
                continue;
            }

            this.collapseTimes[key]--;

            if (this.collapseTimes[key] <= 0) {
                delete this.collapseTimes[key];
                // Convert any collapsible tile to dirt when timer expires
                const tile = this.map[y][x];
                if (tile === GameConfig.TILE_TYPES.STONE || 
                    tile === GameConfig.TILE_TYPES.GOLD || 
                    tile === GameConfig.TILE_TYPES.IRON || 
                    tile === GameConfig.TILE_TYPES.COAL) {
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