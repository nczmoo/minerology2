class DisplayManager {
    constructor(game) {
        this.game = game;
        this.selectedShopItem = null;
        this.buildStartX = null;
        this.buildStartY = null;
    }

    createDisplays() {
        // Create the money display
        const moneyDisplay = document.createElement('div');
        moneyDisplay.id = 'money-display';
        moneyDisplay.className = 'game-display';
        moneyDisplay.style.position = 'absolute';
        moneyDisplay.style.top = '10px';
        moneyDisplay.style.left = '10px';
        document.body.appendChild(moneyDisplay);
        this.updateMoneyDisplay();

        // Create the day display
        const dayDisplay = document.createElement('div');
        dayDisplay.id = 'day-display';
        dayDisplay.className = 'game-display';
        dayDisplay.style.position = 'absolute';
        dayDisplay.style.top = '40px';
        dayDisplay.style.left = '10px';
        document.body.appendChild(dayDisplay);
        this.updateDayDisplay();

        // Create mining progress display
        const miningDisplay = document.createElement('div');
        miningDisplay.id = 'mining-display';
        miningDisplay.className = 'game-display';
        miningDisplay.style.position = 'absolute';
        miningDisplay.style.top = '70px';
        miningDisplay.style.left = '10px';
        document.body.appendChild(miningDisplay);
        this.updateMiningDisplay();

        // Create next day button (hidden initially)
        const nextButton = document.createElement('button');
        nextButton.id = 'next-day-button';
        nextButton.className = 'game-button';
        nextButton.innerText = 'Next Day';
        nextButton.style.position = 'absolute';
        nextButton.style.top = '100px';
        nextButton.style.right = '10px';
        nextButton.style.display = 'none';
        nextButton.onclick = () => this.game.startNextDay();
        document.body.appendChild(nextButton);

        // Create shop interface (hidden initially)
        const shop = document.createElement('div');
        shop.id = 'shop';
        shop.style.position = 'absolute';
        shop.style.top = '140px';
        shop.style.right = '10px';
        shop.style.display = 'none';

        // Add shop items
        for (const [itemType, item] of Object.entries(GameConfig.SHOP_ITEMS)) {
            const itemButton = document.createElement('button');
            itemButton.className = 'game-button';
            itemButton.innerHTML = `
                <span class="shop-item-symbol">${item.symbol}</span>
                <span>${itemType}</span>
                <span class="shop-item-price">$${item.price}</span>
            `;
            itemButton.onclick = () => this.selectShopItem(itemType);
            shop.appendChild(itemButton);
        }

        document.body.appendChild(shop);

        // Add mousemove listener for hover effect
        document.getElementById('game-map').addEventListener('mousemove', (e) => {
            if (!this.selectedShopItem) return;
            
            // Remove previous hover effects
            document.querySelectorAll('.tile-empty.placeable').forEach(tile => {
                tile.classList.remove('placeable');
            });

            // Find tile under mouse
            const tiles = document.querySelectorAll('.tile');
            for (const tile of tiles) {
                const rect = tile.getBoundingClientRect();
                if (e.clientX >= rect.left && e.clientX < rect.right &&
                    e.clientY >= rect.top && e.clientY < rect.bottom) {
                    const x = parseInt(tile.dataset.x);
                    const y = parseInt(tile.dataset.y);
                    
                    // Clear any existing highlights
                    document.querySelectorAll('.dynamite-hover').forEach(t => {
                        t.classList.remove('dynamite-hover');
                    });
                    document.querySelectorAll('.placeable').forEach(t => {
                        t.classList.remove('placeable');
                    });
                    
                    if (this.selectedShopItem === 'DYNAMITE') {
                        // Only proceed if we can place dynamite here and have enough money
                        if (this.game.tileManager.canPlaceItem('DYNAMITE', x, y) && 
                            this.game.money >= GameConfig.SHOP_ITEMS.DYNAMITE.price) {
                            // Show the center tile differently
                            const centerTile = document.querySelector(`[data-x="${x}"][data-y="${y}"]`);
                            if (centerTile) {
                                centerTile.classList.add('dynamite-hover');
                            }
                            
                            // Show the blast area preview
                            for (let dy = -1; dy <= 1; dy++) {
                                for (let dx = -1; dx <= 1; dx++) {
                                    if (dx === 0 && dy === 0) continue; // Skip center
                                    const previewX = x + dx;
                                    const previewY = y + dy;
                                    
                                    if (previewX >= 0 && previewX < GameConfig.MAP_WIDTH &&
                                        previewY >= 0 && previewY < GameConfig.MAP_HEIGHT) {
                                        const previewTile = document.querySelector(`[data-x="${previewX}"][data-y="${previewY}"]`);
                                        if (previewTile) {
                                            previewTile.classList.add('dynamite-hover');
                                        }
                                    }
                                }
                            }
                        }
                    } else {
                        // For other items, use the normal multi-tile highlight system
                        this.updatePlaceableHighlights(x, y);
                    }
                    break;
                }
            }
        });
    }

    updateMoneyDisplay() {
        const display = document.getElementById('money-display');
        if (display) {
            display.innerText = `Money: $${this.game.money}`;
        }
    }

    updateDayDisplay() {
        const display = document.getElementById('day-display');
        if (display) {
            display.innerText = `Day: ${this.game.day}`;
        }
    }

    updateMiningDisplay() {
        const display = document.getElementById('mining-display');
        if (display) {
            display.innerText = `Mined: ${this.game.minedTiles}/10`;
        }
    }

    showNextDayButton() {
        const button = document.getElementById('next-day-button');
        if (button) {
            button.style.display = 'block';
        }
    }

    hideNextDayButton() {
        const button = document.getElementById('next-day-button');
        if (button) {
            button.style.display = 'none';
        }
    }

    enableShop() {
        const shop = document.getElementById('shop');
        if (shop) {
            shop.style.display = 'block';
        }
    }

    disableShop() {
        const shop = document.getElementById('shop');
        if (shop) {
            shop.style.display = 'none';
        }
        this.selectedShopItem = null;
    }

    selectShopItem(itemType) {
        if (this.selectedShopItem === itemType) {
            this.cancelBuild();
        } else {
            this.selectedShopItem = itemType;
            this.buildStartX = null;
            this.buildStartY = null;
            this.clearHighlights();
        }
    }

    cancelBuild() {
        this.selectedShopItem = null;
        this.buildStartX = null;
        this.buildStartY = null;
        this.clearHighlights();
    }

    clearHighlights() {
        document.querySelectorAll('.placeable, .dynamite-hover').forEach(tile => {
            tile.classList.remove('placeable', 'dynamite-hover');
        });
    }

    updatePlaceableHighlights(currentX, currentY) {
        this.clearHighlights();

        if (!this.selectedShopItem) return [];

        const item = GameConfig.SHOP_ITEMS[this.selectedShopItem];
        if (!item || this.game.money < item.price) return [];

        let highlightedTiles = [];

        // Handle dynamite separately from other items
        if (this.selectedShopItem === 'DYNAMITE') {
            return highlightedTiles; // Don't use this method for dynamite highlighting
        }

        // For other items, proceed with normal multi-tile placement logic
        if (!this.game.tileManager.canPlaceItem(this.selectedShopItem, currentX, currentY)) {
            return [];
        }

        // If this is the first click (no build start point)
        if (this.buildStartX === null) {
            if (this.game.tileManager.getTile(currentX, currentY) === GameConfig.TILE_TYPES.EMPTY) {
                highlightedTiles.push({x: currentX, y: currentY});
            }
        }
        // If we have a start point, calculate the path to the current position
        else if (currentX !== null && currentY !== null) {
            if (this.selectedShopItem === 'LADDER') {
                if (currentX === this.buildStartX) {
                    const startY = Math.min(this.buildStartY, currentY);
                    const endY = Math.max(this.buildStartY, currentY);
                    for (let y = startY; y <= endY && highlightedTiles.length < maxItems; y++) {
                        if (this.game.tileManager.canPlaceItem('LADDER', currentX, y) &&
                            this.game.tileManager.getTile(currentX, y) === GameConfig.TILE_TYPES.EMPTY) {
                            highlightedTiles.push({x: currentX, y: y});
                        }
                    }
                }
            } else if (this.selectedShopItem === 'SHORING') {
                if (currentY === this.buildStartY) {
                    const startX = Math.min(this.buildStartX, currentX);
                    const endX = Math.max(this.buildStartX, currentX);
                    for (let x = startX; x <= endX && highlightedTiles.length < maxItems; x++) {
                        if (this.game.tileManager.canPlaceItem('SHORING', x, currentY) &&
                            this.game.tileManager.getTile(x, currentY) === GameConfig.TILE_TYPES.EMPTY) {
                            highlightedTiles.push({x: x, y: currentY});
                        }
                    }
                }
            }
        }

        // Apply highlights
        highlightedTiles.forEach(pos => {
            const tile = document.querySelector(`[data-x="${pos.x}"][data-y="${pos.y}"]`);
            if (tile) tile.classList.add('placeable');
        });

        return highlightedTiles;
    }
}