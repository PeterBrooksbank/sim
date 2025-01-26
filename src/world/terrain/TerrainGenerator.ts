import NoiseGenerator from "./NoiseGenerator";

export default class TerrainGenerator {

    static readonly DefaultGridSize = 250;

    width: number;
    height: number;
    seed: number;
    grid: any[][];
    ELEVATION_THRESHOLDS: { DEEP_WATER: number; SHALLOW_WATER: number; LOWLAND: number; HIGHLAND: number; MOUNTAIN: number; };
    MOISTURE_THRESHOLDS: { DRY: number; MODERATE: number; WET: number; VERY_WET: number; };
    noiseGenerator: NoiseGenerator;

    constructor(width: number = TerrainGenerator.DefaultGridSize, height: number = TerrainGenerator.DefaultGridSize, seed = 0.5) {
        this.width = width;
        this.height = height;
        this.seed = seed;
        this.grid = Array(height).fill(0).map(() => Array(width).fill(0));

        // Terrain thresholds (elevation based)
        this.ELEVATION_THRESHOLDS = {
            DEEP_WATER: 0.05,
            SHALLOW_WATER: 0.075,
            LOWLAND: 0.4,
            HIGHLAND: 0.7,
            MOUNTAIN: 0.9
        };

        // Moisture thresholds for biome determination
        this.MOISTURE_THRESHOLDS = {
            DRY: 0.3,
            MODERATE: 0.6,
            WET: 0.8,
            VERY_WET: 1.0
        };

        this.noiseGenerator = new NoiseGenerator(seed);
    }

    random(x: number, y: number) {
        const dot = x * 12.9898 + y * 78.233 + this.seed * 43758.5453;
        return (Math.sin(dot) * 43758.5453) % 1;
    }

    noise(x: number, y: number, frequency = 10) {
        const x0 = Math.floor(x * frequency);
        const x1 = x0 + 1;
        const y0 = Math.floor(y * frequency);
        const y1 = y0 + 1;

        const v00 = this.random(x0, y0);
        const v10 = this.random(x1, y0);
        const v01 = this.random(x0, y1);
        const v11 = this.random(x1, y1);

        const sx = (x * frequency) - x0;
        const sy = (y * frequency) - y0;

        const nx0 = this.lerp(v00, v10, sx);
        const nx1 = this.lerp(v01, v11, sx);
        return this.lerp(nx0, nx1, sy);
    }

    lerp(a: number, b: number, t: number) {
        return a + t * (b - a);
    }

    // Simulate water flow and erosion
    simulateWaterFlow(elevation: number[][], iterations = 50) {
        const water = Array(this.height).fill(0).map(() => Array(this.width).fill(0));
        const sediment = Array(this.height).fill(0).map(() => Array(this.width).fill(0));

        // Constants for water simulation
        const rainAmount = 0.01;
        const evaporationRate = 0.02;
        const erosionRate = 0.01;
        const depositionRate = 0.01;
        let capacity = 0.05;

        for (let iter = 0; iter < iterations; iter++) {
            // Add rainfall
            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width; x++) {
                    water[y][x] += rainAmount;
                }
            }

            // Simulate water flow
            const newWater = Array(this.height).fill(0).map(() => Array(this.width).fill(0));
            const newSediment = Array(this.height).fill(0).map(() => Array(this.width).fill(0));

            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width; x++) {
                    if (water[y][x] < 0.01) continue;

                    // Calculate flow to neighbors
                    const neighbors = this.getNeighbors(x, y);
                    const currentHeight = elevation[y][x] + water[y][x];

                    let totalFlow = 0;
                    const flows = neighbors.map(([nx, ny]) => {
                        const neighborHeight = elevation[ny][nx] + water[ny][nx];
                        const heightDiff = currentHeight - neighborHeight;
                        return heightDiff > 0 ? heightDiff : 0;
                    });

                    const totalHeightDiff = flows.reduce((a, b) => a + b, 0);

                    if (totalHeightDiff > 0) {
                        flows.forEach((flow, i) => {
                            const [nx, ny] = neighbors[i];
                            const flowAmount = (flow / totalHeightDiff) * water[y][x];
                            newWater[ny][nx] += flowAmount;

                            // Erosion and deposition
                            const velocity = flowAmount * flow;
                            capacity = velocity * capacity;

                            if (velocity > erosionRate) {
                                const erosionAmount = Math.min(erosionRate * velocity, elevation[y][x] * 0.1);
                                elevation[y][x] -= erosionAmount;
                                sediment[y][x] += erosionAmount;
                            }
                        });
                    } else {
                        newWater[y][x] += water[y][x];
                    }

                    // Deposit sediment
                    if (sediment[y][x] > 0) {
                        const depositionAmount = Math.min(depositionRate * sediment[y][x], sediment[y][x]);
                        elevation[y][x] += depositionAmount;
                        sediment[y][x] -= depositionAmount;
                    }
                }
            }

            // Evaporation
            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width; x++) {
                    newWater[y][x] *= (1 - evaporationRate);
                }
            }

            // Update water and sediment arrays
            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width; x++) {
                    water[y][x] = newWater[y][x];
                    sediment[y][x] = newSediment[y][x];
                }
            }
        }

        return { elevation, water };
    }

    getNeighbors(x: number, y: number) {
        const neighbors: any[][] = [];
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

        directions.forEach(([dx, dy]) => {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
                neighbors.push([nx, ny]);
            }
        });

        return neighbors;
    }

    // Calculate moisture levels based on water accumulation and elevation
    calculateMoisture(elevation: number[][], water: any[][]) {
        const moisture = Array(this.height).fill(0).map(() => Array(this.width).fill(0));

        // Base moisture from water bodies
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                moisture[y][x] = water[y][x];

                // Higher elevation = less moisture
                moisture[y][x] *= (1 - elevation[y][x] * 0.5);

                // Proximity to water bodies increases moisture
                if (water[y][x] > 0.1) {
                    this.getNeighbors(x, y).forEach(([nx, ny]) => {
                        moisture[ny][nx] += water[y][x] * 0.2;
                    });
                }
            }
        }

        // Normalize moisture values
        const maxMoisture = Math.max(...moisture.flat());
        return moisture.map(row => row.map(val => val / maxMoisture));
    }

    // Determine biome based on elevation and moisture
    getBiome(elevation: number, moisture: number) {
        if (elevation < this.ELEVATION_THRESHOLDS.DEEP_WATER) return 'DEEP_WATER';
        if (elevation < this.ELEVATION_THRESHOLDS.SHALLOW_WATER) return 'SHALLOW_WATER';

        if (elevation < this.ELEVATION_THRESHOLDS.LOWLAND) {
            if (moisture < this.MOISTURE_THRESHOLDS.DRY) return 'GRASSLAND';
            if (moisture < this.MOISTURE_THRESHOLDS.MODERATE) return 'SAVANNA';
            if (moisture < this.MOISTURE_THRESHOLDS.WET) return 'FOREST';
            return 'RAINFOREST';
        }

        if (elevation < this.ELEVATION_THRESHOLDS.HIGHLAND) {
            if (moisture < this.MOISTURE_THRESHOLDS.DRY) return 'SHRUBLAND';
            if (moisture < this.MOISTURE_THRESHOLDS.WET) return 'WOODLAND';
            return 'ALPINE_FOREST';
        }

        if (elevation < this.ELEVATION_THRESHOLDS.MOUNTAIN) {
            if (moisture < this.MOISTURE_THRESHOLDS.MODERATE) return 'BARE_MOUNTAIN';
            return 'SNOW_MOUNTAIN';
        }

        return 'PEAK';
    }

    private getDistanceFromCenter(x: number, y: number): number {
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        const dx = (x - centerX) / this.width;
        const dy = (y - centerY) / this.height;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // Rename method since it's no longer center-based
    private generateElevation(): number[][] {
        const elevation = Array(this.height).fill(0).map(() => Array(this.width).fill(0));
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                // Use pure noise for elevation
                const noise = this.noiseGenerator.fractal(x, y, 4, 0.5, 2);
                //console.log(noise);
                // Normalize to ensure values stay in 0-1 range
                elevation[y][x] = Math.max(0, Math.min(1, noise));
                //console.log(elevation[y][x]);
            }
        }

        return elevation;
    }

    private readonly RIVER_PARAMS = {
        SOURCE_THRESHOLD: 0.7,    // Minimum elevation for river sources
        FLOW_THRESHOLD: 0.01,     // Minimum slope needed for river flow
        MAX_RIVERS: 15,          // Maximum number of rivers to generate
        MIN_LENGTH: 10           // Minimum length for a river to be kept
    };

    private generateRivers(elevation: number[][]): Set<string> {
        const rivers = new Set<string>();
        let riverCount = 0;

        // Find potential river sources (high elevation points)
        const sources: [number, number][] = [];
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (elevation[y][x] > this.RIVER_PARAMS.SOURCE_THRESHOLD) {
                    sources.push([x, y]);
                }
            }
        }

        // Shuffle sources randomly
        sources.sort(() => Math.random() - 0.5);

        // Generate rivers from each source
        for (const [startX, startY] of sources) {
            if (riverCount >= this.RIVER_PARAMS.MAX_RIVERS) break;

            let currentX = startX;
            let currentY = startY;
            const riverPath = new Set<string>();

            while (true) {
                riverPath.add(`${currentX},${currentY}`);

                // Find lowest neighbor
                const neighbors = this.getNeighbors(currentX, currentY);
                let lowestElevation = elevation[currentY][currentX];
                let nextX = currentX;
                let nextY = currentY;

                for (const [nx, ny] of neighbors) {
                    if (elevation[ny][nx] < lowestElevation) {
                        lowestElevation = elevation[ny][nx];
                        nextX = nx;
                        nextY = ny;
                    }
                }

                // Stop if no lower point found or reached water
                if (nextX === currentX && nextY === currentY ||
                    elevation[nextY][nextX] < this.ELEVATION_THRESHOLDS.SHALLOW_WATER) {
                    break;
                }

                currentX = nextX;
                currentY = nextY;
            }

            // Only keep rivers that are long enough
            if (riverPath.size >= this.RIVER_PARAMS.MIN_LENGTH) {
                riverPath.forEach(coord => rivers.add(coord));
                riverCount++;
            }
        }

        return rivers;
    }

    generate() {
        // Update method call
        const elevation = this.generateElevation();

        // Simulate water flow and erosion
        const { elevation: erodedElevation, water } = this.simulateWaterFlow(elevation);

        // Calculate moisture levels
        const moisture = this.calculateMoisture(erodedElevation, water);

        // Generate rivers
        const rivers = this.generateRivers(erodedElevation);

        // Determine biomes based on elevation and moisture
        this.grid = erodedElevation.map((row: any[], y: number) =>
            row.map((elevation: any, x: number) => {
                const baseType = this.getBiome(elevation, moisture[y][x]);
                return rivers.has(`${x},${y}`) ? 'RIVER' : baseType;
            })
        );

        /* // Smooth the terrain to eliminate orphaned cells
        this.grid = this.smoothTerrain(this.grid); */

        return {
            terrain: this.grid,
            elevation: erodedElevation,
            water,
            moisture,
            rivers
        };
    }

    private smoothTerrain(terrain: string[][]): string[][] {
        const smoothed = terrain.map(row => [...row]);
        const iterations = 2; // Adjust this value to control smoothing intensity

        for (let iter = 0; iter < iterations; iter++) {
            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width; x++) {
                    const neighbors = this.getNeighbors(x, y);
                    const currentType = terrain[y][x];

                    // Count terrain types in neighborhood
                    const terrainCounts = new Map<string, number>();
                    neighbors.forEach(([nx, ny]) => {
                        const type = terrain[ny][nx];
                        terrainCounts.set(type, (terrainCounts.get(type) || 0) + 1);
                    });

                    // Find most common neighbor terrain
                    let mostCommonType = currentType;
                    let maxCount = 0;
                    terrainCounts.forEach((count, type) => {
                        if (count > maxCount) {
                            maxCount = count;
                            mostCommonType = type;
                        }
                    });

                    // If cell is different from most neighbors, change it
                    // But preserve water bodies and peaks more strictly
                    if (maxCount >= 3) {
                        smoothed[y][x] = mostCommonType;
                    }
                }
            }

            // Update terrain for next iteration
            terrain = smoothed.map(row => [...row]);
        }

        return smoothed;
    }

    getTerrainStats() {
        const stats: any = {};

        this.grid.forEach(row => {
            row.forEach(type => {
                stats[type] = (stats[type] || 0) + 1;
            });
        });

        const total = this.width * this.height;
        Object.keys(stats).forEach(type => {
            stats[type] = (stats[type] / total * 100).toFixed(1) + '%';
        });

        return stats;
    }
}