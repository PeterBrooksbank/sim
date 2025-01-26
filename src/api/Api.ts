import express from 'express';
import path from 'path';
import WorldState from '../world/state/WorldState';
import TerrainGenerator from '../world/terrain/TerrainGenerator';

export class Api {
    private app;
    private port = 8080;

    constructor() {
        this.app = express();
        
        // Add static file serving before routes
        this.app.use(express.static(path.join(__dirname, '../../public')));
        
        this.setupRoutes();
    }

    private setupRoutes() {
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, '../../public/index.html'));
        });

        this.app.get('/api/terrain', (req, res) => {
            res.json({
                terrain: WorldState.Terrain,
                elevation: WorldState.Elevation,
                water: WorldState.Water,
                moisture: WorldState.Moisture,
                rivers: Array.from(WorldState.Rivers || []),
                seed: WorldState.Seed
            });
        });

        this.app.post('/api/terrain/generate', (req, res) => {
            const seed = req.query.seed ? parseFloat(req.query.seed as string) : Math.random();
            const generator = new TerrainGenerator(TerrainGenerator.DefaultGridSize, TerrainGenerator.DefaultGridSize, seed);
            const { terrain, elevation, water, moisture, rivers } = generator.generate();
            
            // Store complete state
            WorldState.Terrain = terrain;
            WorldState.Elevation = elevation;
            WorldState.Water = water;
            WorldState.Moisture = moisture;
            WorldState.Rivers = rivers;
            WorldState.Seed = generator.seed;  // Add this line

            res.json({
                terrain,
                elevation,
                water,
                moisture,
                rivers: Array.from(rivers),
                seed: generator.seed    // Add this line
            });
            console.log('Terrain distribution:', generator.getTerrainStats());
        });
    }

    start() {
        this.app.listen(this.port, () => {
            console.log(`Server running at http://localhost:${this.port}`);
        });
    }
}
