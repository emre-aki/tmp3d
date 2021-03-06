/*
 *  r_camera.js
 *  tmp3d
 *
 *  Created by Emre Akı on 2022-02-13.
 *
 *  SYNOPSIS:
 *      The 3-D camera, having 2-degrees-of-freedom: pitch and yaw.
 *
 *      The module that helps carry out world-space-to-view-space
 *      transformations with respect to the camera, as well as perform
 *      perspective projection into 2-D screen-space.
 *
 *      Also provides functionality for updating the orientation of the camera
 *      in 3-D with user input.
 */

(function ()
{
    const I_Input = __import__I_Input();
    const I_GetKeyState = I_Input.I_GetKeyState;
    const I_GetMouseState = I_Input.I_GetMouseState;
    const I_Keys = I_Input.I_Keys;
    const I_Mouse = I_Input.I_Mouse;

    const G_Const = __import__G_Const();
    const FOV_X = G_Const.FOV_X, FOV_Y = G_Const.FOV_Y;
    const SCREEN_W = G_Const.SCREEN_W, SCREEN_H = G_Const.SCREEN_H;
    const SCREEN_W_2 = SCREEN_W * 0.5, SCREEN_H_2 = SCREEN_H * 0.5;

    const M_Mat4 = __import__M_Mat4();
    const M_QuickInv4 = M_Mat4.M_QuickInv4;
    const M_Vec4FromVec3 = M_Mat4.M_Vec4FromVec3;
    const M_Transform4 = M_Mat4.M_Transform4;
    const Mat4 = M_Mat4.M_Mat4;

    const M_Math = __import__M_Math();
    const M_RadToDeg = M_Math.M_RadToDeg;
    const M_Clamp = M_Math.M_Clamp;
    const M_ToFixedDigits = M_Math.M_ToFixedDigits;
    const M_PI_2 = M_Math.M_PI_2;

    const M_Tri3 = __import__M_Tri3();
    const M_TransformTri3 = M_Tri3.M_TransformTri3;
    const Tri3 = M_Tri3.M_Tri3;

    const M_Vec3 = __import__M_Vec3();
    const M_Add3 = M_Vec3.M_Add3;
    const M_Sub3 = M_Vec3.M_Sub3;
    const M_Scale3 = M_Vec3.M_Scale3;
    const M_Cross3 = M_Vec3.M_Cross3;
    const M_Norm3 = M_Vec3.M_Norm3;
    const M_Base3 = M_Vec3.M_Base3;
    const M_RotateAroundAxis3 = M_Vec3.M_RotateAroundAxis3;
    const M_Vec3FromVec4 = M_Vec3.M_Vec3FromVec4;
    const Vec3 = M_Vec3.M_Vec3;

    const R_Draw = __import__R_Draw();
    const R_DrawLine_Bresenham = R_Draw.R_DrawLine_Bresenham;
    const R_Print = R_Draw.R_Print;

    const ORIGIN = Vec3(0, 0, 0);
    // the axes
    const RIGHT = Vec3(1, 0 ,0), UP = Vec3(0, 1, 0), FWD = Vec3(0, 0, 1);
    const BWD = Vec3(0, 0, -1);

    let veloc; // camera velocity
    let camPitch, camYaw; // the elementary rotations for the camera
    let camPos; // the position of the camera, i.e., the eye
    // the orthonormal basis vectors defining the camera
    let camRight, camUp, camFwd;
    let matPerspective; // the viewing frustum used for perspective projection
    let matLookAt; // the look-at matrix used for view transformation

    // TODO: instead of having `eye`, `center`, and `up` as arguments to the
    // function, directly read the camera basis vectors off of the global scope
    function R_PointAt (eye, center, up)
    {
        // calculate the `z` axis for the camera, normalized
        const vecCamZ3 = M_Norm3(M_Sub3(center, eye));
        // calculate the `y` axis for the camera, normalized:
        // because the `up` vector in the arguments does not necessarily have to
        // be perpendicular to the `z` axis, we have to adjust it to make sure
        // the orthonormality is preserved
        const vecCamY3 = M_Norm3(M_Base3(up, vecCamZ3));
        // calculate the `x` axis for the camera:
        // a simple cross product of `y` & `z` axes (mind the order) will give
        // us the `x` axis for the camera
        const vecCamX3 = M_Cross3(vecCamY3, vecCamZ3);
        /* construct the camera matrix, i.e., the "point-at" matrix */
        const vecCamX4 = M_Vec4FromVec3(vecCamX3, 0);
        const vecCamY4 = M_Vec4FromVec3(vecCamY3, 0);
        const vecCamZ4 = M_Vec4FromVec3(vecCamZ3, 0);
        const vecTranslateCam4 = M_Vec4FromVec3(eye, 1);
        return Mat4(vecCamX4, vecCamY4, vecCamZ4, vecTranslateCam4);
    }

    function R_LookAt (eye, center, up)
    {
        return M_QuickInv4(R_PointAt(eye, center, up));
    }

    function R_Perspective (fovy, aspect, zNear, zFar)
    {
        const tanFovy_ = 1 / Math.tan(fovy * 0.5);
        const A = (zFar + zNear) / (zFar - zNear);
        const B = 2 * zFar * zNear / (zNear - zFar);
        /* FIXME: dirty `M_Vec4FromVec3` shortcut with array literals */
        const vecPersX4 = M_Vec4FromVec3([tanFovy_ / aspect, 0, 0], 0);
        const vecPersY4 = M_Vec4FromVec3([0, tanFovy_, 0], 0);
        const vecPersZ4 = M_Vec4FromVec3([0, 0, A], 1);
        const vecPersW4 = M_Vec4FromVec3([0, 0, B], 0);
        return Mat4(vecPersX4, vecPersY4, vecPersZ4, vecPersW4);
    }

    function R_OrientCamera (yaw, pitch)
    {
        camFwd = M_RotateAroundAxis3(FWD, UP, yaw);
        camRight = M_RotateAroundAxis3(RIGHT, UP, yaw);
        camFwd = M_RotateAroundAxis3(camFwd, camRight, pitch);
        camUp = M_RotateAroundAxis3(UP, camRight, pitch);
    }

    function R_UpdateCamera (mult)
    {
        /* update the orientation of the camera in world-space */
        const rotationVelocity = 0.075 * mult;
        /* listen for key strokes to update the orientation */
        if (I_GetKeyState(I_Keys.ARW_RIGHT)) camYaw += rotationVelocity;
        if (I_GetKeyState(I_Keys.ARW_LEFT)) camYaw -= rotationVelocity;
        if (I_GetKeyState(I_Keys.ARW_UP)) camPitch += rotationVelocity;
        if (I_GetKeyState(I_Keys.ARW_DOWN)) camPitch -= rotationVelocity;
        /* listen for mouse movements to update the orientation */
        if (I_GetMouseState(I_Mouse.MOVING))
        {
            const deltaX = I_GetMouseState(I_Mouse.MOVEMENT_X);
            const deltaY = I_GetMouseState(I_Mouse.MOVEMENT_Y);
            camYaw += deltaX * FOV_X / SCREEN_W;
            camPitch -= deltaY * FOV_Y / SCREEN_H;
        }
        // clamp camera's pitch to be a value in the range [-PI, +PI] to avoid
        // multiple headaches
        camPitch = M_Clamp(camPitch, -M_PI_2, M_PI_2);
        R_OrientCamera(camYaw, camPitch);
        /* update the position of the camera in world-space */
        /* listen for key strokes to calculate the displacement vector */
        let displacement = Vec3(0, 0, 0);
        if (I_GetKeyState(I_Keys.W))
            displacement = M_Add3(displacement,
                                  Vec3(Math.sin(camYaw), 0, Math.cos(camYaw)));
        if (I_GetKeyState(I_Keys.S))
            displacement = M_Sub3(displacement,
                                  Vec3(Math.sin(camYaw), 0, Math.cos(camYaw)));
        if (I_GetKeyState(I_Keys.A))
            displacement = M_Sub3(displacement, camRight);
        if (I_GetKeyState(I_Keys.D))
            displacement = M_Add3(displacement, camRight);
        /* listen for key strokes for the ad-hoc update of camera position along
         * the y-axis
         */
        if (I_GetKeyState(I_Keys.E))
            camPos = M_Sub3(camPos, Vec3(0, veloc, 0));
        if (I_GetKeyState(I_Keys.Q))
            camPos = M_Add3(camPos, Vec3(0, veloc, 0));
        /* listen for mouse scrolls for the ad-hoc update of camera position
         * along the y-axis
         */
        if (I_GetMouseState(I_Mouse.WHEELING))
        {
            const deltaY = I_GetMouseState(I_Mouse.DELTA_WHEEL);
            camPos = M_Add3(camPos, Vec3(0, deltaY / 5, 0));
        }
        /* scale the displacement vector (which is a unit vector) by the
         * velocity to get the movement vector
         */
        const step = M_Scale3(displacement, veloc * mult);
        // TODO: implement a collision routine
        // update the camera position by the movement vector
        camPos = M_Add3(camPos, step);
        // update the look-at matrix used for view transformation
        matLookAt = R_LookAt(camPos, M_Add3(camPos, camFwd), camUp);
    }

    function R_ToViewSpace (triangle)
    {
        return M_TransformTri3(matLookAt, triangle);
    }

    function R_ToClipSpace (triangle)
    {
        return M_TransformTri3(matPerspective, triangle);
    }

    function R_GetCameraState ()
    {
        return {
            x: camPos[0],
            y: camPos[1],
            z: camPos[2],
            fwdX: camFwd[0],
            fwdY: camFwd[1],
            fwdZ: camFwd[2],
        };
    }

    function R_InitCamera (fovy, aspect, zNear, zFar, eye, velocity)
    {
        veloc = velocity;
        camPitch = 0, camYaw = 0;
        camPos = Vec3(eye[0], eye[1], eye[2]);
        camRight = RIGHT; camUp = UP; camFwd = FWD;
        matLookAt = R_LookAt(camPos, M_Add3(camPos, camFwd), camUp);
        matPerspective = R_Perspective(fovy, aspect, zNear, zFar);
    }

    function R_DebugStats (deltaT, nTrisOnScreen)
    {
        /* print the position of the camera */
        R_Print("pos: <" + M_ToFixedDigits(camPos[0], 2) + ", " +
                           M_ToFixedDigits(camPos[1], 2) + ", " +
                           M_ToFixedDigits(camPos[2], 2) + ">",
                5, 15,
                "#FF0000",
                14);
        /* print the pitch and yaw for the camera */
        R_Print("yaw: " + M_ToFixedDigits(M_RadToDeg(camYaw), 2) + " deg",
                5, 30,
                "#FF0000",
                14);
        R_Print("pitch: " + M_ToFixedDigits(M_RadToDeg(camPitch), 2) + " deg",
                5, 45,
                "#FF0000",
                14);
        // FIXME: this really shouldn't be here
        R_Print("tris: " + nTrisOnScreen, 5, 60, "#FF0000", 14);
        // print the instantaneous framerate
        R_Print("fps: " + Math.round(1000 / deltaT), 5, 75, "#FF0000", 14);
    }

    /* FIXME: move this function to a more sensible file/module */
    function R_DebugAxes ()
    {
        const originViewSpace4 = M_Transform4(matLookAt,
                                              M_Vec4FromVec3(ORIGIN, 1));
        const originClipSpace3 = M_Vec3FromVec4(M_Transform4(matPerspective,
                                                             originViewSpace4));
        const axesViewSpace3 = R_ToViewSpace(Tri3(RIGHT, UP, FWD));
        const axesClipSpace3 = R_ToClipSpace(axesViewSpace3);
        const rightClipSpace3 = axesClipSpace3[0];
        const upClipSpace3 = axesClipSpace3[1];
        const fwdClipSpace3 = axesClipSpace3[2];
        const originScreen2 = [originClipSpace3[0] * SCREEN_W_2 + SCREEN_W_2,
                               originClipSpace3[1] * SCREEN_H_2 + SCREEN_H_2];
        const rightScreen2 = [rightClipSpace3[0] * SCREEN_W_2 + SCREEN_W_2,
                              rightClipSpace3[1] * SCREEN_H_2 + SCREEN_H_2];
        const upScreen2 = [upClipSpace3[0] * SCREEN_W_2 + SCREEN_W_2,
                           upClipSpace3[1] * SCREEN_H_2 + SCREEN_H_2];
        const fwdScreen2 = [fwdClipSpace3[0] * SCREEN_W_2 + SCREEN_W_2,
                            fwdClipSpace3[1] * SCREEN_H_2 + SCREEN_H_2];
        if (originViewSpace4[2] > 0 || axesViewSpace3[0][0][2] > 0)
            R_DrawLine_Bresenham(originScreen2[0], originScreen2[1],
                                 rightScreen2[0], rightScreen2[1],
                                 255, 0, 0, 255, 2);
        if (originViewSpace4[2] > 0 || axesViewSpace3[0][1][2] > 0)
            R_DrawLine_Bresenham(originScreen2[0], originScreen2[1],
                                 upScreen2[0], upScreen2[1],
                                 0, 255, 0, 255, 2);
        if (originViewSpace4[2] > 0 || axesViewSpace3[0][2][2] > 0)
            R_DrawLine_Bresenham(originScreen2[0], originScreen2[1],
                                 fwdScreen2[0], fwdScreen2[1],
                                 0, 0, 255, 255, 2);
    }

    window.__import__R_Camera = function ()
    {
        return {
            R_ORIGIN: ORIGIN,
            R_BWD: BWD,
            R_InitCamera: R_InitCamera,
            R_UpdateCamera: R_UpdateCamera,
            R_GetCameraState: R_GetCameraState,
            R_ToViewSpace: R_ToViewSpace,
            R_ToClipSpace: R_ToClipSpace,
            R_DebugStats: R_DebugStats,
            R_DebugAxes: R_DebugAxes,
        };
    };
})();
