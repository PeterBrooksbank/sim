const terrainColors = {
    'DEEP_WATER': '#000080',
    'SHALLOW_WATER': '#4169E1',
    'GRASSLAND': '#90EE90',
    'FOREST': '#228B22',
    'RAINFOREST': '#006400',
    'SHRUBLAND': '#DEB887',
    'WOODLAND': '#556B2F',
    'ALPINE_FOREST': '#8B4513',
    'BARE_MOUNTAIN': '#A0522D',
    'SNOW_MOUNTAIN': '#DCDCDC',
    'PEAK': '#FFFFFF',
    'RIVER': '#4169E1'  // Royal Blue for rivers
};

let worldState = null;

function renderWorldState(mode = 'terrain') {
    const canvas = document.getElementById('terrainCanvas');
    const ctx = canvas.getContext('2d');
    const cellSize = 8;

    if (!worldState || !worldState.terrain) return;

    const terrain = worldState.terrain;
    canvas.width = terrain[0].length * cellSize;
    canvas.height = terrain.length * cellSize;

    terrain.forEach((row, y) => {
        row.forEach((cell, x) => {
            let color;
            switch (mode) {
                case 'elevation':
                    const elevation = worldState.elevation[y][x];
                    color = `hsl(0, 0%, ${elevation * 100}%)`;
                    break;
                case 'moisture':
                    const moisture = worldState.moisture[y][x];
                    color = `hsl(200, ${moisture * 100}%, 50%)`;
                    break;
                case 'water':
                    const water = worldState.water[y][x];
                    color = `hsl(220, 100%, ${water * 100}%)`;
                    break;
                default:
                    color = terrainColors[cell] || '#000000';
            }

            ctx.fillStyle = color;
            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        });
    });

    updateInfoPanel();
}

function updateInfoPanel() {
    const panel = document.getElementById('infoPanel');
    const stats = calculateStats();
    panel.innerHTML = `
        <div class="stat-item">
            <div class="stat-value">${stats.waterCoverage}%</div>
            <div class="stat-label">Water Coverage</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${stats.avgElevation}</div>
            <div class="stat-label">Avg Elevation</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${stats.riverCount}</div>
            <div class="stat-label">Rivers</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${(worldState?.seed || 0).toFixed(4)}</div>
            <div class="stat-label">Seed</div>
        </div>
    `;
}

function calculateStats() {
    if (!worldState) return {};

    const waterTiles = worldState.terrain.flat()
        .filter(t => t === 'DEEP_WATER' || t === 'SHALLOW_WATER').length;
    const totalTiles = worldState.terrain.flat().length;

    return {
        waterCoverage: ((waterTiles / totalTiles) * 100).toFixed(1),
        avgElevation: (average(worldState.elevation.flat())).toFixed(2),
        riverCount: worldState.rivers.length
    };
}

function average(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
}

async function generateNewTerrain() {
    try {
        const seedInput = document.getElementById('seedInput');
        const url = seedInput.value 
            ? `/api/terrain/generate?seed=${seedInput.value}`
            : '/api/terrain/generate';
            
        const response = await fetch(url, { method: 'POST' });
        worldState = await response.json();
        renderWorldState(document.getElementById('viewMode').value);
    } catch (error) {
        console.error('Failed to generate new terrain:', error);
    }
}

async function fetchAndRenderTerrain() {
    const response = await fetch('/api/terrain');
    worldState = await response.json();
    renderWorldState('terrain');
}

function createColorMap() {
    const colorMap = document.getElementById('colorMap');
    Object.entries(terrainColors).forEach(([type, color]) => {
        const item = document.createElement('div');
        item.className = 'color-item';

        const sample = document.createElement('div');
        sample.className = 'color-sample';
        sample.style.backgroundColor = color;

        const label = document.createElement('span');
        label.textContent = type.replace(/_/g, ' ').toLowerCase();

        item.appendChild(sample);
        item.appendChild(label);
        colorMap.appendChild(item);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    createColorMap();
    fetchAndRenderTerrain();
});

document.getElementById('generateButton').addEventListener('click', generateNewTerrain);
document.getElementById('viewMode').addEventListener('change', (e) => {
    renderWorldState(e.target.value);
});
