/*
 *  g_run.ts
 *  tmp3d
 *
 *  Created by Emre Akı on 2022-02-13.
 *
 *  SYNOPSIS:
 *      The main module that houses the routines that are going to kickstart the
 *      engine and update both the game state and the frame buffer at each
 *      frame.
 */

(function (): void
{
    const { __DEBUG_MODE__: DEBUG_MODE } = window;

    const { A_Texture } = __import__A_Assets();

    const { AN_CancelAnimation } = __import__AN_Animation();

    const { D_GlobTextureIdTable } = __import__D_GlobTextures();

    const { FPS } = __import__G_Const();

    const {
        R_DebugStats,
        R_UpdateCamera,
    } = __import__R_Camera();

    const { R_FlushFrame } = __import__R_Draw();

    const {
        R_PrintOnScreenMessage,
        R_TitleDrawer,
    } = __import__R_Drawers();

    const {
        R_RenderGeometries,
        R_ToggleGlobalRotation,
        R_UpdateWorld,
    } = __import__R_Geometry();

    const {
        R_ChangeFillMode,
        R_ChangeLightingMode,
        R_TogglePointLight,
        R_ToggleSpecularHighlights,
        R_ToggleWireframe,
    } = __import__R_Shader();

    const TICK_DELAY = 1000 / FPS;

    // the unix timestamp of the latest game tick
    let lastTick: number | undefined;

    const nTrisOnScreen = new Uint32Array(2);

    function G_UpdateScreen (deltaT: number): void
    {
        R_RenderGeometries(nTrisOnScreen);
        R_FlushFrame();
        if (DEBUG_MODE) R_DebugStats(deltaT, nTrisOnScreen);
    }

    function G_UpdateGame (_deltaT: number): void
    {
        R_UpdateCamera(1); // TODO: take `deltaT` into account
        R_ToggleGlobalRotation();
        R_ToggleWireframe();          // need these events to be handled in
        R_ChangeFillMode();           // their own separate listeners so that
        R_ChangeLightingMode();       // the key strokes associated with each
        R_TogglePointLight();         // event can be captured individually
        R_ToggleSpecularHighlights(); // with no collisions
        R_UpdateWorld();
    }

    function G_Tick (deltaT: number): void
    {
        G_UpdateGame(deltaT); // update actors & game state
        G_UpdateScreen(deltaT); // update screen buffer
        R_PrintOnScreenMessage(); // print an on-screen message
    }

    function G_AdvanceTick (currentTick: number): void
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
        requestAnimationFrame(G_AdvanceTick);
    }

    function G_StartGame (titleId: string): void
    {
        // first, clear the title screen animation that is running
        AN_CancelAnimation(titleId);
        requestAnimationFrame(G_AdvanceTick); // then, kickstart the game ticks
    }

    function G_Run (setupResolution?: setup_resolution_t): void
    {
        if (!setupResolution) return; // exit with error
        // first, clear the frame buffer for any further drawing to take place
        R_FlushFrame();
        // then, clear the loading animation that is currently running
        AN_CancelAnimation(setupResolution.loadingId);
        /* finally, start the animation for the title screen */
        const titleId =
            R_TitleDrawer(A_Texture(D_GlobTextureIdTable.TITLE_TMP3D));
        document.addEventListener("keydown",
                                  G_StartGame.bind(undefined, titleId),
                                  { once: true });
    }

    window.__import__G_Run = function ()
    {
        return { G_Run };
    };
})();
