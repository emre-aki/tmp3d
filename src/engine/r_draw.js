/*
 *  r_draw.js
 *  tmp3d
 *
 *  Created by Emre Akı on 2022-02-13.
 *
 *  SYNOPSIS:
 *      The rendering backend.
 *
 *      The module that helps draw some geometric primitives, as well as other
 *      more advanced visual effects, directly onto the frame buffer.
 */

(function ()
{
    const M_Math = __import__M_Math();
    const M_Clamp = M_Math.M_Clamp;

    const R_Screen = __import__R_Screen();
    const R_Ctx = R_Screen.R_Ctx;
    const R_SetBuffer = R_Screen.R_SetBuffer;

    let frameBuffer;
    let screenW, screenH;

    function R_ClearBuffer ()
    {
        /* initialize the frame buffer if it has not been already */
        if (screenW === undefined || screenH === undefined)
        {
            frameBuffer = R_SetBuffer();
            screenW = frameBuffer.width;
            screenH = frameBuffer.height;
        }
        R_Ctx.clearRect(0, 0, screenW, screenH);
        frameBuffer = R_SetBuffer();
    }

    function R_FillRect (x, y, w, h, r, g, b, a)
    {
        const sX = M_Clamp(Math.floor(x), 0, screenW);
        const sY = M_Clamp(Math.floor(y), 0, screenH);
        const dX = M_Clamp(Math.floor(x + w), 0, screenW);
        const dY = M_Clamp(Math.floor(y + h), 0, screenH);
        for (let brushY = sY; brushY < dY; ++brushY)
        {
            for (let brushX = sX; brushX < dX; ++brushX)
            {
                const pixIndex = 4 * (screenW * brushY + brushX);
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

    function R_DrawLine_DDA (sx, sy, dx, dy, r, g, b, a, stroke)
    {
        const stroke_ = stroke || 1;
        const sX = Math.floor(sx), sY = Math.floor(sy);
        const dX = Math.floor(dx), dY = Math.floor(dy);
        const deltaX = dX - sX, deltaY = dY - sY;
        const dirX = Math.sign(deltaX), dirY = Math.sign(deltaY);
        const slope = deltaY / deltaX, slopeInverse = deltaX / deltaY;
        const strokeInXHorizontal = stroke_ * dirX;
        const stepInYHorizontal = slope * dirX;
        const strokeInYVertical = stroke_ * dirY;
        const stepInXVertical = slopeInverse * dirY;
        if (strokeInXHorizontal)
        {
            for (let x = sX, y = sY;
                 (dX - x) * dirX > 0;
                 x += strokeInXHorizontal)
            {
                const Y = sY + Math.floor(y - sY) * stroke_;
                R_FillRect(x, Y, stroke_, stroke_, r, g, b, a);
                y += stepInYHorizontal;
            }
        }
        if (strokeInYVertical)
        {
            for (let x = sX, y = sY;
                 (dY - y) * dirY > 0;
                 y += strokeInYVertical)
            {
                const X = sX + Math.floor(x - sX) * stroke_;
                R_FillRect(X, y, stroke_, stroke_, r, g, b, a);
                x += stepInXVertical;
            }
        }
    }

    function R_Bresenham_HorizontalSweep (sx, sy, dx, dy, r, g, b, a, stroke)
    {
        const stroke_ = stroke || 1;
        const deltaX = dx - sx, deltaY = dy - sy;
        const dirX = Math.sign(deltaX), dirY = Math.sign(deltaY);
        const strokeX = dirX * stroke_, strokeY = dirY * stroke_;
        // need to fix the signs in the formulae
        const deltaYAbs = deltaY * dirY;
        // the increment for Pk+1, if Pk < 0
        const pIncrementForSameRow = deltaYAbs + deltaYAbs;
        // the increment for Pk+1, if Pk >= 0
        const pIncrementForNextRow = pIncrementForSameRow - deltaX - deltaX;
        // the initial value for the decision parameter, P0
        const p0 = pIncrementForNextRow + deltaX;
        for (let x = sx, y = sy, pK = p0; (dx - x) * dirX >= 0; x += strokeX)
        {
            R_FillRect(x, y, stroke_, stroke_, r, g, b, a);
            if (pK < 0) pK += pIncrementForSameRow;
            else
            {
                pK += pIncrementForNextRow;
                y += strokeY;
            }
        }
    }

    function R_Bresenham_VerticalSweep (sx, sy, dx, dy, r, g, b, a, stroke)
    {
        const stroke_ = stroke || 1;
        const deltaX = dx - sx, deltaY = dy - sy;
        const dirX = Math.sign(deltaX), dirY = Math.sign(deltaY);
        const strokeX = dirX * stroke_, strokeY = dirY * stroke_;
        // need to fix the signs in the formulae
        const deltaXAbs = deltaX * dirX;
        // the increment for Pk+1, if Pk < 0
        const pIncrementForSameCol = deltaXAbs + deltaXAbs;
        // the increment for Pk+1, if Pk >= 0
        const pIncrementForNextCol = pIncrementForSameCol - deltaY - deltaY;
        // the initial value for the decision parameter, P0
        const p0 = pIncrementForNextCol + deltaY;
        for (let x = sx, y = sy, pK = p0; (dy - y) * dirY >= 0; y += strokeY)
        {
            R_FillRect(x, y, stroke_, stroke_, r, g, b, a);
            if (pK < 0) pK += pIncrementForSameCol;
            else
            {
                pK += pIncrementForNextCol;
                x += strokeX;
            }
        }
    }

    function R_DrawLine_Bresenham (sx, sy, dx, dy, r, g, b, a, stroke)
    {
        const sX = Math.floor(sx), sY = Math.floor(sy);
        const dX = Math.floor(dx), dY = Math.floor(dy);
        if (sX === dX && sY === dY) return; // early return if nothing to draw
        const isVerticalSweep = Math.abs(dX - sX) < Math.abs(dY - sY);
        /* the x-direction of the line should always be >= 0 */
        if (isVerticalSweep && dY > sY)
            R_Bresenham_VerticalSweep(sX, sY, dX, dY, r, g, b, a, stroke);
        else if (isVerticalSweep)
            R_Bresenham_VerticalSweep(dX, dY, sX, sY, r, g, b, a, stroke);
        else if (dX > sX)
            R_Bresenham_HorizontalSweep(sX, sY, dX, dY, r, g, b, a, stroke);
        else
            R_Bresenham_HorizontalSweep(dX, dY, sX, sY, r, g, b, a, stroke);
    }

    function R_DrawLine_RayCast (sx, sy, dx, dy, r, g, b, a, stroke)
    {
        const stroke_ = stroke || 1;
        const sX = Math.floor(sx), sY = Math.floor(sy);
        const dX = Math.floor(dx), dY = Math.floor(dy);
        if (sX === dX && sY === dY) return; // early return if nothing to draw
        const deltaX = dX - sX, deltaY = dY - sY;
        const dirX = Math.sign(deltaX), dirY = Math.sign(deltaY);
        const slope = deltaY / deltaX, slopeInverse = deltaX / deltaY;
        const stepVerticalY = dirX * slope;
        const stepHorizontalX = dirY * slopeInverse;
        const strokeXVertical = dirX * stroke_;
        const strokeYVertical = stepVerticalY * stroke_;
        const strokeXHorizontal = stepHorizontalX * stroke_;
        const strokeYHorizontal = dirY * stroke_;
        const lineLength = (dx - sx) * (dx - sx) + (dy - sy) * (dy - sy);
        let currentLength = 0;
        let x = sX, y = sY;
        let traceVerticalX = dirX > 0 ? Math.floor(sx + 1) : sX;
        let traceVerticalY = sy + (traceVerticalX - sx) * slope;
        let traceHorizontalY = dirY > 0 ? Math.floor(sy + 1) : sY;
        let traceHorizontalX = sx + (traceHorizontalY - sy) * slopeInverse;
        let advanceVertically;
        while (currentLength < lineLength)
        {
            R_FillRect(x, y, stroke_, stroke_, r, g, b, a);
            const verticalDistInX = traceVerticalX - sx;
            const verticalDistInY = traceVerticalY - sy;
            const horizontalDistInX = traceHorizontalX - sx;
            const horizontalDistInY = traceHorizontalY - sy;
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

    function
    R_DrawTriangleWireframe
    ( ax, ay,
      bx, by,
      cx, cy,
      r, g, b, a,
      stroke )
    {
        R_DrawLine_Bresenham(ax, ay, bx, by, r, g, b, a, stroke);
        R_DrawLine_Bresenham(ax, ay, cx, cy, r, g, b, a, stroke);
        R_DrawLine_Bresenham(bx, by, cx, cy, r, g, b, a, stroke);
    }

    function R_FillTriangle_Flat (ax, ay, bx, by, cx, cy, r, g, b, a)
    {
        /* coordinates of the triangle in screen-space */
        let topX = ax, topY = ay;
        let midX = bx, midY = by;
        let bottomX = cx, bottomY = cy;
        /* sort vertices of the triangle so that their y-coordinates are in
         * ascending order
         */
        if (topY > midY)
        {
            const auxX = topX, auxY = topY;
            topX = midX, topY = midY;
            midX = auxX, midY = auxY;
        }
        if (midY > bottomY)
        {
            const auxX = midX, auxY = midY;
            midX = bottomX, midY = bottomY;
            bottomX = auxX, bottomY = auxY;
        }
        if (topY > midY)
        {
            const auxX = topX, auxY = topY;
            topX = midX, topY = midY;
            midX = auxX, midY = auxY;
        }
        const deltaUpper = midY - topY, _deltaUpper = 1 / deltaUpper;
        const deltaLower = bottomY - midY, _deltaLower = 1 / deltaLower;
        const deltaMajor = bottomY - topY, _deltaMajor = 1 / deltaMajor;
        /* 1 step in `+y` equals how many steps in `x` */
        const stepXAlongUpper = (midX - topX) * _deltaUpper;
        const stepXAlongLower = (bottomX - midX) * _deltaLower;
        const stepXAlongMajor = (bottomX - topX) * _deltaMajor;
        // raster clipping: clip the triangle if it goes out of bounds of screen
        // coordinates
        const clipTop = Math.max(-topY, 0), clipMid = Math.max(-midY, 0);
        /* vertical endpoints of the rasterization in screen-space, biased by
         * -0.5 as per the coverage rules
         */
        const startY = Math.ceil(topY + clipTop - 0.5);
        const midStopY = Math.ceil(midY + clipMid - 0.5);
        const endY = Math.ceil(bottomY - 0.5);
        // bias the top and mid endpoints in screen-space by -0.5 horizontally
        // as per the coverage rules
        const topXBiased = topX - 0.5, midXBiased = midX - 0.5;
        /* pre-step from top and mid endpoints bu 0.5 as pixel centers are the
         * actual sampling points
         */
        const preStepFromTop = startY + 0.5 - topY;
        const preStepFromMid = midStopY + 0.5 - midY;
        /* current `x` coordinates in screen-space */
        let xUpper = preStepFromTop * stepXAlongUpper + topXBiased;
        let xLower = preStepFromMid * stepXAlongLower + midXBiased;
        let xMajor = preStepFromTop * stepXAlongMajor + topXBiased;
        // whether the lefmost edge of the triangle is the longest
        const isLeftMajor = stepXAlongMajor < stepXAlongUpper;
        if (isLeftMajor)
        {
            /* lerp based on `y` in screen-space for the upper half of the
             * triangle
             */
            for (let y = startY; y < midStopY && y < screenH; ++y)
            {
                const startX = Math.ceil(xMajor), endX = Math.ceil(xUpper);
                R_FillRect(startX, y, endX - startX, 1, r, g, b, a);
                xUpper += stepXAlongUpper; xMajor += stepXAlongMajor;
            }
            /* lerp based on `y` in screen-space for the lower half of the
             * triangle
             */
            for (let y = midStopY; y < endY && y < screenH; ++y)
            {
                const startX = Math.ceil(xMajor), endX = Math.ceil(xLower);
                R_FillRect(startX, y, endX - startX, 1, r, g, b, a);
                xLower += stepXAlongLower; xMajor += stepXAlongMajor;
            }
        }
        else
        {
             /* lerp based on `y` in screen-space for the upper half of the
             * triangle
             */
             for (let y = startY; y < midStopY && y < screenH; ++y)
             {
                 const startX = Math.ceil(xUpper), endX = Math.ceil(xMajor);
                 R_FillRect(startX, y, endX - startX, 1, r, g, b, a);
                 xUpper += stepXAlongUpper; xMajor += stepXAlongMajor;
             }
             /* lerp based on `y` in screen-space for the lower half of the
              * triangle
              */
             for (let y = midStopY; y < endY && y < screenH; ++y)
             {
                 const startX = Math.ceil(xLower), endX = Math.ceil(xMajor);
                 R_FillRect(startX, y, endX - startX, 1, r, g, b, a);
                 xLower += stepXAlongLower; xMajor += stepXAlongMajor;
             }
        }
    }

    function R_FillTriangle_Flat_Bresenham (ax, ay, bx, by, cx, cy, r, g, b, a)
    {
        // TODO: implement, inspired by:
        // https://mcejp.github.io/2020/11/06/bresenham.html
    }

    function R_DrawImage (img, sx, sy, sw, sh, dx, dy, dw, dh, options)
    {
        const imgWidth = img.width, imgHeight = img.height, bitmap = img.bitmap;
        /* early return if either the source or the destination is out of bounds
         */
        if (sx + sw <= 0 || sy + sh <= 0 || sx >= imgWidth || sy >= imgHeight ||
            dx + dw <= 0 || dy + dh <= 0 || dx >= screenW || dy >= screenH)
            return;
        /* determine how bright & translucent the image is going to be drawn */
        const shadowLevel = options && options.shade ? options.shade : 0;
        const lightLevel = 1 - shadowLevel;
        const opacity = options && Number.isFinite(options.alpha)
            ? options.alpha : 1;
        /* calculate the screen coordinates and dimensions */
        const dX = Math.floor(dx), dW = Math.ceil(dw);
        const dY = Math.floor(dy), dH = Math.ceil(dh);
        const scaleX = sw / dw, scaleY = sh / dh;
        /* clip the screen coordinates against the bounds of the buffer */
        const clipLeft = Math.max(-dX, 0), clipTop = Math.max(-dY, 0);
        const clipRight = Math.max(dX + dW - screenW, 0);
        const clipBottom = Math.max(dY + dH - screenH, 0);
        const clippedW = dW - clipLeft - clipRight;
        const clippedH = dH - clipTop - clipBottom;
        /* calculate draw endpoints */
        const dStartX = dX + clipLeft, dEndX = dStartX + clippedW;
        const dStartY = dY + clipTop, dEndY = dStartY + clippedH;
        for (let y = dStartY; y < dEndY; ++y)
        {
            const sampleY = Math.round(sy + (y - dY) * scaleY);
            for (let x = dStartX; x < dEndX; ++x)
            {
                const sampleX = Math.round(sx + (x - dX) * scaleX);
                /* only draw the pixel if the sampling point is within the
                 * bounds of the source image
                 */
                if (sampleX >= 0 && sampleX < imgWidth &&
                    sampleY >= 0 && sampleY < imgHeight)
                {
                    const sampleIndex = 4 * (sampleY * imgWidth + sampleX);
                    const sampleRed = bitmap[sampleIndex];
                    const sampleGreen = bitmap[sampleIndex + 1];
                    const sampleBlue = bitmap[sampleIndex + 2];
                    const sampleAlpha = bitmap[sampleIndex + 3] * opacity;
                    const paintIndex = 4 * (y * screenW + x);
                    const bufferRed = frameBuffer.data[paintIndex];
                    const bufferGreen = frameBuffer.data[paintIndex + 1];
                    const bufferBlue = frameBuffer.data[paintIndex + 2];
                    const bufferAlpha = frameBuffer.data[paintIndex + 3] || 255;
                    const blendRatio = sampleAlpha / bufferAlpha;
                    const blendRatio_ = 1 - blendRatio;
                    const blendWithLightLevel = lightLevel * blendRatio;
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
                }
            }
        }
    }

    function R_Print (chars, x, y, color, size, fontFamily, style)
    {
        R_Ctx.font = (style ? style + " " : "") +
                     (Number.isFinite(size) ? size : 10).toString() + "px " +
                     (fontFamily ? fontFamily : "Courier, monospace");
        R_Ctx.fillStyle = color || "#000000";
        R_Ctx.fillText(chars, x, y);
    }

    window.__import__R_Draw = function ()
    {
        return {
            R_ClearBuffer: R_ClearBuffer,
            R_FillRect: R_FillRect,
            R_DrawLine_DDA: R_DrawLine_DDA,
            R_DrawLine_Bresenham: R_DrawLine_Bresenham,
            R_DrawLine_RayCast: R_DrawLine_RayCast,
            R_DrawTriangleWireframe: R_DrawTriangleWireframe,
            R_FillTriangle_Flat: R_FillTriangle_Flat,
            R_FillTriangle_Flat_Bresenham: R_FillTriangle_Flat_Bresenham,
            R_DrawImage: R_DrawImage,
            R_Print: R_Print,
        };
    };
})();
