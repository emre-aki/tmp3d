/*
 *  r_camera.ts
 *  tmp3d
 *
 *  Created by Emre Akı on 2022-02-13.
 *
 *  SYNOPSIS:
 *      The 3-D camera, having 6-degrees-of-freedom:
 *      tranlating along x, y and z, and pitch, yaw and roll.
 *
 *      The module that helps carry out world-space-to-view-space
 *      transformations with respect to the camera, as well as perform
 *      perspective projection into 2-D screen space.
 *
 *      Also provides functionality for updating the orientation of the camera
 *      in 3-D with user input.
 */

(function (): void
{
    const I_Input = __import__I_Input();
    const I_GetKeyState = I_Input.I_GetKeyState;
    const I_GetMouseState = I_Input.I_GetMouseState;
    const I_Keys = I_Input.I_Keys;
    const I_Mouse = I_Input.I_Mouse;

    const G_Const = __import__G_Const();
    const FOV_X = G_Const.FOV_X, FOV_Y = G_Const.FOV_Y;
    const MAX_MOV_TILT = G_Const.MAX_MOV_TILT;
    const SCREEN_W = G_Const.SCREEN_W, SCREEN_H = G_Const.SCREEN_H;

    const M_Mat4 = __import__M_Mat4();
    const M_QuickInv4 = M_Mat4.M_QuickInv4;
    const M_Vec4FromVec3 = M_Mat4.M_Vec4FromVec3;
    const M_Transform4 = M_Mat4.M_Transform4;
    const Mat4 = M_Mat4.M_Mat4;

    const M_Math = __import__M_Math();
    const M_RadToDeg = M_Math.M_RadToDeg;
    const M_Clamp = M_Math.M_Clamp;
    const M_ToFixedDigits = M_Math.M_ToFixedDigits;
    const PI_2 = M_Math.PI_2;

    const M_Tri3 = __import__M_Tri3();
    const M_TransformTri3 = M_Tri3.M_TransformTri3;

    const M_Vec3 = __import__M_Vec3();
    const M_Add3 = M_Vec3.M_Add3;
    const M_Sub3 = M_Vec3.M_Sub3;
    const M_Scale3 = M_Vec3.M_Scale3;
    const M_Cross3 = M_Vec3.M_Cross3;
    const M_Norm3 = M_Vec3.M_Norm3;
    const M_Perp3 = M_Vec3.M_Perp3;
    const M_RotateAroundAxis3 = M_Vec3.M_RotateAroundAxis3;
    const M_Vec3FromVec4 = M_Vec3.M_Vec3FromVec4;
    const Vec3 = M_Vec3.M_Vec3;

    const R_Draw = __import__R_Draw();
    const R_Print = R_Draw.R_Print;

    const ORIGIN = Vec3(0, 0, 0);
    // the axes
    const RIGHT = Vec3(1, 0 ,0), DOWN = Vec3(0, 1, 0), FWD = Vec3(0, 0, 1);

    let veloc: number; // camera velocity
    // the elementary rotations for the camera
    let camPitch: number, camYaw: number, camRoll: number;
    let camPos: vec3_t; // the position of the camera, i.e., the eye
    // the orthonormal basis vectors defining the camera
    let camRight: vec3_t, camDown: vec3_t, camFwd: vec3_t;
    // the viewing frustum used for perspective projection
    let matPerspective: mat4_t;
    let matLookAt: mat4_t; // the look-at matrix used for view transformation
    // the center of the projection (near-clipping) plane
    let projectionOrigin: vec3_t;

    // TODO: instead of having `eye`, `center`, and `up` as arguments to the
    // function, directly read the camera basis vectors off of the global scope
    function R_PointAt (eye: vec3_t, center: vec3_t, up: vec3_t): mat4_t
    {
        // calculate the `z` axis for the camera, normalized
        const vecCamZ3 = M_Norm3(M_Sub3(center, eye));
        // calculate the `y` axis for the camera, normalized:
        // because the `up` vector in the arguments does not necessarily have to
        // be perpendicular to the `z` axis, we have to adjust it to make sure
        // the orthonormality is preserved
        const vecCamY3 = M_Norm3(M_Perp3(up, vecCamZ3));
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

    function R_LookAt (eye: vec3_t, center: vec3_t, up: vec3_t): mat4_t
    {
        return M_QuickInv4(R_PointAt(eye, center, up));
    }

    function
    R_Perspective
    ( fovy: number,
      aspect: number,
      zNear: number,
      zFar: number ): mat4_t
    {
        const tanFovy_ = 1 / Math.tan(fovy * 0.5);
        const A = zFar / (zFar - zNear);
        const B = zFar * zNear / (zNear - zFar);
        /* FIXME: dirty `M_Vec4FromVec3` shortcut with array literals */
        const vecPersX4 = M_Vec4FromVec3([tanFovy_ / aspect, 0, 0], 0);
        const vecPersY4 = M_Vec4FromVec3([0, tanFovy_, 0], 0);
        const vecPersZ4 = M_Vec4FromVec3([0, 0, A], 1);
        const vecPersW4 = M_Vec4FromVec3([0, 0, B], 0);

        return Mat4(vecPersX4, vecPersY4, vecPersZ4, vecPersW4);
    }

    function R_OrientCamera (yaw: number, pitch: number, roll: number): void
    {
        // reset the camera orientation
        camFwd = FWD; camRight = RIGHT; camDown = DOWN;
        /* rotate about +y-axis */
        if (yaw)
        {
            camFwd = M_RotateAroundAxis3(camFwd, camDown, yaw);
            camRight = M_RotateAroundAxis3(camRight, camDown, yaw);
        }
        /* rotate about +x-axis */
        if (pitch)
        {
            camFwd = M_RotateAroundAxis3(camFwd, camRight, pitch);
            camDown = M_RotateAroundAxis3(camDown, camRight, pitch);
        }
        /* rotate about +z-axis */
        if (roll)
        {
            camRight = M_RotateAroundAxis3(camRight, camFwd, roll);
            camDown = M_RotateAroundAxis3(camDown, camFwd, roll);
        }
    }

    //
    // R_UpdateCamera
    // Update the orientation and the position of the camera in world space
    //
    function R_UpdateCamera (mult: number): void
    {
        const rotationVelocity = 0.075 * mult;
        const rollVelocity = 0.25 * rotationVelocity;
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
        camPitch = M_Clamp(camPitch, -PI_2, PI_2);
        R_OrientCamera(camYaw, camPitch, camRoll);
        /* listen for key strokes to calculate the displacement vector and the
         * camera's sideways tilt (roll)
         */
        const yawCos = Math.cos(camYaw), yawSin = Math.sin(camYaw);
        let displacement = Vec3(0, 0, 0);
        if (I_GetKeyState(I_Keys.W))
            displacement = M_Add3(displacement, Vec3(yawSin, 0, yawCos));
        if (I_GetKeyState(I_Keys.S))
            displacement = M_Sub3(displacement, Vec3(yawSin, 0, yawCos));
        if (I_GetKeyState(I_Keys.A))
        {
            displacement = M_Sub3(displacement, Vec3(yawCos, 0, -yawSin));
            camRoll -= rollVelocity;
        }
        if (I_GetKeyState(I_Keys.D))
        {
            displacement = M_Add3(displacement, Vec3(yawCos, 0, -yawSin));
            camRoll += rollVelocity;
        }
        // clamp camera's roll to refrain from turning the camera into a
        // washing machine :)
        camRoll = M_Clamp(camRoll, -MAX_MOV_TILT, MAX_MOV_TILT);
        // reset camera's roll if not moving sideways
        if (camRoll && !I_GetKeyState(I_Keys.A) && !I_GetKeyState(I_Keys.D))
        {
            const oldCamRollDir = Math.sign(camRoll);
            camRoll -= oldCamRollDir * rollVelocity;
            const newCamRollDir = Math.sign(camRoll);
            camRoll *= 0.5 * oldCamRollDir * (newCamRollDir + oldCamRollDir);
        }
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
        matLookAt = R_LookAt(camPos, M_Add3(camPos, camFwd), camDown);
    }

    function R_TriToWorldSpace (triangle: tri3_t): tri3_t
    {
        return M_TransformTri3(M_QuickInv4(matLookAt), triangle);
    }

    function R_TriToViewSpace (triangle: tri3_t): tri3_t
    {
        return M_TransformTri3(matLookAt, triangle);
    }

    function R_TriToClipSpace (triangle: tri3_t): tri3_t
    {
        return M_TransformTri3(matPerspective, triangle);
    }

    function R_VecToViewSpace (vec: vec3_t): vec3_t
    {
        return M_Vec3FromVec4(M_Transform4(matLookAt, M_Vec4FromVec3(vec, 1)));
    }

    function R_VecToClipSpace (vec: vec3_t): vec3_t
    {
        return M_Vec3FromVec4(M_Transform4(matPerspective,
                                           M_Vec4FromVec3(vec, 1)));
    }

    function R_GetCameraState (): cam3_t
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

    function R_GetProjectionOrigin (): vec3_t
    {
        return projectionOrigin;
    }

    function
    R_InitCamera
    ( fovy: number,
      aspect: number,
      zNear: number,
      zFar: number,
      eye: pvec3_t,
      velocity: number ): void
    {
        projectionOrigin = Vec3(0, 0, zNear);
        veloc = velocity;
        camPitch = 0; camYaw = 0; camRoll = 0;
        camPos = Vec3(eye[0], eye[1], eye[2]);
        camRight = RIGHT; camDown = DOWN; camFwd = FWD;
        matLookAt = R_LookAt(camPos, M_Add3(camPos, camFwd), camDown);
        matPerspective = R_Perspective(fovy, aspect, zNear, zFar);
    }

    function R_DebugStats (deltaT: number, nTrisOnScreen: Uint32Array): void
    {
        /* print the position of the camera */
        R_Print("pos: <" + M_ToFixedDigits(camPos[0], 2) + ", " +
                           M_ToFixedDigits(camPos[1], 2) + ", " +
                           M_ToFixedDigits(camPos[2], 2) + ">",
                5, 15, "#FF0000", 14);
        /* print the pitch and yaw for the camera */
        R_Print("yaw: " + M_ToFixedDigits(M_RadToDeg(camYaw), 2) + " deg",
                5, 30, "#FF0000", 14);
        R_Print("pitch: " + M_ToFixedDigits(M_RadToDeg(camPitch), 2) + " deg",
                5, 45, "#FF0000", 14);
        // FIXME: this really shouldn't be here
        R_Print("tris: " + nTrisOnScreen[0] + " (" + nTrisOnScreen[1] + ")",
                5, 60, "#FF0000", 14);
        // print the instantaneous framerate
        R_Print("fps: " + Math.round(1000 / deltaT), 5, 75, "#FF0000", 14);
        /* print in milliseconds how much time has passed since the last frame
         */
        R_Print("frametime: " + Math.round(deltaT) + " ms",
                5, 90, "#FF0000", 14);
    }

    window.__import__R_Camera = function ()
    {
        return {
            R_Origin: ORIGIN,
            R_Right: RIGHT,
            R_Down: DOWN,
            R_Fwd: FWD,
            R_InitCamera,
            R_UpdateCamera,
            R_GetCameraState,
            R_GetProjectionOrigin,
            R_TriToWorldSpace,
            R_TriToViewSpace,
            R_TriToClipSpace,
            R_VecToViewSpace,
            R_VecToClipSpace,
            R_DebugStats,
        };
    };
})();
