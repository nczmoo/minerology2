class GameConfig {
    static loop_interval_timing = 50;  // Increased animation smoothness
    static MAP_WIDTH = 40;
    static MAP_HEIGHT = 27;
    static TILE_SIZE = 32;
    static SURFACE_HEIGHT = 3;  // Fixed surface height
    static MAX_DIRT_DEPTH = 15;  // Maximum depth for dirt (about halfway)
    static DIRT_DECAY_RATE = 0.75;  // How quickly dirt becomes less common with depth
    static INITIAL_COLLAPSE_TIMER = 3;

    static PLAYER = {
        width: 32,
        height: 32,  // Changed to match tile size
        speed: 32    // Exactly one tile
    };

    static DIRECTIONS = {
        LEFT: 'left',
        RIGHT: 'right',
        DOWN: 'down',
        UP: 'up'
    };

    static TILE_TYPES = {
        EMPTY: 'empty',
        SKY: 'sky',
        STONE: 'stone',
        DIRT: 'dirt',
        IRON: 'iron',
        GOLD: 'gold',
        COAL: 'coal',
        LADDER: 'ladder',
        SHORING: 'shoring',
        DYNAMITE: 'dynamite'
    };

    static SHOP_ITEMS = {
        LADDER: { price: 10, symbol: '|' },
        SHORING: { price: 100, symbol: '=' },
        DYNAMITE: { price: 50, symbol: '▣' }
    };

    static ORE_VEIN_SIZES = {
        'iron': { minLength: 6, maxLength: 12, width: 2 },
        'gold': { minLength: 3, maxLength: 6, width: 1 },
        'coal': { minLength: 8, maxLength: 16, width: 3 }  // Coal has larger veins
    };
}