import WorldState from "./world/state/WorldState";
import TerrainGenerator from "./world/terrain/TerrainGenerator";
import TerrainRenderer from "./world/terrain/TerrainRenderer";
import { Api } from "./api/Api";


async function main() {
    const generator = new TerrainGenerator();
    const { terrain, elevation, water, moisture, rivers } = generator.generate();
    console.log('Terrain distribution:', generator.getTerrainStats());
    
    // Store complete world state
    WorldState.Terrain = terrain;
    WorldState.Elevation = elevation;
    WorldState.Water = water;
    WorldState.Moisture = moisture;
    WorldState.Rivers = rivers;
    WorldState.Seed = generator.seed;
    
    // ASCII visualization
    //TerrainRenderer.renderAscii(terrain);

    // Start API server
    const api = new Api();
    api.start();
}

main();