/*
 *  g_setup.ts
 *  tmp3d
 *
 *  Created by Emre Akı on 2022-02-13.
 *
 *  SYNOPSIS:
 *      The module for setting up various controllers, including I/O, static
 *      game data, and 3-D meshes for the engine to run off of.
 */

(function (): void
{
    const { A_LoadTextures } = __import__A_Assets();

    const { AN_CancelAnimation } = __import__AN_Animation();

    const {
        D_TextureAtlas,
        D_Triangles,
        D_UV,
        D_UVMap,
        D_Vertices,
    } = __import__D_Mesh();

    const {
        D_Eye,
        D_Velocity,
    } = __import__D_Player();

    const {
        D_GlobTextureFilenameTable,
        D_GlobTextureIdTable,
    } = __import__D_GlobTextures();

    const {
        ASPECT,
        FOV_Y,
        Z_NEAR, Z_FAR,
    } = __import__G_Const();

    const {
        I_InitKeyboard,
        I_InitMouse,
    } = __import__I_Input();

    const { R_InitCamera } = __import__R_Camera();

    const {
        R_InitFrameBuffer,
        R_InitZBuffer,
    } = __import__R_Draw();

    const {
        R_ErrorDrawer,
        R_LoadingDrawer,
    } = __import__R_Drawers();

    const {
        R_InitUVTable,
        R_LoadGeometry,
    } = __import__R_Geometry();

    const { R_ScreenElement } = __import__R_Screen();

    const eye = D_Eye();
    const vertices = D_Vertices(), triangles = D_Triangles();
    const uvs = D_UV(), uvMap = D_UVMap(), textureAtlas = D_TextureAtlas();

    function G_LoadTextures (): Promise<void[]>
    {
        const meshTextureIds = Object.keys(textureAtlas);
        const globTextureIds = Object.keys(D_GlobTextureIdTable);
        const textureIds = meshTextureIds.concat(globTextureIds);
        const meshTextureFilenames = Object.values(textureAtlas);
        const globTextureFilenames = Object.values(D_GlobTextureFilenameTable);
        const textureFilenames = meshTextureFilenames
            .concat(globTextureFilenames);
        const numTextures = textureFilenames.length;

        return A_LoadTextures(textureIds, textureFilenames, numTextures);
    }

    function G_SetupPromise (): Promise<void[]>
    {
        return G_LoadTextures();
        // TODO: other async operations will go here, chained by `.then`s
    }

    function G_Setup (): Promise<setup_resolution_t | undefined>
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
            R_InitCamera(FOV_Y, ASPECT, Z_NEAR, Z_FAR, eye, D_Velocity);
            R_LoadGeometry(vertices, vertices.length,
                           triangles, triangles.length);
            /* initialize the uv table if the mesh data have texture-mapping */
            if (uvs.length && uvMap.length)
                R_InitUVTable(uvs, uvMap, uvMap.length);
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

                return undefined;
            });
    }

    window.__import__G_Setup = function ()
    {
        return { G_Setup };
    };
})();
