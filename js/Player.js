class Player {
    constructor(game) {
        this.game = game;
        this.x = 0;
        this.y = 0;
        this.element = null;
        this.lastMove = null;
        this.initialX = 0;
        this.initialY = GameConfig.SURFACE_HEIGHT - 1;
    }

    create() {
        this.element = document.createElement('div');
        this.element.className = 'player';
        this.y = GameConfig.SURFACE_HEIGHT - 1;
        document.getElementById('game-map').appendChild(this.element);
        this.updatePosition();
    }

    updatePosition() {
        this.element.style.left = (this.x * GameConfig.TILE_SIZE) + 'px';
        this.element.style.top = (this.y * GameConfig.TILE_SIZE) + 'px';
    }

    checkFallDistance(x, y) {
        let fallDistance = 0;
        let currentY = y;
        
        while (currentY < GameConfig.MAP_HEIGHT - 1) {
            const tileBelow = this.game.tileManager.getTile(x, currentY + 1);
            if (tileBelow === GameConfig.TILE_TYPES.EMPTY || tileBelow === GameConfig.TILE_TYPES.SKY) {
                if (tileBelow === GameConfig.TILE_TYPES.EMPTY) {
                    fallDistance++;
                }
                currentY++;
            } else {
                break;
            }
        }
        return fallDistance;
    }

    handleFall(x, y) {
        const fallDistance = this.checkFallDistance(x, y);
        
        if (fallDistance > 0) {
            if (fallDistance > 2) {
                alert('Game Over - You fell too far!');
                this.resetPosition();
                return true;
            } else {
                this.y = y + fallDistance;
                this.updatePosition();
                return true;
            }
        }
        return false;
    }

    tryMove(direction) {
        const oldX = this.x;
        const oldY = this.y;
        let newX = oldX;
        let newY = oldY;

        if (!this.game.miningEnabled) return;

        switch(direction) {
            case GameConfig.DIRECTIONS.LEFT:
                if (newX > 0) newX--;
                break;
            case GameConfig.DIRECTIONS.RIGHT:
                if (newX < GameConfig.MAP_WIDTH - 1) newX++;
                break;
            case GameConfig.DIRECTIONS.DOWN:
                if (newY < GameConfig.MAP_HEIGHT - 1) {
                    newY++;
                    const targetTile = this.game.tileManager.getTile(newX, newY);
                    if (targetTile !== GameConfig.TILE_TYPES.EMPTY && 
                        targetTile !== GameConfig.TILE_TYPES.SKY &&
                        targetTile !== GameConfig.TILE_TYPES.LADDER &&
                        targetTile !== GameConfig.TILE_TYPES.SHORING &&
                        this.game.tileManager.getTile(oldX, oldY) !== GameConfig.TILE_TYPES.SHORING) {
                        this.game.tileManager.mineTile(newX, newY);
                        return;
                    }
                }
                break;
            case GameConfig.DIRECTIONS.UP:
                if (this.y > 0) {
                    if (this.game.tileManager.getTile(oldX, oldY - 1) === GameConfig.TILE_TYPES.LADDER) {
                        newY--;
                    } else if (this.game.tileManager.getTile(oldX, oldY) !== GameConfig.TILE_TYPES.SHORING) {
                        this.game.tileManager.mineTile(oldX, oldY - 1);
                        return;
                    }
                }
                break;
        }

        const targetTile = this.game.tileManager.getTile(newX, newY);
        const currentTile = this.game.tileManager.getTile(oldX, oldY);
        
        if (targetTile === GameConfig.TILE_TYPES.EMPTY || 
            targetTile === GameConfig.TILE_TYPES.SKY ||
            targetTile === GameConfig.TILE_TYPES.LADDER ||
            targetTile === GameConfig.TILE_TYPES.SHORING) {
            
            this.x = newX;
            this.y = newY;
            this.updatePosition();

            if (direction !== GameConfig.DIRECTIONS.UP && currentTile !== GameConfig.TILE_TYPES.LADDER) {
                const tileBelowNew = this.game.tileManager.getTile(newX, newY + 1);
                if (tileBelowNew === GameConfig.TILE_TYPES.EMPTY) {
                    this.handleFall(newX, newY);
                }
            } else if (currentTile === GameConfig.TILE_TYPES.LADDER && 
                     targetTile === GameConfig.TILE_TYPES.EMPTY &&
                     direction !== GameConfig.DIRECTIONS.UP) {
                this.handleFall(newX, newY);
            }
        } else {
            this.game.tileManager.mineTile(newX, newY);
        }
    }

    resetPosition() {
        this.x = this.initialX;
        this.y = this.initialY;
        this.updatePosition();
    }

    show() {
        if (this.element) {
            this.element.style.display = 'block';
        }
    }

    hide() {
        if (this.element) {
            this.element.style.display = 'none';
        }
    }
}