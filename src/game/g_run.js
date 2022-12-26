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

    const D_GlobTextures = __import__D_GlobTextures();
    const D_GlobTextureIdTable = D_GlobTextures.D_GlobTextureIdTable;

    const G_Const = __import__G_Const();
    const FPS = G_Const.FPS;

    const R_Camera = __import__R_Camera();
    const R_UpdateCamera = R_Camera.R_UpdateCamera;
    const R_DebugStats = R_Camera.R_DebugStats;

    const R_Draw = __import__R_Draw();
    const R_ResetFrameBuffer = R_Draw.R_ResetFrameBuffer;
    const R_FlushFrame = R_Draw.R_FlushFrame;
    const R_ResetZBuffer = R_Draw.R_ResetZBuffer;

    const R_Drawers = __import__R_Drawers();
    const R_TitleDrawer = R_Drawers.R_TitleDrawer;

    const R_Geometry = __import__R_Geometry();
    const R_ChangeRenderMode = R_Geometry.R_ChangeRenderMode;
    const R_RenderGeometries = R_Geometry.R_RenderGeometries;
    const R_ToggleGlobalRotation = R_Geometry.R_ToggleGlobalRotation;
    const R_Tris = R_Geometry.R_Tris;
    const R_UpdateGeometry = R_Geometry.R_UpdateGeometry;

    const TICK_DELAY = 1000 / FPS;

    let lastTickId; // an id that uniquely identifies the latest game tick
    let lastTick; // the unix timestamp of the latest game tick

    const nTrisOnScreen = new Uint32Array(2);

    function G_UpdateScreen (deltaT, tris)
    {
        // clear the frame buffer so that the frame can start fresh
        R_ResetFrameBuffer();
        R_ResetZBuffer();
        R_ChangeRenderMode();
        R_RenderGeometries(nTrisOnScreen);
        R_FlushFrame();
        if (DEBUG_MODE) R_DebugStats(deltaT, nTrisOnScreen);
    }

    function G_UpdateGame (deltaT, tris)
    {
        R_UpdateCamera(1); // TODO: take `deltaT` into account
        R_ToggleGlobalRotation();
        R_UpdateGeometry();
    }

    function G_Tick (deltaT)
    {
        const tris = R_Tris();
        G_UpdateGame(deltaT, tris); // update actors & game state
        G_UpdateScreen(deltaT, tris); // update screen buffer
    }

    function G_AdvanceTick (currentTick)
    {
        if (lastTick === undefined) lastTick = currentTick;
        const deltaT = currentTick - lastTick;
        if (deltaT >= TICK_DELAY)
        {
            // TODO: consider executing only the screen updates in the `RAF`
            // callback
            G_Tick(deltaT);
            lastTick = currentTick;
        }
        lastTickId = requestAnimationFrame(G_AdvanceTick);
    }

    function G_StartGame (titleId)
    {
        // first, clear the title screen animation that is running
        AN_CancelAnimation(titleId);
        requestAnimationFrame(G_AdvanceTick); // then, kickstart the game ticks
    }

    function G_Run (setupResolution)
    {
        if (!setupResolution) return; // exit with error
        // first, clear the frame buffer for any further drawing to take place
        R_ResetFrameBuffer();
        // then, clear the loading animation that is currently running
        AN_CancelAnimation(setupResolution.loadingId);
        /* finally, start the animation for the title screen */
        const titleId =
            R_TitleDrawer(A_Texture(D_GlobTextureIdTable.TITLE_TMP3D));
        document.addEventListener("keydown",
                                  G_StartGame.bind(this, titleId),
                                  { once: 1 });
    }

    window.__import__G_Run = function ()
    {
        return { G_Run: G_Run };
    };
})();
