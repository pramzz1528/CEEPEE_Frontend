/**
 * CanvasUtils.js
 * Utilities for 4-point perspective warping on HTML5 Canvas (2D Context).
 */

// Solve linear system Ax = B using Gaussian elimination
function solve(A, B) {
    const n = A.length;
    for (let i = 0; i < n; i++) {
        // Pivot
        let maxEl = Math.abs(A[i][i]);
        let maxRow = i;
        for (let k = i + 1; k < n; k++) {
            if (Math.abs(A[k][i]) > maxEl) {
                maxEl = Math.abs(A[k][i]);
                maxRow = k;
            }
        }

        // Swap
        for (let k = i; k < n; k++) {
            const tmp = A[maxRow][k];
            A[maxRow][k] = A[i][k];
            A[i][k] = tmp;
        }
        const tmp = B[maxRow];
        B[maxRow] = B[i];
        B[i] = tmp;

        // Zero out below
        for (let k = i + 1; k < n; k++) {
            const c = -A[k][i] / A[i][i];
            for (let j = i; j < n; j++) {
                if (i === j) {
                    A[k][j] = 0;
                } else {
                    A[k][j] += c * A[i][j];
                }
            }
            B[k] += c * B[i];
        }
    }

    // Back substitution
    const x = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
        let sum = 0;
        for (let j = i + 1; j < n; j++) {
            sum += A[i][j] * x[j];
        }
        x[i] = (B[i] - sum) / A[i][i];
    }
    return x;
}

// Compute 3x3 Homography Matrix mapping srcPts -> dstPts
// Pts format: [{x,y}, {x,y}, {x,y}, {x,y}] (TL, TR, BR, BL)
export function computeHomography(srcPts, dstPts) {
    const A = [];
    const B = [];

    for (let i = 0; i < 4; i++) {
        const s = srcPts[i];
        const d = dstPts[i];

        // x' = (h00*x + h01*y + h02) / (h20*x + h21*y + 1)
        // y' = (h10*x + h11*y + h12) / (h20*x + h21*y + 1)

        // Linearized:
        // x*h00 + y*h01 + h02 - x*x'*h20 - y*x'*h21 = x'
        // x*h10 + y*h11 + h12 - x*y'*h20 - y*y'*h21 = y'

        A.push([s.x, s.y, 1, 0, 0, 0, -s.x * d.x, -s.y * d.x]);
        B.push(d.x);

        A.push([0, 0, 0, s.x, s.y, 1, -s.x * d.y, -s.y * d.y]);
        B.push(d.y);
    }

    const h = solve(A, B);

    // Matrix H (row-major)
    // [h[0], h[1], h[2]]
    // [h[3], h[4], h[5]]
    // [h[6], h[7],   1 ]
    return [
        h[0], h[1], h[2],
        h[3], h[4], h[5],
        h[6], h[7], 1
    ];
}

/**
 * Draws a warped image using subdivision (triangulation) to approximate perspective.
 * This effectively "warps" the texture onto the quad defined by dstPts.
 */
export function drawWarpedImage(ctx, img, dstPts) {
    if (!ctx || !img || !dstPts || dstPts.length !== 4) {
        console.warn("drawWarpedImage: Invalid arguments", { ctx: !!ctx, img: !!img, dstPts });
        return;
    }

    // Source is full image
    const srcPts = [
        { x: 0, y: 0 },
        { x: img.width, y: 0 },
        { x: img.width, y: img.height },
        { x: 0, y: img.height }
    ];

    // Subdivision Level (Higher = smoother warp, more expensive)
    // For a tile visualizer, we can do a reasonable grid, e.g., 20x20
    const cols = 20;
    const rows = 20;

    const H = computeHomography(srcPts, dstPts);

    // Helper to apply H to a point
    const transform = (x, y) => {
        const dem = H[6] * x + H[7] * y + H[8];
        return {
            x: (H[0] * x + H[1] * y + H[2]) / dem,
            y: (H[3] * x + H[4] * y + H[5]) / dem
        };
    };

    const cellW = img.width / cols;
    const cellH = img.height / rows;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const sx1 = c * cellW;
            const sy1 = r * cellH;
            const sx2 = (c + 1) * cellW;
            const sy2 = (r + 1) * cellH;

            // Source Triangle 1: (sx1, sy1), (sx2, sy1), (sx2, sy2) -> Top-Right Triangle of quad
            // Source Triangle 2: (sx1, sy1), (sx2, sy2), (sx1, sy2) -> Bottom-Left Triangle of quad (or similar split)

            // Map 4 corners of this cell
            const p1 = transform(sx1, sy1); // TL
            const p2 = transform(sx2, sy1); // TR
            const p3 = transform(sx2, sy2); // BR
            const p4 = transform(sx1, sy2); // BL

            // Draw two triangles to fill the quad (using clipping path and affine approximation? 
            // Actually, simple affine texture mapping per triangle is enough if triangles are small)

            // Standard Canvas 2D Affine Transform approximation for a triangle:
            // It's tricky to map a texture triangle to a canvas triangle precisely with just one setTransform.
            // Usually need to clip.

            renderTriangle(ctx, img, sx1, sy1, sx2, sy1, sx2, sy2, p1, p2, p3);
            renderTriangle(ctx, img, sx1, sy1, sx2, sy2, sx1, sy2, p1, p3, p4);
        }
    }
}

// Draw a single triangle with texture mapping (affine approximation)
function renderTriangle(ctx, img, sx0, sy0, sx1, sy1, sx2, sy2, dp0, dp1, dp2) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(dp0.x, dp0.y);
    ctx.lineTo(dp1.x, dp1.y);
    ctx.lineTo(dp2.x, dp2.y);
    ctx.closePath();
    ctx.clip();

    // Compute Affine Transform to map (sx, sy) -> (dp.x, dp.y)
    // We have 3 points, so we can solve for Affine 2x3.
    // x' = a*x + c*y + e
    // y' = b*x + d*y + f

    // Matrix equation:
    // [sx0 sy0 1]   [a b]   [dp0x dp0y]
    // [sx1 sy1 1] * [c d] = [dp1x dp1y]
    // [sx2 sy2 1]   [e f]   [dp2x dp2y]

    // Let T = [sx matrix]^-1 * [dp matrix]

    const den = sx0 * (sy2 - sy1) - sx1 * sy2 + sx2 * sy1 + (sx1 - sx2) * sy0;
    if (Math.abs(den) < 0.001) { ctx.restore(); return; } // Degenerate

    const a = (-(sy1 - sy2) * dp0.x + (sy0 - sy2) * dp1.x - (sy0 - sy1) * dp2.x) / den;
    const b = (-(sy1 - sy2) * dp0.y + (sy0 - sy2) * dp1.y - (sy0 - sy1) * dp2.y) / den;
    const c = ((sx1 - sx2) * dp0.x - (sx0 - sx2) * dp1.x + (sx0 - sx1) * dp2.x) / den;
    const d = ((sx1 - sx2) * dp0.y - (sx0 - sx2) * dp1.y + (sx0 - sx1) * dp2.y) / den;
    const e = ((sx1 * sy2 - sx2 * sy1) * dp0.x - (sx0 * sy2 - sx2 * sy0) * dp1.x + (sx0 * sy1 - sx1 * sy0) * dp2.x) / den;
    const f = ((sx1 * sy2 - sx2 * sy1) * dp0.y - (sx0 * sy2 - sx2 * sy0) * dp1.y + (sx0 * sy1 - sx1 * sy0) * dp2.y) / den;

    ctx.transform(a, b, c, d, e, f);
    ctx.drawImage(img, 0, 0);
    ctx.restore();
}
