export default class NoiseGenerator {
    private permutation: number[];

    constructor(seed = Math.random()) {
        // Initialize permutation array
        this.permutation = new Array(256).fill(0).map((_, i) => i);
        
        // Seed-based shuffle
        for (let i = this.permutation.length - 1; i > 0; i--) {
            const j = Math.floor(this.seededRandom(seed, i) * (i + 1));
            [this.permutation[i], this.permutation[j]] = [this.permutation[j], this.permutation[i]];
        }

        // Double the permutation array to avoid overflow
        this.permutation = [...this.permutation, ...this.permutation];
    }

    private seededRandom(seed: number, index: number): number {
        const x = Math.sin(seed * index) * 10000;
        return x - Math.floor(x);
    }

    private fade(t: number): number {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    private grad(hash: number, x: number, y: number): number {
        const h = hash & 15;
        const grad = 1 + (h & 7);  // Gradient value 1-8
        const isNeg = h & 8;       // Randomly invert gradient
        const u = h < 8 ? x : y;   // Pick coordinate for gradient
        return (isNeg ? -u : u) * grad;
    }

    noise(x: number, y: number): number {
        // Find unit square that contains point
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;

        // Find relative x,y of point in square
        x -= Math.floor(x);
        y -= Math.floor(y);

        // Compute fade curves for x,y
        const u = this.fade(x);
        const v = this.fade(y);

        // Hash coordinates of the 4 square corners
        const A = this.permutation[X] + Y;
        const AA = this.permutation[A];
        const AB = this.permutation[A + 1];
        const B = this.permutation[X + 1] + Y;
        const BA = this.permutation[B];
        const BB = this.permutation[B + 1];

        // Add blended results from 4 corners of square
        const result = this.lerp(v,
            this.lerp(u, 
                this.grad(this.permutation[AA], x, y),
                this.grad(this.permutation[BA], x-1, y)
            ),
            this.lerp(u,
                this.grad(this.permutation[AB], x, y-1),
                this.grad(this.permutation[BB], x-1, y-1)
            )
        );

        // Transform from [-1,1] to [0,1]
        return (result + 1) / 2;
    }

    private lerp(t: number, a: number, b: number): number {
        return a + t * (b - a);
    }

    fractal(x: number, y: number, octaves = 4, persistence = 0.5, lacunarity = 2): number {
        let total = 0;
        let frequency = 1/50; // Adjust this to change the base frequency
        let amplitude = 1;
        let maxValue = 0;

        for (let i = 0; i < octaves; i++) {
            total += this.noise(x * frequency, y * frequency) * amplitude;
            maxValue += amplitude;
            amplitude *= persistence;
            frequency *= lacunarity;
        }

        return total / maxValue;
    }
}
