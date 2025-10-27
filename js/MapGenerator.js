class MapGenerator {
    static generateMap() {
        const map = [];
        // Initialize map with sky
        for (let y = 0; y < GameConfig.MAP_HEIGHT; y++) {
            map[y] = Array(GameConfig.MAP_WIDTH).fill(GameConfig.TILE_TYPES.SKY);
        }

        this.generateTerrain(map);
        this.generateOres(map);
        
        return map;
    }

    static generateTerrain(map) {
        // Generate surface and underground with dirt variance
        for (let x = 0; x < GameConfig.MAP_WIDTH; x++) {
            let surfaceHeight = GameConfig.SURFACE_HEIGHT;
            let maxDirtDepth = surfaceHeight + Math.floor(Math.random() * 4) + 2;

            // Fill dirt layers with better connectivity
            for (let y = surfaceHeight; y < GameConfig.MAP_HEIGHT; y++) {
                if (y < maxDirtDepth) {
                    map[y][x] = GameConfig.TILE_TYPES.DIRT;
                } else {
                    let neighboringDirt = 0;
                    if (x > 0 && y > 0 && map[y-1][x-1] === GameConfig.TILE_TYPES.DIRT) neighboringDirt++;
                    if (y > 0 && map[y-1][x] === GameConfig.TILE_TYPES.DIRT) neighboringDirt++;
                    if (x < GameConfig.MAP_WIDTH-1 && y > 0 && map[y-1][x+1] === GameConfig.TILE_TYPES.DIRT) neighboringDirt++;
                    
                    let dirtChance = Math.pow(GameConfig.DIRT_DECAY_RATE, (y - maxDirtDepth) * 0.5);
                    if (neighboringDirt > 0) {
                        dirtChance += (neighboringDirt * 0.2);
                    }
                    
                    if (Math.random() < 0.05 && y < GameConfig.MAX_DIRT_DEPTH + 3) {
                        dirtChance = 0.8;
                    }

                    map[y][x] = Math.random() < dirtChance && y < GameConfig.MAX_DIRT_DEPTH + Math.floor(Math.random() * 3) 
                        ? GameConfig.TILE_TYPES.DIRT 
                        : GameConfig.TILE_TYPES.STONE;
                }
            }
        }
    }

    static generateOres(map) {
        // Generate ore veins
        this.generateOreVeins(map, 'coal', 16, true);   // Coal is most common, can be in dirt
        this.generateOreVeins(map, 'iron', 8, true);    // Iron can be in dirt
        this.generateOreVeins(map, 'copper', 7, true);  // Copper can be in dirt
        this.generateOreVeins(map, 'gold', 5, false);   // Gold only in stone
    }

    static generateOreVeins(map, oreType, numVeins, canBeInDirt) {
        const oreKey = oreType.toLowerCase();
        
        for (let i = 0; i < numVeins; i++) {
            let attempts = 0;
            let startX, startY;
            let validStart = false;

            while (!validStart && attempts < 100) {
                startX = Math.floor(Math.random() * GameConfig.MAP_WIDTH);
                startY = Math.floor(GameConfig.MAP_HEIGHT * 0.4) + Math.floor(Math.random() * (GameConfig.MAP_HEIGHT * 0.6));
                
                if (startY >= 0 && startY < GameConfig.MAP_HEIGHT && startX >= 0 && startX < GameConfig.MAP_WIDTH) {
                    if ((!canBeInDirt && map[startY][startX] === GameConfig.TILE_TYPES.STONE) ||
                        (canBeInDirt && (map[startY][startX] === GameConfig.TILE_TYPES.STONE || 
                                       map[startY][startX] === GameConfig.TILE_TYPES.DIRT))) {
                        validStart = true;
                    }
                }
                attempts++;
            }

            if (!validStart) continue;

            const veinConfig = GameConfig.ORE_VEIN_SIZES[oreKey];
            const length = Math.floor(Math.random() * (veinConfig.maxLength - veinConfig.minLength + 1)) + veinConfig.minLength;
            const placedOres = new Set();

            map[startY][startX] = oreType;
            placedOres.add(`${startX},${startY}`);

            this.growVein(map, startX, startY, length, oreType, canBeInDirt, placedOres);
            this.ensureProperConnectivity(map, placedOres, oreType);
        }
    }

    static growVein(map, startX, startY, length, oreType, canBeInDirt, placedOres) {
        let currentX = startX;
        let currentY = startY;

        for (let j = 0; j < length; j++) {
            let dirX = Math.floor(Math.random() * 3) - 1;
            let dirY = Math.floor(Math.random() * 3) - 1;
            
            if (dirX === 0 && dirY === 0) dirX = 1;

            let newX = currentX + dirX;
            let newY = currentY + dirY;

            if (this.isValidOrePosition(map, newX, newY, canBeInDirt)) {
                map[newY][newX] = oreType;
                placedOres.add(`${newX},${newY}`);

                if (Math.abs(dirX) === 1 && Math.abs(dirY) === 1) {
                    this.tryPlaceDiagonalConnections(map, currentX, currentY, newX, newY, oreType, canBeInDirt, placedOres);
                }
                
                currentX = newX;
                currentY = newY;
            }
        }
    }

    static isValidOrePosition(map, x, y, canBeInDirt) {
        if (x < 0 || x >= GameConfig.MAP_WIDTH || y < 0 || y >= GameConfig.MAP_HEIGHT) {
            return false;
        }

        return map[y][x] === GameConfig.TILE_TYPES.STONE ||
               (canBeInDirt && map[y][x] === GameConfig.TILE_TYPES.DIRT);
    }

    static tryPlaceDiagonalConnections(map, currentX, currentY, newX, newY, oreType, canBeInDirt, placedOres) {
        if (this.isValidOrePosition(map, newX, currentY, canBeInDirt)) {
            map[currentY][newX] = oreType;
            placedOres.add(`${newX},${currentY}`);
        }
        
        if (this.isValidOrePosition(map, currentX, newY, canBeInDirt)) {
            map[newY][currentX] = oreType;
            placedOres.add(`${currentX},${newY}`);
        }
    }

    static ensureProperConnectivity(map, placedOres, oreType) {
        for (let coords of placedOres) {
            const [x, y] = coords.split(',').map(Number);
            
            const diagonals = [
                {x: x-1, y: y-1}, {x: x+1, y: y-1},
                {x: x-1, y: y+1}, {x: x+1, y: y+1}
            ];

            for (let diag of diagonals) {
                if (diag.x >= 0 && diag.x < GameConfig.MAP_WIDTH &&
                    diag.y >= 0 && diag.y < GameConfig.MAP_HEIGHT &&
                    map[diag.y][diag.x] === oreType) {
                    
                    const hasHorizontalConnection = map[y][diag.x] === oreType;
                    const hasVerticalConnection = map[diag.y][x] === oreType;

                    if (!hasHorizontalConnection && !hasVerticalConnection) {
                        if (map[y][diag.x] === GameConfig.TILE_TYPES.STONE) {
                            map[y][diag.x] = oreType;
                        } else if (map[diag.y][x] === GameConfig.TILE_TYPES.STONE) {
                            map[diag.y][x] = oreType;
                        }
                    }
                }
            }
        }
    }
}