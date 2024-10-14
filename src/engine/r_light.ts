/*
 *  r_light.ts
 *  tmp3d
 *
 *  Created by Emre Akı on 2024-09-30.
 *
 *  SYNOPSIS:
 *      // TODO
 */

(function (): void
{
    const { R_GetCameraState } = __import__R_Camera();

    const { M_Vec3: Vec3 } = __import__M_Vec3();

    const {
        R_ShaderMode_Lights,
        R_ShaderMode_PointLight
    } = __import__R_Shader();

    const rLight = 1000;
    const light = Vec3(rLight, 0, 0);
    let lightRot = 0;
    let lightDirY = 1;

    function R_UpdateLight (pso: pso_t): void
    {
        if (pso.mode & R_ShaderMode_Lights)
        {
            pso.isPointLight = pso.mode & R_ShaderMode_PointLight;
            if (pso.isPointLight)
            {
                // update the spiral movement of the point light
                lightRot += 0.1;
                light[0] = rLight * Math.sin(lightRot);
                light[1] += lightDirY;
                light[2] = rLight * Math.cos(lightRot);
                if (light[1] >= 500) lightDirY = -1;
                else if (light[1] <= -500) lightDirY = 1;
                //
                pso.lightX = light[0];
                pso.lightY = light[1];
                pso.lightZ = light[2];
            }
            /* currently the camera also acts as a directional light */
            else
            {
                const { fwdX, fwdY, fwdZ } = R_GetCameraState();
                pso.lightX = -fwdX;
                pso.lightY = -fwdY;
                pso.lightZ = -fwdZ;
            }
        }
        else
        {
            pso.lightX = undefined;
            pso.lightY = undefined;
            pso.lightZ = undefined;
        }
    }

    window.__import__R_Light = function ()
    {
        return { R_UpdateLight };
    };
})();
