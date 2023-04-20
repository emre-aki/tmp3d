/*
 *  r_screen.ts
 *  tmp3d
 *
 *  Created by Emre Akı on 2022-02-13.
 *
 *  SYNOPSIS:
 *      The frontend for the rendering.
 *
 *      Exposes some routines for setting up an HTML5 `canvas` element, as well
 *      as for clearing, and flushing the frame buffer onto the actual screen
 *      for the rendering backend to operate on.
 */

(function (): void
{
    const screen = document.getElementById("canvas") as HTMLCanvasElement;
    const ctx = screen.getContext("2d")!;

    function R_FlushBuffer (buffer: ImageData): void
    {
        ctx.putImageData(buffer, 0, 0);
    }

    function R_InitBuffer (w: number, h: number): ImageData
    {
        screen.width = w; screen.height = h;

        return ctx.getImageData(0, 0, w, h);
    }

    window.__import__R_Screen = function ()
    {
        return {
            R_ScreenElement: screen,
            R_Ctx: ctx,
            R_FlushBuffer: R_FlushBuffer,
            R_InitBuffer: R_InitBuffer,
        };
    };
})();
