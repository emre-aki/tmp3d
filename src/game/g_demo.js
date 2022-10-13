/*
 *  g_demo.js
 *  tmp3d
 *
 *  Created by Emre Akı on 2022-10-13.
 *
 *  SYNOPSIS:
 *      The live demo that will accompany the 3-D Gfx talk for the DI crew
 *      chit-chat session
 */

(function ()
{
    const R_Draw = __import__R_Draw();
    const R_DrawLine_Bresenham = R_Draw.R_DrawLine_Bresenham;
    const R_Print = R_Draw.R_Print;
    const R_FlushFrame = R_Draw.R_FlushFrame;

    const M_Mat4 = __import__M_Mat4();
    const M_Transform4 = M_Mat4.M_Transform4;
    const M_Vec4FromVec3 = M_Mat4.M_Vec4FromVec3;

    const M_Vec3 = __import__M_Vec3();
    const M_Vec3FromVec4 = M_Vec3.M_Vec3FromVec4;
    const Vec3 = M_Vec3.M_Vec3;

    const R_Camera = __import__R_Camera();
    const R_GetPointAt = R_Camera.R_GetPointAt;
    const R_GetLookAt = R_Camera.R_GetLookAt;

    const R_Geometry = __import__R_Geometry();
    const R_LoadGeometry = R_Geometry.R_LoadGeometry;
    const R_RenderGeometries = R_Geometry.R_RenderGeometries;

    const FRAME_W = 200, FRAME_H = 200;
    const FRAME_W_2 = FRAME_W * 0.5;
    const FRAME_H_2 = FRAME_H * 0.5;
    const ABS_FRAME_X = 100, ABS_FRAME_Y = 30;
    const REL_FRAME_X = 320, REL_FRAME_Y = 30;
    const PERS_FRAME_X = 212, PERS_FRAME_Y = 250;

    const WALL_S = Vec3(-25, 5, 35), WALL_E = Vec3(25, 5, 35), WALL_H_2 = 5;

    const CAM_S = Vec3(0, 0, 0);
    const CAM_E_0 = Vec3(0, 0, 6);
    const CAM_E_1 = Vec3(0, 0, 10);

    function G_DemoVertices ()
    {
        return [
            WALL_S,
            Vec3(WALL_E[0], -WALL_H_2, WALL_S[2]),
            Vec3(WALL_S[0], -WALL_H_2, WALL_S[2]),
            WALL_E,
            Vec3(WALL_E[0], -WALL_H_2, WALL_E[2]),
            Vec3(WALL_S[0], WALL_E[1], WALL_E[2]),
        ];
    }

    function G_DemoTriangles ()
    {
        //  0   1
        //  2   4
        //  5   3
        return [[0, 1, 2], [3, 4, 5], [4, 3, 5], [1, 0, 2]];
    }

    function R_ToViewSpace (v)
    {
        return M_Vec3FromVec4(M_Transform4(R_GetLookAt(),
                                           M_Vec4FromVec3(v, 1)));
    }

    function G_RenderAbsoluteFrame ()
    {
        const pointAt = R_GetPointAt();
        const camSWorld = M_Vec3FromVec4(
            M_Transform4(pointAt, M_Vec4FromVec3(CAM_S, 1))
        );
        const camE0World = M_Vec3FromVec4(
            M_Transform4(pointAt, M_Vec4FromVec3(CAM_E_0, 1))
        );
        const camE1World = M_Vec3FromVec4(
            M_Transform4(pointAt, M_Vec4FromVec3(CAM_E_1, 1))
        );
        /* draw wall in world-space */
        R_DrawLine_Bresenham(ABS_FRAME_X + FRAME_W_2 + WALL_S[0],
                             ABS_FRAME_Y + FRAME_H_2 - WALL_S[2],
                             ABS_FRAME_X + FRAME_W_2 + WALL_E[0],
                             ABS_FRAME_Y + FRAME_H_2 - WALL_E[2],
                             255, 255, 0, 255, 2);
        /* draw camera in view-space */
        R_DrawLine_Bresenham(ABS_FRAME_X + FRAME_W_2 + camSWorld[0],
                             ABS_FRAME_Y + FRAME_H_2 - camSWorld[2],
                             ABS_FRAME_X + FRAME_W_2 + camE0World[0],
                             ABS_FRAME_Y + FRAME_H_2 - camE0World[2],
                             255, 255, 0, 255, 2);
        R_DrawLine_Bresenham(ABS_FRAME_X + FRAME_W_2 + camE0World[0],
                             ABS_FRAME_Y + FRAME_H_2 - camE0World[2],
                             ABS_FRAME_X + FRAME_W_2 + camE1World[0],
                             ABS_FRAME_Y + FRAME_H_2 - camE1World[2],
                             255, 0, 0, 255, 2);
        /* draw frame bounds */
        R_DrawLine_Bresenham(ABS_FRAME_X, ABS_FRAME_Y,
                             ABS_FRAME_X + FRAME_W, ABS_FRAME_Y,
                             255, 0, 0, 255, 2);
        R_DrawLine_Bresenham(ABS_FRAME_X + FRAME_W, ABS_FRAME_Y,
                             ABS_FRAME_X + FRAME_W, ABS_FRAME_Y + FRAME_H,
                             255, 0, 0, 255, 2);
        R_DrawLine_Bresenham(ABS_FRAME_X + FRAME_W, ABS_FRAME_Y + FRAME_H,
                             ABS_FRAME_X, ABS_FRAME_Y + FRAME_H,
                             255, 0, 0, 255, 2);
        R_DrawLine_Bresenham(ABS_FRAME_X, ABS_FRAME_Y + FRAME_H,
                             ABS_FRAME_X, ABS_FRAME_Y,
                             255, 0, 0, 255, 2);
    }

    function G_RenderRelativeFrame ()
    {
        const wallSView = R_ToViewSpace(WALL_S);
        const wallEView = R_ToViewSpace(WALL_E);
        /* draw wall in view-space */
        R_DrawLine_Bresenham(REL_FRAME_X + FRAME_W_2 + wallSView[0],
                             REL_FRAME_Y + FRAME_H_2 - wallSView[2],
                             REL_FRAME_X + FRAME_W_2 + wallEView[0],
                             REL_FRAME_Y + FRAME_H_2 - wallEView[2],
                             255, 255, 0, 255, 2);
        /* draw camera in view-space */
        R_DrawLine_Bresenham(REL_FRAME_X + FRAME_W_2,
                             REL_FRAME_Y + FRAME_H_2,
                             REL_FRAME_X + FRAME_W_2,
                             REL_FRAME_Y + FRAME_H_2 - 6,
                             255, 255, 0, 255, 2);
        R_DrawLine_Bresenham(REL_FRAME_X + FRAME_W_2,
                             REL_FRAME_Y + FRAME_H_2 - 6,
                             REL_FRAME_X + FRAME_W_2,
                             REL_FRAME_Y + FRAME_H_2 - 10,
                             255, 0, 0, 255, 2);
        /* draw frame bounds */
        R_DrawLine_Bresenham(REL_FRAME_X, REL_FRAME_Y,
                             REL_FRAME_X + FRAME_W, REL_FRAME_Y,
                             255, 0, 255, 255, 2);
        R_DrawLine_Bresenham(REL_FRAME_X + FRAME_W, REL_FRAME_Y,
                             REL_FRAME_X + FRAME_W, REL_FRAME_Y + FRAME_H,
                             255, 0, 255, 255, 2);
        R_DrawLine_Bresenham(REL_FRAME_X + FRAME_W, REL_FRAME_Y + FRAME_H,
                             REL_FRAME_X, REL_FRAME_Y + FRAME_H,
                             255, 0, 255, 255, 2);
        R_DrawLine_Bresenham(REL_FRAME_X, REL_FRAME_Y + FRAME_H,
                             REL_FRAME_X, REL_FRAME_Y,
                             255, 0, 255, 255, 2);
    }

    function G_RenderPerspectiveFrame (nTrisOnScreen)
    {
        /* draw wall in 3-D perspective */
        R_RenderGeometries(nTrisOnScreen,
                           PERS_FRAME_X, PERS_FRAME_Y,
                           FRAME_W, FRAME_H);
        /* draw frame bounds */
        R_DrawLine_Bresenham(PERS_FRAME_X, PERS_FRAME_Y,
                             PERS_FRAME_X + FRAME_W, PERS_FRAME_Y,
                             0, 0, 255, 255, 2);
        R_DrawLine_Bresenham(PERS_FRAME_X + FRAME_W, PERS_FRAME_Y,
                             PERS_FRAME_X + FRAME_W, PERS_FRAME_Y + FRAME_H,
                             0, 0, 255, 255, 2);
        R_DrawLine_Bresenham(PERS_FRAME_X + FRAME_W, PERS_FRAME_Y + FRAME_H,
                             PERS_FRAME_X, PERS_FRAME_Y + FRAME_H,
                             0, 0, 255, 255, 2);
        R_DrawLine_Bresenham(PERS_FRAME_X, PERS_FRAME_Y + FRAME_H,
                             PERS_FRAME_X, PERS_FRAME_Y,
                             0, 0, 255, 255, 2);
    }

    function G_RenderDemoFrame (nTrisOnScreen)
    {
        G_RenderAbsoluteFrame();
        G_RenderRelativeFrame();
        G_RenderPerspectiveFrame(nTrisOnScreen);
        R_FlushFrame();
        R_Print("World Space", ABS_FRAME_X + 10, ABS_FRAME_Y + 25, "#ff0000", 20);
        R_Print("View Space", REL_FRAME_X + 10, REL_FRAME_Y + 25, "#ff00ff", 20);
        R_Print("Perspective", PERS_FRAME_X + 10, PERS_FRAME_Y + 25, "#0000ff", 20);
    }

    window.__import__G_Demo = function ()
    {
        return {
            G_DemoVertices: G_DemoVertices,
            G_DemoTriangles: G_DemoTriangles,
            G_RenderDemoFrame: G_RenderDemoFrame,
        };
    };
})();
