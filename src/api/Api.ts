import express from 'express';
import path from 'path';
import WorldState from '../world/state/WorldState';
import TerrainGenerator from '../world/terrain/TerrainGenerator';

export class Api {
    private app;
    private port = 8080;

    constructor() {
        this.app = express();
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
                rivers: Array.from(WorldState.Rivers || [])
            });
        });

        this.app.post('/api/terrain/generate', (req, res) => {
            const generator = new TerrainGenerator(TerrainGenerator.DefaultGridSize, TerrainGenerator.DefaultGridSize, Math.random());
            const { terrain, elevation, water, moisture, rivers } = generator.generate();
            
            // Store complete state
            WorldState.Terrain = terrain;
            WorldState.Elevation = elevation;
            WorldState.Water = water;
            WorldState.Moisture = moisture;
            WorldState.Rivers = rivers;

            res.json({
                terrain,
                elevation,
                water,
                moisture,
                rivers: Array.from(rivers)
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
