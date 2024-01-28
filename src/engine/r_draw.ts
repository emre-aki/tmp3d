/*
 *  r_draw.ts
 *  tmp3d
 *
 *  Created by Emre Akı on 2022-02-13.
 *
 *  SYNOPSIS:
 *      The rendering backend.
 *
 *      The module that helps draw some graphics primitives, as well as other
 *      more advanced visual effects, directly onto the frame buffer.
 */

(function (): void
{
    const G_Const = __import__G_Const();
    const SCREEN_W = G_Const.SCREEN_W, SCREEN_H = G_Const.SCREEN_H;
    const N_PIXELS = SCREEN_W * SCREEN_H;

    const M_Collision = __import__M_Collision();
    const M_LineVsLine2 = M_Collision.M_LineVsLine2;

    const M_Math = __import__M_Math();
    const M_Clamp = M_Math.M_Clamp;
    const M_FastSign = M_Math.M_FastSign;

    const M_Vec2 = __import__M_Vec2();
    const Vec2 = M_Vec2.M_Vec2;

    const R_Screen = __import__R_Screen();
    const R_Ctx = R_Screen.R_Ctx;
    const R_FlushBuffer = R_Screen.R_FlushBuffer;
    const R_InitBuffer = R_Screen.R_InitBuffer;

    /* double-buffering */
    let frameBuffer: ImageData, cleanFrameBuffer: Uint8ClampedArray;
    let zBuffer: Float32Array, cleanZBuffer: Float32Array;

    function R_InitFrameBuffer (): void
    {
        const frameBufferSize = N_PIXELS << 2;
        cleanFrameBuffer = new Uint8ClampedArray(frameBufferSize);
        for (let i = 3; i < frameBufferSize; i += 4) cleanFrameBuffer[i] = 255;
        frameBuffer = R_InitBuffer(SCREEN_W, SCREEN_H);
    }

    function R_InitZBuffer (): void
    {
        cleanZBuffer = new Float32Array(N_PIXELS);
        zBuffer = new Float32Array(N_PIXELS);
    }

    function R_FlushFrame (): void
    {
        R_FlushBuffer(frameBuffer);
        frameBuffer.data.set(cleanFrameBuffer);
        zBuffer.set(cleanZBuffer);
    }

    function
    R_FillRect
    ( x: number, y: number,
      w: number, h: number,
      r: number, g: number, b: number, a: number ): void
    {
        const sX = M_Clamp(Math.ceil(x - 0.5), 0, SCREEN_W);
        const sY = M_Clamp(Math.ceil(y - 0.5), 0, SCREEN_H);
        const dX = M_Clamp(Math.ceil(x + w - 0.5), 0, SCREEN_W);
        const dY = M_Clamp(Math.ceil(y + h - 0.5), 0, SCREEN_H);
        if (sX === dX || sY === dY) return; // early return if not a rectangle
        for (let brushY = sY; brushY < dY; ++brushY)
        {
            for (let brushX = sX; brushX < dX; ++brushX)
            {
                const pixIndex = (SCREEN_W * brushY + brushX) << 2;
                const bufferRed = frameBuffer.data[pixIndex];
                const bufferGreen = frameBuffer.data[pixIndex + 1];
                const bufferBlue = frameBuffer.data[pixIndex + 2];
                const bufferAlpha = frameBuffer.data[pixIndex + 3] || 255;
                const blend = a / bufferAlpha, blendInv = 1 - blend;
                const newRed = blend * r + blendInv * bufferRed;
                const newGreen = blend * g + blendInv * bufferGreen;
                const newBlue = blend * b + blendInv * bufferBlue;
                frameBuffer.data[pixIndex] = newRed;
                frameBuffer.data[pixIndex + 1] = newGreen;
                frameBuffer.data[pixIndex + 2] = newBlue;
                frameBuffer.data[pixIndex + 3] = 255;
            }
        }
    }

    function
    R_ClampLine
    ( sx: number, sy: number,
      dx: number, dy: number,
      sClamped: vec2_t,
      dClamped: vec2_t ): 1 | 0
    {
        let nVerticesInside = 0;
        const inside = Array<vec2_t>(2);
        // start with the assumption that both endpoints (vertices) are within
        // the bounds of the framebuffer
        sClamped[0] = sx; sClamped[1] = sy; dClamped[0] = dx; dClamped[1] = dy;
        /* if vertex `s` is already within the bounds of the framebuffer */
        if (sClamped[0] >= 0 && sClamped[0] < SCREEN_W &&
            sClamped[1] >= 0 && sClamped[1] < SCREEN_H)
            inside[nVerticesInside++] = sClamped;
        /* if vertex `d` is already within the bounds of the framebuffer */
        if (dClamped[0] >= 0 && dClamped[0] < SCREEN_W &&
            dClamped[1] >= 0 && dClamped[1] < SCREEN_H)
            inside[nVerticesInside++] = dClamped;
        // early return if both endpoints are indeed within the bounds of the
        // framebuffer
        if (nVerticesInside === 2) return 1;
        /* test to see whether the line intersects with any one or two edges of
         * the framebuffer
         */
        const top = M_LineVsLine2(0, 0, SCREEN_W, 0, sx, sy, dx, dy, 1);
        const right = M_LineVsLine2(SCREEN_W, 0, SCREEN_W, SCREEN_H,
                                    sx, sy, dx, dy, 1);
        const bottom = M_LineVsLine2(0, SCREEN_H, SCREEN_W, SCREEN_H,
                                     sx, sy, dx, dy, 1);
        const left = M_LineVsLine2(0, 0, 0, SCREEN_H, sx, sy, dx, dy, 1);
        if (top && !(isNaN(top[0]) || isNaN(top[1])))
            inside[nVerticesInside++] = top;
        if (right && !(isNaN(right[0]) || isNaN(right[1])))
            inside[nVerticesInside++] = right;
        if (bottom && !(isNaN(bottom[0]) || isNaN(bottom[1])))
            inside[nVerticesInside++] = bottom;
        if (left && !(isNaN(left[0]) || isNaN(left[1])))
            inside[nVerticesInside++] = left;
        // exit with a value of `0` indicating the line lies completely outside
        // the bounds of the framebuffer
        if (nVerticesInside !== 2) return 0;
        sClamped[0] = inside[0][0]; sClamped[1] = inside[0][1];
        dClamped[0] = inside[1][0]; dClamped[1] = inside[1][1];

        // exit with a value of `1` indicating the clamped line is contained
        // within the bounds of the framebuffer
        return 1;
    }

    function
    R_Bresenham_HorizontalSweep
    ( sx: number, sy: number,
      dx: number, dy: number,
      r: number, g: number, b: number, a: number,
      stroke: number ): void
    {
        const deltaX = dx - sx, deltaY = dy - sy;
        const dirY = M_FastSign(deltaY), strokeY = dirY * stroke;
        // need to fix the signs in the formulae
        const deltaYAbs = deltaY * dirY;
        // the increment for Pk+1, if Pk < 0
        const pIncrementForSameRow = deltaYAbs + deltaYAbs;
        // the increment for Pk+1, if Pk >= 0
        const pIncrementForNextRow = 0 - deltaX - deltaX;
        // the initial value for the decision parameter, P0
        const p0 = pIncrementForSameRow + pIncrementForNextRow + deltaX;
        for (let x = sx, y = sy, pK = p0; x < dx; x += stroke)
        {
            R_FillRect(x, y, stroke, stroke, r, g, b, a);
            const decision = ~(pK >> 31);
            pK += pIncrementForSameRow;
            pK += pIncrementForNextRow & decision;
            y += strokeY & decision;
        }
    }

    function
    R_Bresenham_VerticalSweep
    ( sx: number, sy: number,
      dx: number, dy: number,
      r: number, g: number, b: number, a: number,
      stroke: number ): void
    {
        const deltaX = dx - sx, deltaY = dy - sy;
        const dirX = M_FastSign(deltaX), strokeX = dirX * stroke;
        // need to fix the signs in the formulae
        const deltaXAbs = deltaX * dirX;
        // the increment for Pk+1, if Pk < 0
        const pIncrementForSameCol = deltaXAbs + deltaXAbs;
        // the increment for Pk+1, if Pk >= 0
        const pIncrementForNextCol = 0 - deltaY - deltaY;
        // the initial value for the decision parameter, P0
        const p0 = pIncrementForSameCol + pIncrementForNextCol + deltaY;
        for (let x = sx, y = sy, pK = p0; y < dy; y += stroke)
        {
            R_FillRect(x, y, stroke, stroke, r, g, b, a);
            const decision = ~(pK >> 31);
            pK += pIncrementForSameCol;
            pK += pIncrementForNextCol & decision;
            x += strokeX & decision;
        }
    }

    //
    // R_DrawLine
    // Employs Bresenham's algorithm for drawing lines
    //
    function
    R_DrawLine
    ( sx: number, sy: number,
      dx: number, dy: number,
      r: number, g: number, b: number, a: number,
      stroke: number ): void
    {
        /* clip those portions of the line that extend beyond the bounds of the
         * framebuffer
         */
        const sClamped = Vec2(0, 0), dClamped = Vec2(0, 0);
        if (!R_ClampLine(sx, sy, dx, dy, sClamped, dClamped)) return;
        const cSX = Math.floor(sClamped[0]), cSY = Math.floor(sClamped[1]);
        const cDX = Math.floor(dClamped[0]), cDY = Math.floor(dClamped[1]);
        // early return if nothing to draw
        if (cSX === cDX && cSY === cDY) return;
        /* branch out based on the octant the line falls in */
        const isVerticalSweep = Math.abs(cDX - cSX) < Math.abs(cDY - cSY);
        if (isVerticalSweep && cDY > cSY) // should always grow in y-direction
            R_Bresenham_VerticalSweep(cSX, cSY, cDX, cDY, r, g, b, a, stroke);
        else if (isVerticalSweep)
            R_Bresenham_VerticalSweep(cDX, cDY, cSX, cSY, r, g, b, a, stroke);
        else if (cDX > cSX) // should always grow in x-direction
            R_Bresenham_HorizontalSweep(cSX, cSY, cDX, cDY, r, g, b, a, stroke);
        else
            R_Bresenham_HorizontalSweep(cDX, cDY, cSX, cSY, r, g, b, a, stroke);
    }

    //
    // R_DrawLine_DDA
    // Interpolates a line between given endpoints by accumulating constant step
    // variables akin to a DDA
    //
    function
    R_DrawLine_DDA
    ( sx: number, sy: number,
      dx: number, dy: number,
      r: number, g: number, b: number, a: number,
      stroke: number ): void
    {
        /* clip those portions of the line that extend beyond the bounds of the
         * framebuffer
         */
        const sClamped = Vec2(0, 0), dClamped = Vec2(0, 0);
        if (!R_ClampLine(sx, sy, dx, dy, sClamped, dClamped)) return;
        const cSX = Math.floor(sClamped[0]), cSY = Math.floor(sClamped[1]);
        const cDX = Math.floor(dClamped[0]), cDY = Math.floor(dClamped[1]);
        // early return if nothing to draw
        if (cSX === cDX && cSY === cDY) return;
        /* calculate step variables */
        const deltaX = cDX - cSX, deltaY = cDY - cSY;
        const dirX = Math.sign(deltaX), dirY = Math.sign(deltaY);
        const slope = deltaY / deltaX, slopeInverse = deltaX / deltaY;
        const strokeInXHorizontal = stroke * dirX;
        const stepInYHorizontal = slope * dirX;
        const strokeInYVertical = stroke * dirY;
        const stepInXVertical = slopeInverse * dirY;
        if (strokeInXHorizontal)
        {
            for (let x = cSX, y = cSY;
                 (cDX - x) * dirX > 0;
                 x += strokeInXHorizontal)
            {
                const Y = cSY + Math.floor(y - cSY) * stroke;
                R_FillRect(x, Y, stroke, stroke, r, g, b, a);
                y += stepInYHorizontal;
            }
        }
        if (strokeInYVertical)
        {
            for (let x = cSX, y = cSY;
                 (cDY - y) * dirY > 0;
                 y += strokeInYVertical)
            {
                const X = cSX + Math.floor(x - cSX) * stroke;
                R_FillRect(X, y, stroke, stroke, r, g, b, a);
                x += stepInXVertical;
            }
        }
    }

    //
    // R_DrawLine_RayCast
    // Interpolates a line between given endpoints by casting a ray
    //
    function
    R_DrawLine_RayCast
    ( sx: number, sy: number,
      dx: number, dy: number,
      r: number, g: number, b: number, a: number,
      stroke: number ): void
    {
        /* clip those portions of the line that extend beyond the bounds of the
         * framebuffer
         */
        const sClamped = Vec2(0, 0), dClamped = Vec2(0, 0);
        if (!R_ClampLine(sx, sy, dx, dy, sClamped, dClamped)) return;
        const cSX = Math.floor(sClamped[0]), cSY = Math.floor(sClamped[1]);
        const cDX = Math.floor(dClamped[0]), cDY = Math.floor(dClamped[1]);
        // early return if nothing to draw
        if (cSX === cDX && cSY === cDY) return;
        const deltaX = cDX - cSX, deltaY = cDY - cSY;
        const dirX = Math.sign(deltaX), dirY = Math.sign(deltaY);
        const slope = deltaY / deltaX, slopeInverse = deltaX / deltaY;
        const stepVerticalY = dirX * slope;
        const stepHorizontalX = dirY * slopeInverse;
        const strokeXVertical = dirX * stroke;
        const strokeYVertical = stepVerticalY * stroke;
        const strokeXHorizontal = stepHorizontalX * stroke;
        const strokeYHorizontal = dirY * stroke;
        const lineLength = deltaX * deltaX + deltaY * deltaY;
        let currentLength = 0;
        let x = cSX, y = cSY;
        let traceVerticalX = dirX > 0 ? cSX + 1 : cSX;
        let traceVerticalY = cSY + (traceVerticalX - cSX) * slope;
        let traceHorizontalY = dirY > 0 ? cSY + 1 : cSY;
        let traceHorizontalX = cSX + (traceHorizontalY - cSY) * slopeInverse;
        let advanceVertically;
        while (currentLength < lineLength)
        {
            R_FillRect(x, y, stroke, stroke, r, g, b, a);
            const verticalDistInX = traceVerticalX - cSX;
            const verticalDistInY = traceVerticalY - cSY;
            const horizontalDistInX = traceHorizontalX - cSX;
            const horizontalDistInY = traceHorizontalY - cSY;
            const distVertical = verticalDistInX * verticalDistInX +
                                 verticalDistInY * verticalDistInY;
            const distHorizontal = horizontalDistInX * horizontalDistInX +
                                   horizontalDistInY * horizontalDistInY;
            advanceVertically = Number.isNaN(distVertical) ||
                                distVertical > distHorizontal
                                    ? 0 : distVertical === distHorizontal
                                        ? advanceVertically : 1;
            currentLength = advanceVertically ? distVertical : distHorizontal;
            if (advanceVertically)
            {
                x += strokeXVertical;
                traceVerticalX += strokeXVertical;
                traceVerticalY += strokeYVertical;
            }
            else
            {
                y += strokeYHorizontal;
                traceHorizontalX += strokeXHorizontal;
                traceHorizontalY += strokeYHorizontal;
            }
        }
    }

    //
    // R_DrawCircle
    // Employs Bresenham's algorithm for drawing circles
    //
    function
    R_DrawCircle
    ( x: number, y: number,
      radius: number,
      r: number, g: number, b: number, a: number ): void
    {
        const ox = Math.floor(x), oy = Math.floor(y); // center of the circle
        const diam = radius + radius;
        let px = 4 - diam - diam, py = 2, p = 1 - diam; // decision parameters
        let cx = radius, cy = 0; // where we're currently sitting on the circle
        /* iterate through a single octant of the circle */
        while (cx >= cy)
        {
            let rx0, rx1, ry; // endpoints of the current scanline
            /* fill in a scanline that scretches over the 1st and 4th octants */
            rx0 = ox - cx; rx1 = ox + cx; ry = oy + cy;
            for (let rxi = rx0; rxi <= rx1; ++rxi)
                R_FillRect(rxi, ry, 1, 1, r, g, b, a);
            /* fill in a scanline that scretches over the 2nd and 3rd octants */
            rx0 = ox - cy; rx1 = ox + cy; ry = oy + cx;
            for (let rxi = rx0; rxi <= rx1; ++rxi)
                R_FillRect(rxi, ry, 1, 1, r, g, b, a);
            /* fill in a scanline that scretches over the 5th and 8th octants */
            rx0 = ox - cx; rx1 = ox + cx; ry = oy - cy;
            for (let rxi = rx0; rxi <= rx1; ++rxi)
                R_FillRect(rxi, ry, 1, 1, r, g, b, a);
            /* fill in a scanline that scretches over the 6th and 7th octants */
            rx0 = ox - cy; rx1 = ox + cy; ry = oy - cx;
            for (let rxi = rx0; rxi <= rx1; ++rxi)
                R_FillRect(rxi, ry, 1, 1, r, g, b, a);
            const decision = ~(p >> 31); // should we decrement `cx` by 1?
            /* first, update the individual deltas that contribute to the main
             * decision parameter...
             */
            px += 4 & decision;
            py += 4;
            /* ...then, advance the point on the circle... */
            cx += decision;
            ++cy;
            // ...and finally, update the main decision parameter
            p += (px & decision) + py;
        }
    }

    function
    R_DrawTriangle_Wireframe
    ( ax: number, ay: number,
      bx: number, by: number,
      cx: number, cy: number,
      r: number, g: number, b: number, a: number,
      stroke: number ): void
    {
        R_DrawLine(ax, ay, bx, by, r, g, b, a, stroke);
        R_DrawLine(ax, ay, cx, cy, r, g, b, a, stroke);
        R_DrawLine(bx, by, cx, cy, r, g, b, a, stroke);
    }

    //
    // R_LerpScanline_Flat
    // Lerp a single flat-shaded scanline
    //
    function
    R_LerpScanline_Flat
    ({ dy,
       dx0, dx1,
       w0, w1,
       r0, g0, b0, r1, g1, b1,
       normalX, normalY, normalZ,
       lightX, lightY, lightZ,
       alpha }: pso_t): void
    {
        let lightLevel = 1;
        if (lightX !== undefined &&
            lightY !== undefined &&
            lightZ !== undefined &&
            normalX !== undefined &&
            normalY !== undefined &&
            normalZ !== undefined)
            lightLevel = lightX * normalX + lightY * normalY + lightZ * normalZ;
        // raster clipping: clip the scanline if it goes out-of-bounds of screen
        // coordinates
        const clipLeft = Math.max(-dx0, 0);
        // bias the start and end endpoints in screen space by -0.5 horizontally
        // as per the top-left pixel coverage rules
        const dX0 = Math.ceil(dx0 + clipLeft - 0.5), dX1 = Math.ceil(dx1 - 0.5);
        const deltaX = dx1 - dx0, deltaX_ = 1 / deltaX;
        // pre-step from start by 0.5 as pixel centers are the actual sampling
        // points
        const preStepX = dX0 + 0.5 - dx0;
        // 1 step in `+x` equals how many steps in `w`
        const gradW = (w1 - w0) * deltaX_;
        // 1 step in `+x` equals how many steps in `r`
        const gradR = (r1 - r0) * deltaX_;
        // 1 step in `+x` equals how many steps in `g`
        const gradG = (g1 - g0) * deltaX_;
        // 1 step in `+x` equals how many steps in `b`
        const gradB = (b1 - b0) * deltaX_;
        // current z-coordinate in the perspective-correct space
        let w = preStepX * gradW + w0;
        /* the coordinates in the perspective-correct RGB space of the color to
         * fill the current pixel with
         */
        let r = preStepX * gradR + r0;
        let g = preStepX * gradG + g0;
        let b = preStepX * gradB + b0;
        // alpha blending — how much we should sample from the new color
        const sampleAlpha = 255 * alpha;
        /* rasterize current scanline */
        for (let x = dX0; x < dX1 && x < SCREEN_W; ++x)
        {
            const bufferIndex = dy * SCREEN_W + x;
            /* skip filling in the pixel unless the current pixel in the raster
             * triangle is closer (1 / zRaster > 1 / zBuffer) than what's
             * already in the z-buffer at the position we want to draw
             */
            if (w <= zBuffer[bufferIndex])
            {
                w += gradW;
                r += gradR; g += gradG; b += gradB;

                continue;
            }
            zBuffer[bufferIndex] = w; // update the z-buffer
            const w_ = 1 / w;
            /* fill a single pixel in screen space with the color defined by
             * parameters `r`, `g`, `b`, and `alpha`.
             */
            const paintIndex = bufferIndex << 2;
            const bufferRed = frameBuffer.data[paintIndex];
            const bufferGreen = frameBuffer.data[paintIndex + 1];
            const bufferBlue = frameBuffer.data[paintIndex + 2];
            const bufferAlpha = frameBuffer.data[paintIndex + 3] || 255;
            const blendRatio = sampleAlpha / bufferAlpha;
            const blendRatio_ = 1 - blendRatio;
            const newBlend = lightLevel * blendRatio * w_;
            const newRed = newBlend * r + blendRatio_ * bufferRed;
            const newGreen = newBlend * g + blendRatio_ * bufferGreen;
            const newBlue = newBlend * b + blendRatio_ * bufferBlue;
            frameBuffer.data[paintIndex] = newRed;
            frameBuffer.data[paintIndex + 1] = newGreen;
            frameBuffer.data[paintIndex + 2] = newBlue;
            frameBuffer.data[paintIndex + 3] = 255;
            w += gradW;
            r += gradR; g += gradG; b += gradB;
        }
    }

    //
    // R_FillTriangle_Flat
    // Draw flat-shaded triangle
    //
    function
    R_FillTriangle_Flat
    ({ ax, ay, aw,
       bx, by, bw,
       cx, cy, cw,
       ar, ag, ab,
       br, bg, bb,
       cr, cg, cb }: vso_t,
     pso: pso_t ): void
    {
        /* coordinates of the triangle in screen space */
        let topX = ax, midX = bx, bottomX = cx;
        let topY = ay, midY = by, bottomY = cy;
        // z-coordinates in the perspective-correct space
        let topW = aw, midW = bw, bottomW = cw;
        /* the color coordinates at each triangle vertex in the
         * perspective-corrected RGB space to interpolate across the triangle
         */
        let topR = ar * topW, midR = br * midW, bottomR = cr * bottomW;
        let topG = ag * topW, midG = bg * midW, bottomG = cg * bottomW;
        let topB = ab * topW, midB = bb * midW, bottomB = cb * bottomW;
        /* sort vertices of the triangle so that their y-coordinates are in
         * ascending order
         */
        if (topY > midY)
        {
            /* swap in screen space */
            const auxX = topX; topX = midX; midX = auxX;
            const auxY = topY; topY = midY; midY = auxY;
            // swap in perspective-correct (1/z) space
            const auxW = topW; topW = midW; midW = auxW;
            /* swap in perspective-correct (1/z) RGB space */
            const auxR = topR; topR = midR; midR = auxR;
            const auxG = topG; topG = midG; midG = auxG;
            const auxB = topB; topB = midB; midB = auxB;
        }
        if (midY > bottomY)
        {
            /* swap in screen space */
            const auxX = midX; midX = bottomX; bottomX = auxX;
            const auxY = midY; midY = bottomY; bottomY = auxY;
            // swap in perspective-correct (1/z) space
            const auxW = midW; midW = bottomW; bottomW = auxW;
            /* swap in perspective-correct (1/z) RGB space */
            const auxR = midR; midR = bottomR; bottomR = auxR;
            const auxG = midG; midG = bottomG; bottomG = auxG;
            const auxB = midB; midB = bottomB; bottomB = auxB;
        }
        if (topY > midY)
        {
            /* swap in screen space */
            const auxX = topX; topX = midX; midX = auxX;
            const auxY = topY; topY = midY; midY = auxY;
            // swap in perspective-correct (1/z) space
            const auxW = topW; topW = midW; midW = auxW;
            /* swap in perspective-correct (1/z) RGB space */
            const auxR = topR; topR = midR; midR = auxR;
            const auxG = topG; topG = midG; midG = auxG;
            const auxB = topB; topB = midB; midB = auxB;
        }
        const deltaUpper = midY - topY, deltaUpper_ = 1 / deltaUpper;
        const deltaLower = bottomY - midY, deltaLower_ = 1 / deltaLower;
        const deltaMajor = bottomY - topY, deltaMajor_ = 1 / deltaMajor;
        /* 1 step in `+y` equals how many steps in `x` */
        const stepXAlongUpper = (midX - topX) * deltaUpper_;
        const stepXAlongLower = (bottomX - midX) * deltaLower_;
        const stepXAlongMajor = (bottomX - topX) * deltaMajor_;
        /* 1 step in `+y` equals how many steps in `w` */
        const stepWAlongUpper = (midW - topW) * deltaUpper_;
        const stepWAlongLower = (bottomW - midW) * deltaLower_;
        const stepWAlongMajor = (bottomW - topW) * deltaMajor_;
        /* 1 step in `+y` equals how many steps in `r` */
        const stepRAlongUpper = (midR - topR) * deltaUpper_;
        const stepRAlongLower = (bottomR - midR) * deltaLower_;
        const stepRAlongMajor = (bottomR - topR) * deltaMajor_;
        /* 1 step in `+y` equals how many steps in `g` */
        const stepGAlongUpper = (midG - topG) * deltaUpper_;
        const stepGAlongLower = (bottomG - midG) * deltaLower_;
        const stepGAlongMajor = (bottomG - topG) * deltaMajor_;
        /* 1 step in `+y` equals how many steps in `b` */
        const stepBAlongUpper = (midB - topB) * deltaUpper_;
        const stepBAlongLower = (bottomB - midB) * deltaLower_;
        const stepBAlongMajor = (bottomB - topB) * deltaMajor_;
        // raster clipping: clip the triangle if it goes out-of-bounds of screen
        // coordinates
        const clipTop = Math.max(-topY, 0), clipMid = Math.max(-midY, 0);
        /* vertical endpoints of the rasterization in screen space, biased by
         * -0.5 as per the top-left pixel coverage rules
         */
        const startY = Math.ceil(topY + clipTop - 0.5);
        const midStopY = Math.ceil(midY + clipMid - 0.5);
        const endY = Math.ceil(bottomY - 0.5);
        /* pre-step from top and mid endpoints bu 0.5 as pixel centers are the
         * actual sampling points
         */
        const preStepFromTop = startY + 0.5 - topY;
        const preStepFromMid = midStopY + 0.5 - midY;
        /* current `x` coordinates in screen space */
        let xUpper = preStepFromTop * stepXAlongUpper + topX;
        let xLower = preStepFromMid * stepXAlongLower + midX;
        let xMajor = preStepFromTop * stepXAlongMajor + topX;
        /* current `w` coordinates in perspective-correct (1/z) space */
        let wUpper = preStepFromTop * stepWAlongUpper + topW;
        let wLower = preStepFromMid * stepWAlongLower + midW;
        let wMajor = preStepFromTop * stepWAlongMajor + topW;
        /* current `r` channels of the color in perspective-correct (1/z) space
         */
        let rUpper = preStepFromTop * stepRAlongUpper + topR;
        let rLower = preStepFromMid * stepRAlongLower + midR;
        let rMajor = preStepFromTop * stepRAlongMajor + topR;
        /* current `g` channels of the color in perspective-correct (1/z) space
         */
        let gUpper = preStepFromTop * stepGAlongUpper + topG;
        let gLower = preStepFromMid * stepGAlongLower + midG;
        let gMajor = preStepFromTop * stepGAlongMajor + topG;
        /* current `b` channels of the color in perspective-correct (1/z) space
         */
        let bUpper = preStepFromTop * stepBAlongUpper + topB;
        let bLower = preStepFromMid * stepBAlongLower + midB;
        let bMajor = preStepFromTop * stepBAlongMajor + topB;
        // whether the lefmost edge of the triangle is the longest
        const isLeftMajor = stepXAlongMajor < stepXAlongUpper;
        if (isLeftMajor)
        {
            /* lerp based on `y` in screen space for the upper half of the
             * triangle
             */
            for (let y = startY; y < midStopY && y < SCREEN_H; ++y)
            {
                /* configure the pixel shader object for the draw call */
                pso.dy = y;
                pso.dx0 = xMajor; pso.dx1 = xUpper;
                pso.w0 = wMajor; pso.w1 = wUpper;
                pso.r0 = rMajor; pso.r1 = rUpper;
                pso.g0 = gMajor; pso.g1 = gUpper;
                pso.b0 = bMajor; pso.b1 = bUpper;
                R_LerpScanline_Flat(pso);
                /* step forward along all vectors */
                xUpper += stepXAlongUpper; xMajor += stepXAlongMajor;
                wUpper += stepWAlongUpper; wMajor += stepWAlongMajor;
                rUpper += stepRAlongUpper; rMajor += stepRAlongMajor;
                gUpper += stepGAlongUpper; gMajor += stepGAlongMajor;
                bUpper += stepBAlongUpper; bMajor += stepBAlongMajor;
            }
            /* lerp based on `y` in screen space for the lower half of the
             * triangle
             */
            for (let y = midStopY; y < endY && y < SCREEN_H; ++y)
            {
                /* configure the pixel shader object for the draw call */
                pso.dy = y;
                pso.dx0 = xMajor; pso.dx1 = xLower;
                pso.w0 = wMajor; pso.w1 = wLower;
                pso.r0 = rMajor; pso.r1 = rLower;
                pso.g0 = gMajor; pso.g1 = gLower;
                pso.b0 = bMajor; pso.b1 = bLower;
                R_LerpScanline_Flat(pso);
                /* step forward along all vectors */
                xLower += stepXAlongLower; xMajor += stepXAlongMajor;
                wLower += stepWAlongLower; wMajor += stepWAlongMajor;
                rLower += stepRAlongLower; rMajor += stepRAlongMajor;
                gLower += stepGAlongLower; gMajor += stepGAlongMajor;
                bLower += stepBAlongLower; bMajor += stepBAlongMajor;
            }
        }
        else
        {
            /* lerp based on `y` in screen space for the upper half of the
             * triangle
             */
            for (let y = startY; y < midStopY && y < SCREEN_H; ++y)
            {
                /* configure the pixel shader object for the draw call */
                pso.dy = y;
                pso.dx0 = xUpper; pso.dx1 = xMajor;
                pso.w0 = wUpper; pso.w1 = wMajor;
                pso.r0 = rUpper; pso.r1 = rMajor;
                pso.g0 = gUpper; pso.g1 = gMajor;
                pso.b0 = bUpper; pso.b1 = bMajor;
                R_LerpScanline_Flat(pso);
                /* step forward along all vectors */
                xUpper += stepXAlongUpper; xMajor += stepXAlongMajor;
                wUpper += stepWAlongUpper; wMajor += stepWAlongMajor;
                rUpper += stepRAlongUpper; rMajor += stepRAlongMajor;
                gUpper += stepGAlongUpper; gMajor += stepGAlongMajor;
                bUpper += stepBAlongUpper; bMajor += stepBAlongMajor;
            }
            /* lerp based on `y` in screen space for the lower half of the
             * triangle
             */
            for (let y = midStopY; y < endY && y < SCREEN_H; ++y)
            {
                /* configure the pixel shader object for the draw call */
                pso.dy = y;
                pso.dx0 = xLower; pso.dx1 = xMajor;
                pso.w0 = wLower; pso.w1 = wMajor;
                pso.r0 = rLower; pso.r1 = rMajor;
                pso.g0 = gLower; pso.g1 = gMajor;
                pso.b0 = bLower; pso.b1 = bMajor;
                R_LerpScanline_Flat(pso);
                /* step forward along all vectors */
                xLower += stepXAlongLower; xMajor += stepXAlongMajor;
                wLower += stepWAlongLower; wMajor += stepWAlongMajor;
                rLower += stepRAlongLower; rMajor += stepRAlongMajor;
                gLower += stepGAlongLower; gMajor += stepGAlongMajor;
                bLower += stepBAlongLower; bMajor += stepBAlongMajor;
            }
        }
    }

    /*
    function
    R_FillTriangle_Flat_Bresenham
    ( ax: number, ay: number,
      bx: number, by: number,
      cx: number, cy: number,
      r: number, g: number, b: number, a: number ): void
    {
        // TODO: implement, inspired by:
        // https://mcejp.github.io/2020/11/06/bresenham.html
    }

    function
    R_LerpTexturedScanline_Affine
    ( tex: texture_t,
      dx0: number, dx1: number, dy: number,
      u0: number, v0: number,
      u1: number, v1: number,
      alpha: number,
      lightLevel: number ): void
    {
        // TODO: implement affine texture-mapping
    }

    function
    R_FillTriangle_Textured_Affine
    ( tex: texture_t,
      ax: number, ay: number,
      bx: number, by: number,
      cx: number, cy: number,
      au: number, av: number,
      bu: number, bv: number,
      cu: number, cv: number,
      alpha: number,
      lightLevel: number ): void
    {
        // TODO: implement affine texture-mapping
    }
    */

    //
    // R_LerpTexturedScanline_Perspective
    // Lerp a single texture-mapped scanline with smooth shading
    //
    /* FIXME: remove redundant lighting associated branches in this function */
    function
    R_LerpTexturedScanline_Perspective
    ({ tex,
       dy,
       dx0, dx1,
       w0, w1,
       u0, v0, u1, v1,
       nx0, ny0, nz0, nx1, ny1, nz1,
       wx0, wy0, wz0, wx1, wy1, wz1,
       normalX, normalY, normalZ,
       lightX, lightY, lightZ,
       isPointLight,
       alpha }: pso_t): void
    {
        const shouldShade = lightX !== undefined &&
                            lightY !== undefined &&
                            lightZ !== undefined;
        tex = tex!;
        const texWidth = tex.width, texHeight = tex.height, bitmap = tex.bitmap;
        // raster clipping: clip the scanline if it goes out-of-bounds of screen
        // coordinates
        const clipLeft = Math.max(-dx0, 0);
        // bias the start and end endpoints in screen space by -0.5 horizontally
        // as per the top-left pixel coverage rules
        const dX0 = Math.ceil(dx0 + clipLeft - 0.5), dX1 = Math.ceil(dx1 - 0.5);
        const deltaX = dx1 - dx0, deltaX_ = 1 / deltaX;
        // pre-step from start by 0.5 as pixel centers are the actual sampling
        // points
        const preStepX = dX0 + 0.5 - dx0;
        // 1 step in `+x` equals how many steps in `w`
        const gradW = (w1 - w0) * deltaX_;
        /* 1 step in `+x` equals how many steps in `u` and `v` */
        const gradU = (u1 - u0) * deltaX_;
        const gradV = (v1 - v0) * deltaX_;
        /* 1 step in `+x` equals how many steps along the vertex normal */
        const gradNX = (nx1 - nx0) * deltaX_;
        const gradNY = (ny1 - ny0) * deltaX_;
        const gradNZ = (nz1 - nz0) * deltaX_;
        /* 1 step in `+x` equals how many in the world space coordinates */
        const gradWX = (wx1 - wx0) * deltaX_;
        const gradWY = (wy1 - wy0) * deltaX_;
        const gradWZ = (wz1 - wz0) * deltaX_;
        // current z-coordinate in the perspective-correct space
        let w = preStepX * gradW + w0;
        /* current uv coordinates in the perspective-correct space */
        let u = preStepX * gradU + u0;
        let v = preStepX * gradV + v0;
        /* current vertex normal in the perspective-correct space */
        let nx = preStepX * gradNX + nx0;
        let ny = preStepX * gradNY + ny0;
        let nz = preStepX * gradNZ + nz0;
        /* current world space coordinates in the perspective-correct space */
        let wx = preStepX * gradWX + wx0;
        let wy = preStepX * gradWY + wy0;
        let wz = preStepX * gradWZ + wz0;
        /* rasterize current scanline */
        for (let x = dX0; x < dX1 && x < SCREEN_W; ++x)
        {
            const bufferIndex = dy * SCREEN_W + x;
            /* skip drawing the pixel unless the current pixel in the raster
             * triangle is closer (1 / zRaster > 1 / zBuffer) than what's
             * already in the z-buffer at the position we want to draw
             */
            if (w <= zBuffer[bufferIndex])
            {
                w += gradW;
                u += gradU; v += gradV;
                nx += gradNX; ny += gradNY; nz += gradNZ;
                wx += gradWX; wy += gradWY; wz += gradWZ;

                continue;
            }
            zBuffer[bufferIndex] = w; // update the z-buffer
            /* get the original coordinates back from the perspective-corrected
             * space by dehomogenizing
             */
            const w_ = 1 / w;
            let sX = u * w_, sY = v * w_;
            /* wrap-around the texture if the sampling point is out-of-bounds */
            sX = Math.floor((((sX % 1) + 1) % 1) * texWidth);
            sY = Math.floor((((sY % 1) + 1) % 1) * texHeight);
            /* calculate light intensity on the current pixel */
            let lightLevel = 1;
            if (shouldShade)
            {
                // start with the assumption that the given light is a
                // directional light...
                let lX = lightX, lY = lightY, lZ = lightZ;
                /* ...and adjust accordingly if it turns out to be a point light
                 * instead
                 */
                if (isPointLight)
                {
                    const WX = wx * w_, WY = wy * w_, WZ = wz * w_;
                    lX = lightX - WX; lY = lightY - WY; lZ = lightZ - WZ;
                }
                /* TODO: maybe use `Q_rsqrt` here??? */
                const magL_ = 1 / Math.sqrt(lX * lX + lY * lY + lZ * lZ);
                const lXUnit = lX * magL_;
                const lYUnit = lY * magL_;
                const lZUnit = lZ * magL_;
                /* flat shading */
                if (normalX !== undefined &&
                    normalY !== undefined &&
                    normalZ !== undefined)
                {
                    lightLevel =
                        lXUnit * normalX + lYUnit * normalY + lZUnit * normalZ;
                }
                /* diffuse shading */
                else
                {
                    const NX = nx * w_, NY = ny * w_, NZ = nz * w_;
                    /* TODO: maybe use `Q_rsqrt` here??? */
                    const magN_ = 1 / Math.sqrt(NX * NX + NY * NY + NZ * NZ);
                    const nXUnit = NX * magN_;
                    const nYUnit = NY * magN_;
                    const nZUnit = NZ * magN_;
                    lightLevel =
                        lXUnit * nXUnit + lYUnit * nYUnit + lZUnit * nZUnit;
                }
            }
            /* draw a single pixel in screen space sampled from the
             * perspective-corrected texture space
             */
            const sampleIndex = (sY * texWidth + sX) << 2;
            const sampleRed = bitmap[sampleIndex];
            const sampleGreen = bitmap[sampleIndex + 1];
            const sampleBlue = bitmap[sampleIndex + 2];
            const sampleAlpha = bitmap[sampleIndex + 3] * alpha;
            const paintIndex = bufferIndex << 2;
            const bufferRed = frameBuffer.data[paintIndex];
            const bufferGreen = frameBuffer.data[paintIndex + 1];
            const bufferBlue = frameBuffer.data[paintIndex + 2];
            const bufferAlpha = frameBuffer.data[paintIndex + 3] || 255;
            const blendRatio = sampleAlpha / bufferAlpha;
            const blendRatio_ = 1 - blendRatio;
            const newBlend = lightLevel * blendRatio;
            const newRed = newBlend * sampleRed + blendRatio_ * bufferRed;
            const newGreen = newBlend * sampleGreen + blendRatio_ * bufferGreen;
            const newBlue = newBlend * sampleBlue + blendRatio_ * bufferBlue;
            frameBuffer.data[paintIndex] = newRed;
            frameBuffer.data[paintIndex + 1] = newGreen;
            frameBuffer.data[paintIndex + 2] = newBlue;
            frameBuffer.data[paintIndex + 3] = 255;
            w += gradW;
            u += gradU; v += gradV;
            nx += gradNX; ny += gradNY; nz += gradNZ;
            wx += gradWX; wy += gradWY; wz += gradWZ;
        }
    }

    //
    // R_DrawTriangle_Textured_Perspective
    // Draw texture-mapped triangle with smooth shading
    //
    function
    R_DrawTriangle_Textured_Perspective
    ({ ax, ay, aw,
       bx, by, bw,
       cx, cy, cw,
       au, av,
       bu, bv,
       cu, cv,
       nax, nay, naz,
       nbx, nby, nbz,
       ncx, ncy, ncz,
       wax, way, waz,
       wbx, wby, wbz,
       wcx, wcy, wcz }: vso_t,
     pso: pso_t): void
    {
        /* coordinates of the triangle in screen space */
        let topX = ax, midX = bx, bottomX = cx;
        let topY = ay, midY = by, bottomY = cy;
        // z-coordinates in the perspective-correct space
        let topW = aw, midW = bw, bottomW = cw;
        /* UV coordinates in perspective-corrected (1/z) texture space */
        let topU = au * topW, midU = bu * midW, bottomU = cu * bottomW;
        let topV = av * topW, midV = bv * midW, bottomV = cv * bottomW;
        /* vertex normals in perspective-corrected (1/z) world space */
        let topNX = nax * topW, midNX = nbx * midW, bottomNX = ncx * bottomW;
        let topNY = nay * topW, midNY = nby * midW, bottomNY = ncy * bottomW;
        let topNZ = naz * topW, midNZ = nbz * midW, bottomNZ = ncz * bottomW;
        /* world space coordinates of the triangle vertices in
         * perspective-corrected (1/z) space
         */
        let topWX = wax * topW, midWX = wbx * midW, bottomWX = wcx * bottomW;
        let topWY = way * topW, midWY = wby * midW, bottomWY = wcy * bottomW;
        let topWZ = waz * topW, midWZ = wbz * midW, bottomWZ = wcz * bottomW;
        /* sort vertices of the triangle so that their y-coordinates are in
         * ascending order
         */
        if (topY > midY)
        {
            /* swap vertices in screen space */
            const auxX = topX; topX = midX; midX = auxX;
            const auxY = topY; topY = midY; midY = auxY;
            // swap in perspective-correct (1/z) space
            const auxW = topW; topW = midW; midW = auxW;
            /* swap uv coordinates */
            const auxU = topU; topU = midU; midU = auxU;
            const auxV = topV; topV = midV; midV = auxV;
            /* swap vertex normals */
            const auxNX = topNX; topNX = midNX; midNX = auxNX;
            const auxNY = topNY; topNY = midNY; midNY = auxNY;
            const auxNZ = topNZ; topNZ = midNZ; midNZ = auxNZ;
            /* swap world space coordinates */
            const auxWX = topWX; topWX = midWX; midWX = auxWX;
            const auxWY = topWY; topWY = midWY; midWY = auxWY;
            const auxWZ = topWZ; topWZ = midWZ; midWZ = auxWZ;
        }
        if (midY > bottomY)
        {
            /* swap vertices in screen space */
            const auxX = midX; midX = bottomX; bottomX = auxX;
            const auxY = midY; midY = bottomY; bottomY = auxY;
            // swap in perspective-correct (1/z) space
            const auxW = midW; midW = bottomW; bottomW = auxW;
            /* swap uv coordinates */
            const auxU = midU; midU = bottomU; bottomU = auxU;
            const auxV = midV; midV = bottomV; bottomV = auxV;
            /* swap vertex normals */
            const auxNX = midNX; midNX = bottomNX; bottomNX = auxNX;
            const auxNY = midNY; midNY = bottomNY; bottomNY = auxNY;
            const auxNZ = midNZ; midNZ = bottomNZ; bottomNZ = auxNZ;
            /* swap world space coordinates */
            const auxWX = midWX; midWX = bottomWX; bottomWX = auxWX;
            const auxWY = midWY; midWY = bottomWY; bottomWY = auxWY;
            const auxWZ = midWZ; midWZ = bottomWZ; bottomWZ = auxWZ;
        }
        if (topY > midY)
        {
            /* swap vertices in screen space */
            const auxX = topX; topX = midX; midX = auxX;
            const auxY = topY; topY = midY; midY = auxY;
            // swap in perspective-correct (1/z) space
            const auxW = topW; topW = midW; midW = auxW;
            /* swap uv coordinates */
            const auxU = topU; topU = midU; midU = auxU;
            const auxV = topV; topV = midV; midV = auxV;
            /* swap vertex normals */
            const auxNX = topNX; topNX = midNX; midNX = auxNX;
            const auxNY = topNY; topNY = midNY; midNY = auxNY;
            const auxNZ = topNZ; topNZ = midNZ; midNZ = auxNZ;
            /* swap world space coordinates */
            const auxWX = topWX; topWX = midWX; midWX = auxWX;
            const auxWY = topWY; topWY = midWY; midWY = auxWY;
            const auxWZ = topWZ; topWZ = midWZ; midWZ = auxWZ;
        }
        const deltaUpper = midY - topY, deltaUpper_ = 1 / deltaUpper;
        const deltaLower = bottomY - midY, deltaLower_ = 1 / deltaLower;
        const deltaMajor = bottomY - topY, deltaMajor_ = 1 / deltaMajor;
        /* 1 step in `+y` equals how many steps in `x` */
        const stepXAlongUpper = (midX - topX) * deltaUpper_;
        const stepXAlongLower = (bottomX - midX) * deltaLower_;
        const stepXAlongMajor = (bottomX - topX) * deltaMajor_;
        /* 1 step in `+y` equals how many steps in `w` */
        const stepWAlongUpper = (midW - topW) * deltaUpper_;
        const stepWAlongLower = (bottomW - midW) * deltaLower_;
        const stepWAlongMajor = (bottomW - topW) * deltaMajor_;
        /* 1 step in `+y` equals how many steps in `u` */
        const stepUAlongUpper = (midU - topU) * deltaUpper_;
        const stepUAlongLower = (bottomU - midU) * deltaLower_;
        const stepUAlongMajor = (bottomU - topU) * deltaMajor_;
        /* 1 step in `+y` equals how many steps in `v` */
        const stepVAlongUpper = (midV - topV) * deltaUpper_;
        const stepVAlongLower = (bottomV - midV) * deltaLower_;
        const stepVAlongMajor = (bottomV - topV) * deltaMajor_;
        /* 1 step in `+y` equals how many steps in `nx` */
        const stepNXAlongUpper = (midNX - topNX) * deltaUpper_;
        const stepNXAlongLower = (bottomNX - midNX) * deltaLower_;
        const stepNXAlongMajor = (bottomNX - topNX) * deltaMajor_;
        /* 1 step in `+y` equals how many steps in `ny` */
        const stepNYAlongUpper = (midNY - topNY) * deltaUpper_;
        const stepNYAlongLower = (bottomNY - midNY) * deltaLower_;
        const stepNYAlongMajor = (bottomNY - topNY) * deltaMajor_;
        /* 1 step in `+y` equals how many steps in `nz` */
        const stepNZAlongUpper = (midNZ - topNZ) * deltaUpper_;
        const stepNZAlongLower = (bottomNZ - midNZ) * deltaLower_;
        const stepNZAlongMajor = (bottomNZ - topNZ) * deltaMajor_;
        /* 1 step in `+y` equals how many steps in `wx` */
        const stepWXAlongUpper = (midWX - topWX) * deltaUpper_;
        const stepWXAlongLower = (bottomWX - midWX) * deltaLower_;
        const stepWXAlongMajor = (bottomWX - topWX) * deltaMajor_;
        /* 1 step in `+y` equals how many steps in `wy` */
        const stepWYAlongUpper = (midWY - topWY) * deltaUpper_;
        const stepWYAlongLower = (bottomWY - midWY) * deltaLower_;
        const stepWYAlongMajor = (bottomWY - topWY) * deltaMajor_;
        /* 1 step in `+y` equals how many steps in `wz` */
        const stepWZAlongUpper = (midWZ - topWZ) * deltaUpper_;
        const stepWZAlongLower = (bottomWZ - midWZ) * deltaLower_;
        const stepWZAlongMajor = (bottomWZ - topWZ) * deltaMajor_;
        // raster clipping: clip the triangle if it goes out-of-bounds of screen
        // coordinates
        const clipTop = Math.max(-topY, 0), clipMid = Math.max(-midY, 0);
        /* vertical endpoints of the rasterization in screen space, biased by
         * -0.5 as per the top-left pixel coverage rules
         */
        const startY = Math.ceil(topY + clipTop - 0.5);
        const midStopY = Math.ceil(midY + clipMid - 0.5);
        const endY = Math.ceil(bottomY - 0.5);
        /* pre-step from top and mid endpoints by 0.5 as pixel centers are the
         * actual sampling points
         */
        const preStepFromTop = startY + 0.5 - topY;
        const preStepFromMid = midStopY + 0.5 - midY;
        /* current `x` coordinates in screen space */
        let xUpper = preStepFromTop * stepXAlongUpper + topX;
        let xLower = preStepFromMid * stepXAlongLower + midX;
        let xMajor = preStepFromTop * stepXAlongMajor + topX;
        /* current `w` coordinates in perspective-correct (1/z) space */
        let wUpper = preStepFromTop * stepWAlongUpper + topW;
        let wLower = preStepFromMid * stepWAlongLower + midW;
        let wMajor = preStepFromTop * stepWAlongMajor + topW;
        /* current `u` coordinates in perspective-correct (1/z) texture space */
        let uUpper = preStepFromTop * stepUAlongUpper + topU;
        let uLower = preStepFromMid * stepUAlongLower + midU;
        let uMajor = preStepFromTop * stepUAlongMajor + topU;
        /* current `v` coordinates in perspective-correct (1/z) texture space */
        let vUpper = preStepFromTop * stepVAlongUpper + topV;
        let vLower = preStepFromMid * stepVAlongLower + midV;
        let vMajor = preStepFromTop * stepVAlongMajor + topV;
        /* current `nx` coordinates in perspective-correct (1/z) world space */
        let nXUpper = preStepFromTop * stepNXAlongUpper + topNX;
        let nXLower = preStepFromMid * stepNXAlongLower + midNX;
        let nXMajor = preStepFromTop * stepNXAlongMajor + topNX;
        /* current `ny` coordinates in perspective-correct (1/z) world space */
        let nYUpper = preStepFromTop * stepNYAlongUpper + topNY;
        let nYLower = preStepFromMid * stepNYAlongLower + midNY;
        let nYMajor = preStepFromTop * stepNYAlongMajor + topNY;
        /* current `nz` coordinates in perspective-correct (1/z) world space */
        let nZUpper = preStepFromTop * stepNZAlongUpper + topNZ;
        let nZLower = preStepFromMid * stepNZAlongLower + midNZ;
        let nZMajor = preStepFromTop * stepNZAlongMajor + topNZ;
        /* current `wx` coordinates in perspective-correct (1/z) world space */
        let wXUpper = preStepFromTop * stepWXAlongUpper + topWX;
        let wXLower = preStepFromMid * stepWXAlongLower + midWX;
        let wXMajor = preStepFromTop * stepWXAlongMajor + topWX;
        /* current `wy` coordinates in perspective-correct (1/z) world space */
        let wYUpper = preStepFromTop * stepWYAlongUpper + topWY;
        let wYLower = preStepFromMid * stepWYAlongLower + midWY;
        let wYMajor = preStepFromTop * stepWYAlongMajor + topWY;
        /* current `wz` coordinates in perspective-correct (1/z) world space */
        let wZUpper = preStepFromTop * stepWZAlongUpper + topWZ;
        let wZLower = preStepFromMid * stepWZAlongLower + midWZ;
        let wZMajor = preStepFromTop * stepWZAlongMajor + topWZ;
        // whether the lefmost edge of the raster triangle is the longest
        const isLeftMajor = stepXAlongMajor < stepXAlongUpper;
        if (isLeftMajor)
        {
            /* lerp based on `y` in screen space for the upper half of the
             * triangle
             */
            for (let y = startY; y < midStopY && y < SCREEN_H; ++y)
            {
                /* configure the pixel shader object for the draw call */
                pso.dy = y;
                pso.dx0 = xMajor; pso.dx1 = xUpper;
                pso.w0 = wMajor; pso.w1 = wUpper;
                pso.u0 = uMajor; pso.u1 = uUpper;
                pso.v0 = vMajor; pso.v1 = vUpper;
                pso.nx0 = nXMajor; pso.nx1 = nXUpper;
                pso.ny0 = nYMajor; pso.ny1 = nYUpper;
                pso.nz0 = nZMajor; pso.nz1 = nZUpper;
                pso.wx0 = wXMajor; pso.wx1 = wXUpper;
                pso.wy0 = wYMajor; pso.wy1 = wYUpper;
                pso.wz0 = wZMajor; pso.wz1 = wZUpper;
                R_LerpTexturedScanline_Perspective(pso);
                /* step forward along all vectors */
                xUpper += stepXAlongUpper; xMajor += stepXAlongMajor;
                wUpper += stepWAlongUpper; wMajor += stepWAlongMajor;
                uUpper += stepUAlongUpper; uMajor += stepUAlongMajor;
                vUpper += stepVAlongUpper; vMajor += stepVAlongMajor;
                nXUpper += stepNXAlongUpper; nXMajor += stepNXAlongMajor;
                nYUpper += stepNYAlongUpper; nYMajor += stepNYAlongMajor;
                nZUpper += stepNZAlongUpper; nZMajor += stepNZAlongMajor;
                wXUpper += stepWXAlongUpper; wXMajor += stepWXAlongMajor;
                wYUpper += stepWYAlongUpper; wYMajor += stepWYAlongMajor;
                wZUpper += stepWZAlongUpper; wZMajor += stepWZAlongMajor;
            }
            /* lerp based on `y` in screen space for the lower half of the
             * triangle
             */
            for (let y = midStopY; y < endY && y < SCREEN_H; ++y)
            {
                /* configure the pixel shader object for the draw call */
                pso.dy = y;
                pso.dx0 = xMajor; pso.dx1 = xLower;
                pso.w0 = wMajor; pso.w1 = wLower;
                pso.u0 = uMajor; pso.u1 = uLower;
                pso.v0 = vMajor; pso.v1 = vLower;
                pso.nx0 = nXMajor; pso.nx1 = nXLower;
                pso.ny0 = nYMajor; pso.ny1 = nYLower;
                pso.nz0 = nZMajor; pso.nz1 = nZLower;
                pso.wx0 = wXMajor; pso.wx1 = wXLower;
                pso.wy0 = wYMajor; pso.wy1 = wYLower;
                pso.wz0 = wZMajor; pso.wz1 = wZLower;
                R_LerpTexturedScanline_Perspective(pso);
                /* step forward along all vectors */
                xLower += stepXAlongLower; xMajor += stepXAlongMajor;
                wLower += stepWAlongLower; wMajor += stepWAlongMajor;
                uLower += stepUAlongLower; uMajor += stepUAlongMajor;
                vLower += stepVAlongLower; vMajor += stepVAlongMajor;
                nXLower += stepNXAlongLower; nXMajor += stepNXAlongMajor;
                nYLower += stepNYAlongLower; nYMajor += stepNYAlongMajor;
                nZLower += stepNZAlongLower; nZMajor += stepNZAlongMajor;
                wXLower += stepWXAlongLower; wXMajor += stepWXAlongMajor;
                wYLower += stepWYAlongLower; wYMajor += stepWYAlongMajor;
                wZLower += stepWZAlongLower; wZMajor += stepWZAlongMajor;
            }
        }
        else
        {
            /* lerp based on `y` in screen space for the upper half of the
             * triangle
             */
            for (let y = startY; y < midStopY && y < SCREEN_H; ++y)
            {
                /* configure the pixel shader object for the draw call */
                pso.dy = y;
                pso.dx0 = xUpper; pso.dx1 = xMajor;
                pso.w0 = wUpper; pso.w1 = wMajor;
                pso.u0 = uUpper; pso.u1 = uMajor;
                pso.v0 = vUpper; pso.v1 = vMajor;
                pso.nx0 = nXUpper; pso.nx1 = nXMajor;
                pso.ny0 = nYUpper; pso.ny1 = nYMajor;
                pso.nz0 = nZUpper; pso.nz1 = nZMajor;
                pso.wx0 = wXUpper; pso.wx1 = wXMajor;
                pso.wy0 = wYUpper; pso.wy1 = wYMajor;
                pso.wz0 = wZUpper; pso.wz1 = wZMajor;
                R_LerpTexturedScanline_Perspective(pso);
                /* step forward along all vectors */
                xUpper += stepXAlongUpper; xMajor += stepXAlongMajor;
                wUpper += stepWAlongUpper; wMajor += stepWAlongMajor;
                uUpper += stepUAlongUpper; uMajor += stepUAlongMajor;
                vUpper += stepVAlongUpper; vMajor += stepVAlongMajor;
                nXUpper += stepNXAlongUpper; nXMajor += stepNXAlongMajor;
                nYUpper += stepNYAlongUpper; nYMajor += stepNYAlongMajor;
                nZUpper += stepNZAlongUpper; nZMajor += stepNZAlongMajor;
                wXUpper += stepWXAlongUpper; wXMajor += stepWXAlongMajor;
                wYUpper += stepWYAlongUpper; wYMajor += stepWYAlongMajor;
                wZUpper += stepWZAlongUpper; wZMajor += stepWZAlongMajor;
            }
            /* lerp based on `y` in screen space for the lower half of the
             * triangle
             */
            for (let y = midStopY; y < endY && y < SCREEN_H; ++y)
            {
                /* configure the pixel shader object for the draw call */
                pso.dy = y;
                pso.dx0 = xLower; pso.dx1 = xMajor;
                pso.w0 = wLower; pso.w1 = wMajor;
                pso.u0 = uLower; pso.u1 = uMajor;
                pso.v0 = vLower; pso.v1 = vMajor;
                pso.nx0 = nXLower; pso.nx1 = nXMajor;
                pso.ny0 = nYLower; pso.ny1 = nYMajor;
                pso.nz0 = nZLower; pso.nz1 = nZMajor;
                pso.wx0 = wXLower; pso.wx1 = wXMajor;
                pso.wy0 = wYLower; pso.wy1 = wYMajor;
                pso.wz0 = wZLower; pso.wz1 = wZMajor;
                R_LerpTexturedScanline_Perspective(pso);
                /* step forward along all vectors */
                xLower += stepXAlongLower; xMajor += stepXAlongMajor;
                wLower += stepWAlongLower; wMajor += stepWAlongMajor;
                uLower += stepUAlongLower; uMajor += stepUAlongMajor;
                vLower += stepVAlongLower; vMajor += stepVAlongMajor;
                nXLower += stepNXAlongLower; nXMajor += stepNXAlongMajor;
                nYLower += stepNYAlongLower; nYMajor += stepNYAlongMajor;
                nZLower += stepNZAlongLower; nZMajor += stepNZAlongMajor;
                wXLower += stepWXAlongLower; wXMajor += stepWXAlongMajor;
                wYLower += stepWYAlongLower; wYMajor += stepWYAlongMajor;
                wZLower += stepWZAlongLower; wZMajor += stepWZAlongMajor;
            }
        }
    }

    function
    R_DrawImage
    ( img: texture_t,
      sx: number, sy: number,
      sw: number, sh: number,
      dx: number, dy: number,
      dw: number, dh: number,
      alpha?: number,
      lightLevel?: number ): void
    {
        const imgWidth = img.width, imgHeight = img.height, bitmap = img.bitmap;
        /* early return if either the source or the destination is out-of-bounds
         */
        if (sx + sw <= 0 || sy + sh <= 0 || sx >= imgWidth || sy >= imgHeight ||
            dx + dw <= 0 || dy + dh <= 0 || dx >= SCREEN_W || dy >= SCREEN_H)
            return;
        /* determine how bright & translucent the image is going to be drawn */
        const ALPHA = alpha !== undefined ? alpha : 1;
        const LIGHT_LEVEL = lightLevel !== undefined ? lightLevel : 1;
        // 1 step in screen space equals how many steps in texture space
        const scaleX = sw / dw, scaleY = sh / dh;
        // raster clipping: clip the screen coordinates against the bounds of
        // the buffer
        const clipLeft = Math.max(-dx, 0), clipTop = Math.max(-dy, 0);
        /* draw endpoints in screen space, biased by -0.5 as per the top-left
         * pixel coverage rules
         */
        const dStartX = Math.ceil(dx + clipLeft - 0.5);
        const dStartY = Math.ceil(dy + clipTop - 0.5);
        const dEndX = Math.ceil(dx + dw - 0.5);
        const dEndY = Math.ceil(dy + dh - 0.5);
        /* pre-step from left and top endpoints by 0.5 as pixel centers are the
         * actual sampling points
         */
        const preStepFromLeft = dStartX + 0.5 - dx;
        const preStepFromTop = dStartY + 0.5 - dy;
        /* where to start sampling in the texture space */
        const sampleStartX = preStepFromLeft * scaleX + sx;
        const sampleStartY = preStepFromTop * scaleY + sy;
        let sampleY = sampleStartY; // current `y` coordinate in texture space
        for (let y = dStartY; y < dEndY && y < SCREEN_H; ++y)
        {
            const imgY = Math.floor(sampleY);
            // skip drawing this scanline if we're not yet within the bounds of
            // the texture space along the y-axis
            if (imgY < 0) { sampleY += scaleY; continue; }
            // stop drawing any further scanlines if we've gone out-of-bounds in
            // the texture space along the y-axis
            else if (imgY >= imgHeight) break;
            // current `x` coordinate in texture space
            let sampleX = sampleStartX;
            for (let x = dStartX; x < dEndX && x < SCREEN_W; ++x)
            {
                const imgX = Math.floor(sampleX);
                // skip drawing this pixel if we're not yet within the bounds of
                // the texture space along the x-axis
                if (imgX < 0) { sampleX += scaleX; continue; }
                // stop drawing any further pixels if we've gone out-of-bounds
                // in the texture space along the x-axis
                else if (imgX >= imgWidth) break;
                const sampleIndex = (imgY * imgWidth + imgX) << 2;
                const sampleRed = bitmap[sampleIndex];
                const sampleGreen = bitmap[sampleIndex + 1];
                const sampleBlue = bitmap[sampleIndex + 2];
                const sampleAlpha = bitmap[sampleIndex + 3] * ALPHA;
                const paintIndex = (y * SCREEN_W + x) << 2;
                const bufferRed = frameBuffer.data[paintIndex];
                const bufferGreen = frameBuffer.data[paintIndex + 1];
                const bufferBlue = frameBuffer.data[paintIndex + 2];
                const bufferAlpha = frameBuffer.data[paintIndex + 3] || 255;
                const blendRatio = sampleAlpha / bufferAlpha;
                const blendRatio_ = 1 - blendRatio;
                const blendWithLightLevel = LIGHT_LEVEL * blendRatio;
                const newRed = blendWithLightLevel * sampleRed +
                               blendRatio_ * bufferRed;
                const newGreen = blendWithLightLevel * sampleGreen +
                                 blendRatio_ * bufferGreen;
                const newBlue = blendWithLightLevel * sampleBlue +
                                blendRatio_ * bufferBlue;
                frameBuffer.data[paintIndex] = newRed;
                frameBuffer.data[paintIndex + 1] = newGreen;
                frameBuffer.data[paintIndex + 2] = newBlue;
                frameBuffer.data[paintIndex + 3] = 255;
                sampleX += scaleX;
            }
            sampleY += scaleY;
        }
    }

    function
    R_Print
    ( chars: string,
      x: number, y: number,
      color?: string,
      size?: number,
      fontFamily?: string,
      style?: string ): void
    {
        R_Ctx.font = (style ? style + " " : "") +
                     (size ? size : 10).toString() + "px " +
                     (fontFamily ? fontFamily : "Courier, monospace");
        R_Ctx.fillStyle = color || "#000000";
        R_Ctx.fillText(chars, x, y);
    }

    window.__import__R_Draw = function ()
    {
        return {
            R_InitFrameBuffer,
            R_InitZBuffer,
            R_FlushFrame,
            R_FillRect,
            R_DrawLine,
            R_DrawLine_DDA,
            R_DrawLine_RayCast,
            R_DrawCircle,
            R_DrawTriangle_Wireframe,
            R_FillTriangle_Flat,
            /* TODO: uncomment these once implemented */
            // R_FillTriangle_Flat_Bresenham,
            // R_FillTriangle_Textured_Affine,
            R_DrawTriangle_Textured_Perspective,
            R_DrawImage,
            R_Print,
        };
    };
})();
