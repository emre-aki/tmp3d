/*
 *  d_spaceship.ts
 *  tmp3d
 *
 *  Created by Emre Akı on 2022-07-08.
 *
 *  SYNOPSIS:
 *      The initial 3-D geometry data and their respective UV mappings.
 */

(function (): void
{
    function D_Vertices (): pvec3_t[]
    {
        return [
            [1, -1, -1],
            [1, 1, -1],
            [1, -1, 1],
            [1, 1, 1],
            [-1, -1, -1],
            [-1, 1, -1],
            [-1, -1, 1],
            [-1, 1, 1],
            [-0.72, 0.12, -1.4],
            [0.3, 0, 5],
            [-0.6, -0.6, -1.4],
            [-0.3, 0, 5],
            [-1.2, 0.2, 1],
            [-0.6, 0.6, -1.4],
            [-1.2, -0.2, -1],
            [-1.2, 0.2, -1],
            [1.2, -0.2, 1],
            [1.2, -0.2, -1],
            [1.2, 0.2, -1],
            [1.2, 0.2, 1],
            [-1.2, -0.2, 1],
            [0.6, 0.6, -1.4],
            [0.6, -0.6, -1.4],
            [-4.2, 0.06, 1],
            [-4.2, -0.06, 1],
            [-4.2, -0.06, -1],
            [-4.2, 0.06, -1],
            [4.2, -0.06, 1],
            [4.2, -0.06, -1],
            [4.2, 0.06, -1],
            [4.2, 0.06, 1],
            [4.2, -0.18, 1],
            [4.2, -0.18, -1],
            [4.2, 0.18, -1],
            [4.2, 0.18, 1],
            [4.5, -0.18, 1],
            [4.5, -0.18, -1],
            [4.5, 0.18, -1],
            [4.5, 0.18, 1],
            [-4.2, 0.18, 1],
            [-4.2, -0.18, 1],
            [-4.2, -0.18, -1],
            [-4.2, 0.18, -1],
            [-4.5, 0.18, 1],
            [-4.5, -0.18, 1],
            [-4.5, -0.18, -1],
            [-4.5, 0.18, -1],
            [4.35, -0.18, 3],
            [4.35, 0.18, 3],
            [-4.35, 0.18, 3],
            [-4.35, -0.18, 3],
            [0, -0.7, 3],
            [-0.72, -0.12, -1.4],
            [0.72, -0.12, -1.4],
            [0.72, 0.12, -1.4]
        ];
    }

    function D_UV (): pvec2_t[]
    {
        return [

        ];
    }

    function D_Triangles (): pvec3_t[]
    {
        return [
            [20, 51, 11],
            [5, 12, 7],
            [4, 22, 0],
            [6, 0, 2],
            [3, 5, 7],
            [3, 11, 9],
            [16, 19, 9],
            [19, 3, 9],
            [16, 51, 2],
            [6, 2, 51],
            [15, 13, 8],
            [6, 14, 4],
            [19, 29, 18],
            [17, 22, 53],
            [3, 18, 1],
            [0, 16, 2],
            [12, 24, 20],
            [12, 20, 11],
            [11, 51, 9],
            [7, 12, 11],
            [26, 41, 42],
            [14, 26, 15],
            [20, 25, 14],
            [15, 23, 12],
            [30, 33, 29],
            [17, 27, 16],
            [16, 30, 19],
            [18, 28, 17],
            [31, 48, 34],
            [28, 31, 27],
            [30, 31, 34],
            [28, 33, 32],
            [37, 35, 36],
            [33, 36, 32],
            [34, 37, 33],
            [32, 35, 31],
            [42, 43, 39],
            [24, 41, 25],
            [26, 39, 23],
            [24, 39, 40],
            [43, 45, 44],
            [39, 43, 49],
            [41, 46, 42],
            [40, 45, 41],
            [43, 46, 45],
            [31, 35, 47],
            [38, 34, 48],
            [38, 47, 35],
            [44, 50, 49],
            [39, 50, 40],
            [44, 40, 50],
            [44, 49, 43],
            [17, 28, 27],
            [16, 27, 30],
            [3, 1, 5],
            [17, 54, 18],
            [14, 10, 4],
            [18, 21, 1],
            [1, 13, 5],
            [15, 52, 14],
            [52, 8, 53],
            [18, 29, 28],
            [14, 25, 26],
            [15, 26, 23],
            [12, 23, 24],
            [20, 24, 25],
            [6, 20, 14],
            [6, 4, 0],
            [20, 6, 51],
            [0, 17, 16],
            [16, 9, 51],
            [3, 19, 18],
            [19, 30, 29],
            [3, 7, 11],
            [42, 46, 43],
            [5, 15, 12],
            [39, 49, 50],
            [40, 44, 45],
            [41, 45, 46],
            [1, 21, 13],
            [18, 54, 21],
            [17, 53, 54],
            [17, 0, 22],
            [4, 10, 22],
            [14, 52, 10],
            [15, 8, 52],
            [15, 5, 13],
            [8, 13, 21],
            [21, 54, 8],
            [54, 53, 8],
            [53, 22, 10],
            [10, 52, 53],
            [33, 37, 36],
            [37, 38, 35],
            [38, 48, 47],
            [34, 38, 37],
            [32, 36, 35],
            [24, 40, 41],
            [26, 42, 39],
            [30, 34, 33],
            [28, 32, 31],
            [31, 47, 48],
            [26, 25, 41],
            [30, 27, 31],
            [28, 29, 33],
            [24, 23, 39]
        ];
    }

    function D_UVMap (): uvface_t[]
    {
        return [

        ];
    }

    function D_TextureAtlas (): { [textureId: string]: string }
    {
        return {

        };
    }

    window.__import__D_Mesh = function ()
    {
        return {
            D_Vertices: D_Vertices,
            D_UV: D_UV,
            D_Triangles: D_Triangles,
            D_UVMap: D_UVMap,
            D_TextureAtlas: D_TextureAtlas,
        };
    };
})();