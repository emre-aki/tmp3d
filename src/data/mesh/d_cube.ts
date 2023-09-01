/*
 *  d_cube.ts
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
            [-10, -10, -10],
            [10, -10, -10],
            [10, 10, -10],
            [-10, 10, -10],
            [-10, -10, 10],
            [10, -10, 10],
            [10, 10, 10],
            [-10, 10, 10]
        ];
    }

    function D_UV (): pvec2_t[]
    {
        return [
            [0, 0],
            [0, 1],
            [1, 0],
            [1, 1]
        ];
    }

    function D_Triangles (): pvec3_t[]
    {
        return [
            [0, 3, 1],
            [1, 3, 2],
            [4, 7, 0],
            [0, 7, 3],
            [5, 6, 4],
            [4, 6, 7],
            [1, 2, 5],
            [5, 2, 6],
            [4, 0, 5],
            [5, 0, 1],
            [3, 7, 2],
            [2, 7, 6]
        ];
    }

    function D_UVMap (): uvface_t[]
    {
        return [
            [0, 1, 2, "wood"],
            [2, 1, 3, "wood"],
            [0, 1, 2, "wood"],
            [2, 1, 3, "wood"],
            [0, 1, 2, "wood"],
            [2, 1, 3, "wood"],
            [0, 1, 2, "wood"],
            [2, 1, 3, "wood"],
            [0, 1, 2, "wood"],
            [2, 1, 3, "wood"],
            [0, 1, 2, "wood"],
            [2, 1, 3, "wood"]
        ];
    }

    function D_TextureAtlas (): { [textureId: string]: string }
    {
        return {
            "wood": "models/tmp3dcube/wood.png"
        };
    }

    window.__import__D_Mesh = function ()
    {
        return { D_Vertices, D_UV, D_Triangles, D_UVMap, D_TextureAtlas };
    };
})();
