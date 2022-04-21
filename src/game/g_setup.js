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
    const D_Mesh = __import__D_Mesh();
    const D_Vertices = D_Mesh.D_Vertices()
    const D_Triangles = D_Mesh.D_Triangles();

    const D_Player = __import__D_Player();
    const D_Velocity = D_Player.D_Velocity;
    const D_Eye = D_Player.D_Eye();

    const G_Const = __import__G_Const();
    const SCREEN_W = G_Const.SCREEN_W, SCREEN_H = G_Const.SCREEN_H;
    const FOV_Y = G_Const.FOV_Y;

    const I_Input = __import__I_Input();
    const I_InitKeyboard = I_Input.I_InitKeyboard;
    const I_InitMouse = I_Input.I_InitMouse;

    const R_Camera = __import__R_Camera();
    const R_InitCamera = R_Camera.R_InitCamera;

    const R_Screen = __import__R_Screen();
    const R_InitBuffer = R_Screen.R_InitBuffer;
    const R_ScreenElement = R_Screen.R_ScreenElement;

    const R_Geometry = __import__R_Geometry();
    const R_LoadGeometry = R_Geometry.R_LoadGeometry;

    const Z_NEAR = SCREEN_H * 0.5 / Math.tan(FOV_Y * 0.5);
    const Z_FAR = 4 * Z_NEAR;
    const ASPECT = SCREEN_W / SCREEN_H;

    function G_Setup ()
    {
        I_InitKeyboard(document);
        I_InitMouse(R_ScreenElement);
        R_InitBuffer(SCREEN_W, SCREEN_H);
        R_InitCamera(FOV_Y, ASPECT, Z_NEAR, Z_FAR, D_Eye, D_Velocity);
        R_LoadGeometry(D_Vertices, D_Triangles, D_Triangles.length);
    }

    window.__import__G_Setup = function ()
    {
        return { G_Setup: G_Setup };
    };
})();
