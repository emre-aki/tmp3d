/*
 *  d_textures.ts
 *  tmp3d
 *
 *  Created by Emre Akı on 2022-05-03.
 *
 *  SYNOPSIS:
 *      Lookup tables for "global" textures.
 */

(function (): void
{
    const GLOB_TEXTURE_ID_TABLE = { TITLE_TMP3D: "TITLE_TMP3D" } as const;

    function D_GlobTextureIdTable (): typeof GLOB_TEXTURE_ID_TABLE
    {
        return GLOB_TEXTURE_ID_TABLE;
    }

    function
    D_GlobTextureFilenameTable
    (): { [id in (keyof typeof GLOB_TEXTURE_ID_TABLE)]: string }
    {
        return { [GLOB_TEXTURE_ID_TABLE.TITLE_TMP3D]: "textures/tmp3d_2x.png" };
    }

    window.__import__D_GlobTextures = function ()
    {
        return {
            D_GlobTextureIdTable: D_GlobTextureIdTable(),
            D_GlobTextureFilenameTable: D_GlobTextureFilenameTable(),
        };
    };
})();
