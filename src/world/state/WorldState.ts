export default class WorldState {
    static Terrain: string[][];
    static Elevation: number[][];
    static Water: number[][];
    static Moisture: number[][];
    static Rivers: Set<string>;
}