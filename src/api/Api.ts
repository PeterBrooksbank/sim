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
                terrain: WorldState.Terrain
            });
        });

        this.app.post('/api/terrain/generate', (req, res) => {
            const generator = new TerrainGenerator(TerrainGenerator.DefaultGridSize, TerrainGenerator.DefaultGridSize, Math.random());
            const { terrain } = generator.generate();
            WorldState.Terrain = terrain;
            res.json({ terrain });
        });
    }

    start() {
        this.app.listen(this.port, () => {
            console.log(`Server running at http://localhost:${this.port}`);
        });
    }
}
