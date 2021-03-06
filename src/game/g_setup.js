/*
 *  g_setup.js
 *  tmp3d
 *
 *  Created by Emre Akı on 2022-02-13.
 *
 *  SYNOPSIS:
 *      The module for setting up various controllers, including I/O, static
 *      game data, and 3-D meshes for the engine to run off of.
 */

(function ()
{
    const A_Assets = __import__A_Assets();
    const A_LoadTextures = A_Assets.A_LoadTextures;

    const AN_Animation = __import__AN_Animation();
    const AN_CancelAnimation = AN_Animation.AN_CancelAnimation;

    const D_Mesh = __import__D_Mesh();
    const D_Vertices = D_Mesh.D_Vertices();
    const D_Triangles = D_Mesh.D_Triangles();
    const D_UV = D_Mesh.D_UV();
    const D_UVMap = D_Mesh.D_UVMap();
    const D_TextureAtlas = D_Mesh.D_TextureAtlas();

    const D_Player = __import__D_Player();
    const D_Velocity = D_Player.D_Velocity;
    const D_Eye = D_Player.D_Eye();

    const D_GlobTextures = __import__D_GlobTextures();
    const D_GlobTextureIdTable = D_GlobTextures.D_GlobTextureIdTable;
    const D_GlobTextureFilenameTable =
        D_GlobTextures.D_GlobTextureFilenameTable;

    const G_Const = __import__G_Const();
    const SCREEN_W = G_Const.SCREEN_W, SCREEN_H = G_Const.SCREEN_H;
    const FOV_Y = G_Const.FOV_Y;

    const I_Input = __import__I_Input();
    const I_InitKeyboard = I_Input.I_InitKeyboard;
    const I_InitMouse = I_Input.I_InitMouse;

    const R_Camera = __import__R_Camera();
    const R_InitCamera = R_Camera.R_InitCamera;

    const R_Drawers = __import__R_Drawers();
    const R_LoadingDrawer = R_Drawers.R_LoadingDrawer;
    const R_ErrorDrawer = R_Drawers.R_ErrorDrawer;

    const R_Geometry = __import__R_Geometry();
    const R_InitUVTable = R_Geometry.R_InitUVTable;
    const R_LoadGeometry = R_Geometry.R_LoadGeometry;

    const R_Screen = __import__R_Screen();
    const R_InitBuffer = R_Screen.R_InitBuffer;
    const R_ScreenElement = R_Screen.R_ScreenElement;

    const Z_NEAR = SCREEN_H * 0.5 / Math.tan(FOV_Y * 0.5);
    const Z_FAR = 4 * Z_NEAR;
    const ASPECT = SCREEN_W / SCREEN_H;

    function G_LoadTextures ()
    {
        const meshTextureIds = Object.keys(D_TextureAtlas);
        const globTextureIds = Object.keys(D_GlobTextureIdTable);
        const textureIds = meshTextureIds.concat(globTextureIds);
        const meshTextureFilenames = Object.values(D_TextureAtlas);
        const globTextureFilenames = Object.values(D_GlobTextureFilenameTable);
        const textureFilenames = meshTextureFilenames
            .concat(globTextureFilenames);
        const numTextures = textureFilenames.length;
        return A_LoadTextures(textureIds, textureFilenames, numTextures);
    }

    function G_SetupPromise ()
    {
        return G_LoadTextures();
        // TODO: other async operations will go here, chained by `.then`s
    }

    function G_Setup ()
    {
        // play a loading animation during the setup procedure
        const resolution = { loadingId: R_LoadingDrawer() };
        /* sync operations */
        try
        {
            I_InitKeyboard(document);
            I_InitMouse(R_ScreenElement);
            R_InitBuffer(SCREEN_W, SCREEN_H);
            R_InitCamera(FOV_Y, ASPECT, Z_NEAR, Z_FAR, D_Eye, D_Velocity);
            R_LoadGeometry(D_Vertices, D_Triangles, D_Triangles.length);
            /* initialize the uv table if the mesh data have texture-mapping */
            if (D_UV.length && D_UVMap.length)
                R_InitUVTable(D_UV, D_UVMap, D_UVMap.length);
        }
        catch (error)
        {
            AN_CancelAnimation(resolution.loadingId);
            R_ErrorDrawer("setup error");
            throw error;
        }
        /* async operations */
        return G_SetupPromise()
            .then(function G_SetupResolver ()
            {
                return resolution;
            })
            .catch(function G_SetupRejector ()
            {
                AN_CancelAnimation(resolution.loadingId);
                R_ErrorDrawer("setup error");
            });
    }

    window.__import__G_Setup = function ()
    {
        return { G_Setup: G_Setup };
    };
})();
