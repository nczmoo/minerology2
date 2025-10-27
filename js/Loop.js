class Loop {
    constructor() {
        this.gameLoop = null;
    }

    start() {
        if (!this.gameLoop) {
            this.gameLoop = setInterval(() => this.go(), 50); // 20 times per second
        }
    }

    stop() {
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }
    }

    go() {
        // Only process if game is initialized
        if (!window.game || !window.game.tileManager) return;

        // Only check for new collapsing tiles
        window.game.tileManager.checkForCollapsingTiles();
    }
}