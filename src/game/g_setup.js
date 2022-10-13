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

    const G_Demo = __import__G_Demo();
    const G_DemoVertices = G_Demo.G_DemoVertices();
    const G_DemoTriangles = G_Demo.G_DemoTriangles();

    const D_Player = __import__D_Player();
    const D_Velocity = D_Player.D_Velocity;
    const D_Eye = D_Player.D_Eye();

    const D_GlobTextures = __import__D_GlobTextures();
    const D_GlobTextureIdTable = D_GlobTextures.D_GlobTextureIdTable;
    const D_GlobTextureFilenameTable =
        D_GlobTextures.D_GlobTextureFilenameTable;

    const G_Const = __import__G_Const();
    const ASPECT = G_Const.ASPECT;
    const FOV_Y = G_Const.FOV_Y;
    const Z_NEAR = G_Const.Z_NEAR, Z_FAR = G_Const.Z_FAR;

    const I_Input = __import__I_Input();
    const I_InitKeyboard = I_Input.I_InitKeyboard;
    const I_InitMouse = I_Input.I_InitMouse;

    const R_Camera = __import__R_Camera();
    const R_InitCamera = R_Camera.R_InitCamera;

    const R_Draw = __import__R_Draw();
    const R_InitFrameBuffer = R_Draw.R_InitFrameBuffer;
    const R_InitZBuffer = R_Draw.R_InitZBuffer;

    const R_Drawers = __import__R_Drawers();
    const R_LoadingDrawer = R_Drawers.R_LoadingDrawer;
    const R_ErrorDrawer = R_Drawers.R_ErrorDrawer;

    const R_Geometry = __import__R_Geometry();
    const R_InitUVTable = R_Geometry.R_InitUVTable;
    const R_LoadGeometry = R_Geometry.R_LoadGeometry;

    const R_Screen = __import__R_Screen();
    const R_ScreenElement = R_Screen.R_ScreenElement;

    function G_LoadTextures ()
    {
        const globTextureIds = Object.keys(D_GlobTextureIdTable);
        const textureIds = globTextureIds;
        const globTextureFilenames = Object.values(D_GlobTextureFilenameTable);
        const textureFilenames = globTextureFilenames;
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
        // initialize the frame buffer first, before anything could be drawn on
        // the screen
        R_InitFrameBuffer();
        // play a loading animation during the setup procedure
        const resolution = { loadingId: R_LoadingDrawer() };
        /* sync operations */
        try
        {
            I_InitKeyboard(document);
            I_InitMouse(R_ScreenElement);
            R_InitZBuffer();
            R_InitCamera(FOV_Y, ASPECT, Z_NEAR, Z_FAR, D_Eye, D_Velocity);
            R_LoadGeometry(G_DemoVertices,
                           G_DemoTriangles,
                           G_DemoTriangles.length);
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
