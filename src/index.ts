import WorldState from "./world/state/WorldState";
import TerrainGenerator from "./world/terrain/TerrainGenerator";
import TerrainRenderer from "./world/terrain/TerrainRenderer";
import { Api } from "./api/Api";


async function main() {
    const generator = new TerrainGenerator();
    const { terrain, elevation, water, moisture } = generator.generate();
    console.log('Terrain distribution:', generator.getTerrainStats());
    
    // Store terrain in world state
    WorldState.Terrain = terrain;
    
    // ASCII visualization
    TerrainRenderer.renderAscii(terrain);

    // Start API server
    const api = new Api();
    api.start();
}

main();