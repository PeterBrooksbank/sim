import TerrainGenerator from "./world/terrain/TerrainGenerator";
import TerrainRenderer from "./world/terrain/TerrainRenderer";

const gridSize = 100;

async function main() {
    const generator = new TerrainGenerator(gridSize, gridSize, 0.5);
    const { terrain, elevation, water, moisture } = generator.generate();
    console.log('Terrain distribution:', generator.getTerrainStats());
    
    // ASCII visualization using the renderer
    TerrainRenderer.renderAscii(terrain);
}

main();