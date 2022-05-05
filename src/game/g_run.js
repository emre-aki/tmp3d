/*
 *  g_run.js
 *  tmp3d
 *
 *  Created by Emre Akı on 2022-02-13.
 *
 *  SYNOPSIS:
 *      The main module that houses the routines that are going to kickstart the
 *      engine and update both the game state and the frame buffer at each
 *      frame.
 */

(function ()
{
    const DEBUG_MODE = window.__DEBUG_MODE__;

    const A_Assets = __import__A_Assets();
    const A_Texture = A_Assets.A_Texture;

    const AN_Animation = __import__AN_Animation();
    const AN_CancelAnimation = AN_Animation.AN_CancelAnimation;

    const D_Textures = __import__D_Textures();
    const D_TextureIdTable = D_Textures.D_TextureIdTable;

    const G_Const = __import__G_Const();
    const FPS = G_Const.FPS;

    const R_Camera = __import__R_Camera();
    const R_UpdateCamera = R_Camera.R_UpdateCamera;
    const R_DebugAxes = R_Camera.R_DebugAxes;
    const R_DebugStats = R_Camera.R_DebugStats;

    const R_Draw = __import__R_Draw();
    const R_ClearBuffer = R_Draw.R_ClearBuffer;

    const R_Drawers = __import__R_Drawers();
    const R_TitleDrawer = R_Drawers.R_TitleDrawer;

    const R_Geometry = __import__R_Geometry();
    const R_RenderGeometry = R_Geometry.R_RenderGeometry;
    const R_TriPool = R_Geometry.R_TriPool;

    const R_Screen = __import__R_Screen();
    const R_FlushBuffer = R_Screen.R_FlushBuffer;

    const TICK_DELAY = 1000 / FPS;
    let tickInterval;
    let lastTick;

    function G_UpdateScreen (deltaT, tris)
    {
        R_ClearBuffer();
        R_RenderGeometry();
        if (DEBUG_MODE) R_DebugAxes(deltaT);
        R_FlushBuffer();
        if (DEBUG_MODE) R_DebugStats(deltaT);
    }

    function G_UpdateGame (deltaT, tris)
    {
        R_UpdateCamera(1); // TODO: take `deltaT` into account
        // TODO: update world geometry
    }

    function G_Tick (deltaT)
    {
        const tris = R_TriPool();
        G_UpdateGame(deltaT, tris); // update actors & game state
        G_UpdateScreen(deltaT, tris); // update screen buffer
    }

    function G_AdvanceTick ()
    {
        const currentTick = Date.now();
        if (lastTick === undefined) lastTick = currentTick;
        G_Tick(currentTick - lastTick);
        lastTick = currentTick;
    }

    function G_StartGame (titleId)
    {
        // first, clear the title screen animation that is running
        AN_CancelAnimation(titleId);
        // then, kickstart the game ticks
        tickInterval = setInterval(G_AdvanceTick, TICK_DELAY);
    }

    function G_Run (setupResolution)
    {
        if (!setupResolution) return; // exit with error
        // first, clear the frame buffer for any further drawing to take place
        R_ClearBuffer();
        // then, clear the loading animation that is currently running
        AN_CancelAnimation(setupResolution.loadingId);
        // finally, start the animation for the title screen
        const titleId = R_TitleDrawer(A_Texture(D_TextureIdTable.TITLE_TMP3D));
        document.addEventListener("keydown",
                                  G_StartGame.bind(this, titleId),
                                  { once: 1 });
    }

    window.__import__G_Run = function ()
    {
        return { G_Run: G_Run };
    };
})();
