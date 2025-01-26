export default class TerrainRenderer {
    private static readonly ANSI_COLORS = {
        RESET: '\x1b[0m',
        BG: {
            NAVY: '\x1b[44m',
            BLUE: '\x1b[104m',
            GREEN: '\x1b[42m',
            YELLOW: '\x1b[43m',
            DARK_GREEN: '\x1b[32m',
            BROWN: '\x1b[43m',
            GRAY: '\x1b[100m',
            WHITE: '\x1b[47m',
        }
    };

    private static readonly ASCII_MAPPING: { [key: string]: { char: string, color: string } } = {
        'DEEP_WATER': { char: '~', color: TerrainRenderer.ANSI_COLORS.BG.NAVY },
        'SHALLOW_WATER': { char: '≈', color: TerrainRenderer.ANSI_COLORS.BG.BLUE },
        'GRASSLAND': { char: '"', color: TerrainRenderer.ANSI_COLORS.BG.GREEN },
        'SAVANNA': { char: '_', color: TerrainRenderer.ANSI_COLORS.BG.YELLOW },
        'FOREST': { char: '♣', color: TerrainRenderer.ANSI_COLORS.BG.DARK_GREEN },
        'RAINFOREST': { char: '♠', color: TerrainRenderer.ANSI_COLORS.BG.DARK_GREEN },
        'SHRUBLAND': { char: '*', color: TerrainRenderer.ANSI_COLORS.BG.YELLOW },
        'WOODLAND': { char: '♣', color: TerrainRenderer.ANSI_COLORS.BG.GREEN },
        'ALPINE_FOREST': { char: '△', color: TerrainRenderer.ANSI_COLORS.BG.BROWN },
        'BARE_MOUNTAIN': { char: '▲', color: TerrainRenderer.ANSI_COLORS.BG.GRAY },
        'SNOW_MOUNTAIN': { char: '▲', color: TerrainRenderer.ANSI_COLORS.BG.WHITE },
        'PEAK': { char: '▲', color: TerrainRenderer.ANSI_COLORS.BG.WHITE }
    };

    static renderAscii(terrain: string[][]): void {
        let output = '\n';
        terrain.forEach(row => {
            row.forEach(cell => {
                const mapping = this.ASCII_MAPPING[cell] || { char: '?', color: this.ANSI_COLORS.RESET };
                output += `${mapping.color}${mapping.char}${this.ANSI_COLORS.RESET}`;
            });
            output += '\n';
        });
        console.log(output);
    }
}
