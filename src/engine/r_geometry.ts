/*
 *  r_geometry.ts
 *  tmp3d
 *
 *  Created by Emre Akı on 2022-02-20.
 *
 *  SYNOPSIS:
 *      The module that helps load, update and render 3-D geometry data in
 *      memory.
 */

(function (): void
{
    const DEBUG_MODE = window.__DEBUG_MODE__;

    const A_Assets = __import__A_Assets();
    const A_Texture = A_Assets.A_Texture;

    const G_Const = __import__G_Const();
    const SCREEN_W_2 = G_Const.SCREEN_W_2, SCREEN_H_2 = G_Const.SCREEN_H_2;
    const Z_NEAR = G_Const.Z_NEAR;
    const FRUSTUM_AABB3 = G_Const.FRUSTUM_AABB3;

    const I_Input = __import__I_Input();
    const I_GetKeyState = I_Input.I_GetKeyState;
    const I_Keys = I_Input.I_Keys;

    const M_Collision = __import__M_Collision();
    const M_TimeBeforePlaneCollision3 = M_Collision.M_TimeBeforePlaneCollision3;
    const M_BoundingBoxVsBoundingBoxCollision3 =
        M_Collision.M_BoundingBoxVsBoundingBoxCollision3;

    const M_Tri3 = __import__M_Tri3();
    const M_TriNormal3 = M_Tri3.M_TriNormal3;
    const M_AABB3FromTri3 = M_Tri3.M_AABB3FromTri3;
    const M_RotateTriAroundAxis3 = M_Tri3.M_RotateTriAroundAxis3;
    const Tri3 = M_Tri3.M_Tri3;

    const M_Vec3 = __import__M_Vec3();
    const M_IsInFrontOfPlane3 = M_Vec3.M_IsInFrontOfPlane3;
    const M_Add3 = M_Vec3.M_Add3;
    const M_Sub3 = M_Vec3.M_Sub3;
    const M_Scale3 = M_Vec3.M_Scale3;
    const M_Dot3 = M_Vec3.M_Dot3;
    const Vec3 = M_Vec3.M_Vec3;

    const R_Camera = __import__R_Camera();
    const R_DebugAxes = R_Camera.R_DebugAxes;
    const R_ToViewSpace = R_Camera.R_ToViewSpace;
    const R_ToClipSpace = R_Camera.R_ToClipSpace;
    const R_GetProjectionOrigin = R_Camera.R_GetProjectionOrigin;

    const R_Draw = __import__R_Draw();
    const R_DrawTriangle_Wireframe = R_Draw.R_DrawTriangle_Wireframe;
    const R_FillTriangle_Flat = R_Draw.R_FillTriangle_Flat;
    const R_DrawTriangle_Textured_Perspective =
        R_Draw.R_DrawTriangle_Textured_Perspective;

    // the center of the projection (near-clipping) plane
    let projectionOrigin: vec3_t;
    const ORIGIN = R_Camera.R_Origin;
    const BWD = R_Camera.R_Bwd, FWD = M_Scale3(BWD, -1);

    // TODO: make a separate lighting controller module, maybe??
    const DIRECTIONAL_LIGHT = BWD;

    let nTris: number; // total number of triangles in the model
    let tris3: tri3_t[]; // a pool of raw triangle data
    let transformedTris3: tri3_t[]; // triangles after transformation
    // normal vectors associated with vertices of each triangle in the pool,
    // used in smooth/diffuse shading
    let triVertexNormals3: tri3_t[];
    // vertex normals after transformation
    let transformedTriVertexNormals3: tri3_t[];
    // respective uv-coordinates of each triangle in the pool
    let uvTable3: tri3_t[];
    // respective texture ids of each triangle in the pool
    let textureTable: string[];
    let culledBuffer: Uint32Array; // buffer of triangles who survived culling
    let nCulledBuffer: number; // number of triangles who survived culling

    /* TODO: find a more suitable spot for managing global transformations?
     * a separate tranform controller, maybe???
     */
    const globalRotationAxis = Vec3(0, -1, 0);
    const globalRotationSwitchDebounce = 250;
    let lastGlobalRotationSwitch = Date.now();
    let doGlobalRotation = false;
    let globalRotation = 0;

    const RENDER_MODE = {
        FLAT: "FLAT",
        TEXTURED: "TEXTURED",
        TEXTURED_SHADED: "TEXTURED_SHADED",
        WIREFRAME: "WIREFRAME",
    };

    const RENDER_MODES = [
        RENDER_MODE.WIREFRAME,
        RENDER_MODE.FLAT,
        RENDER_MODE.TEXTURED,
        RENDER_MODE.TEXTURED_SHADED,
    ];

    const renderModeChangeDebounce = 250;
    let renderMode = 3;
    let lastRenderModeChange = Date.now();

    function R_ToggleGlobalRotation (): void
    {
        const now = Date.now();
        if (I_GetKeyState(I_Keys.G) &&
            now - lastGlobalRotationSwitch > globalRotationSwitchDebounce)
        {
            doGlobalRotation = !doGlobalRotation;
            lastGlobalRotationSwitch = now;
        }
    }

    function R_ChangeRenderMode (): void
    {
        const now = Date.now();
        if (I_GetKeyState(I_Keys.R) &&
            now - lastRenderModeChange > renderModeChangeDebounce)
        {
            ++renderMode;
            if (renderMode === RENDER_MODES.length) renderMode = 0;
            lastRenderModeChange = now;
        }
    }

    function
    R_LoadGeometry
    ( vertices: pvec3_t[], nVertices: number,
      triangles: pvec3_t[], nTriangles: number ): void
    {
        projectionOrigin = R_GetProjectionOrigin();
        nTris = nTriangles;
        tris3 = Array(nTriangles);
        transformedTris3 = Array(nTriangles);
        triVertexNormals3 = Array(nTriangles);
        transformedTriVertexNormals3 = Array(nTriangles);
        culledBuffer = new Uint32Array(nTriangles); // TODO: maybe 16??
        // temporary buffer to compute vertex normals
        const vertexNormals3: vec3_t[] = Array(nVertices);
        /* go over each triangle to collect their vertices and vertex normals */
        for (let i = 0; i < nTriangles; ++i)
        {
            const tri3Data = triangles[i];
            const idxA = tri3Data[0], idxB = tri3Data[1], idxC = tri3Data[2];
            const triA3 = vertices[idxA];
            const triB3 = vertices[idxB];
            const triC3 = vertices[idxC];
            const tri = Tri3(Vec3(triA3[0], triA3[1], triA3[2]),
                             Vec3(triB3[0], triB3[1], triB3[2]),
                             Vec3(triC3[0], triC3[1], triC3[2]));
            tris3[i] = tri;
            // the surface normal of the triangle
            const triNormal3 = M_TriNormal3(tri);
            /* adding the surface normal to each respective vertex that makes up
             * the triangle
             */
            if (vertexNormals3[idxA])
                vertexNormals3[idxA] = M_Add3(vertexNormals3[idxA], triNormal3);
            else
                vertexNormals3[idxA] = triNormal3;
            if (vertexNormals3[idxB])
                vertexNormals3[idxB] = M_Add3(vertexNormals3[idxB], triNormal3);
            else
                vertexNormals3[idxB] = triNormal3;
            if (vertexNormals3[idxC])
                vertexNormals3[idxC] = M_Add3(vertexNormals3[idxC], triNormal3);
            else
                vertexNormals3[idxC] = triNormal3;
        }
        /* group individual vertex normals into triangles */
        for (let i = 0; i < nTriangles; ++i)
        {
            const tri3Data = triangles[i];
            triVertexNormals3[i] = Tri3(vertexNormals3[tri3Data[0]],
                                        vertexNormals3[tri3Data[1]],
                                        vertexNormals3[tri3Data[2]]);
        }
    }

    function
    R_InitUVTable
    ( vertices: pvec2_t[],
      triangles: uvface_t[],
      nTriangles: number ): void
    {
        uvTable3 = Array(nTriangles);
        textureTable = Array(nTriangles);
        for (let i = 0; i < nTriangles; ++i)
        {
            const uvFaceData = triangles[i];
            const texUVA2 = vertices[uvFaceData[0]];
            const texUVB2 = vertices[uvFaceData[1]];
            const texUVC2 = vertices[uvFaceData[2]];
            uvTable3[i] = Tri3(Vec3(texUVA2[0], texUVA2[1], 1),
                               Vec3(texUVB2[0], texUVB2[1], 1),
                               Vec3(texUVC2[0], texUVC2[1], 1));
            textureTable[i] = uvFaceData[3];
        }
    }

    /* TODO: add functionality here to allow updating parts of the geometry as
     * opposed to the entire model
     */
    function R_UpdateGeometry (): void
    {
        if (doGlobalRotation)
        {
            globalRotation += 0.1;
            for (let i = 0; i < nTris; ++i)
            {
                transformedTris3[i] = M_RotateTriAroundAxis3(tris3[i],
                                                             globalRotationAxis,
                                                             globalRotation);
                transformedTriVertexNormals3[i] = M_RotateTriAroundAxis3(
                    triVertexNormals3[i],
                    globalRotationAxis,
                    globalRotation
                );
            }
        }
        else
        {
            globalRotation = 0;
            for (let i = 0; i < nTris; ++i)
            {
                transformedTris3[i] = tris3[i];
                transformedTriVertexNormals3[i] = triVertexNormals3[i];
            }
        }
    }

    /* TODO: improve the crude frustum-culling technique used here */
    function R_FrustumCull (triView: tri3_t): boolean
    {
        const triAABB3 = M_AABB3FromTri3(triView);

        return M_BoundingBoxVsBoundingBoxCollision3(FRUSTUM_AABB3, triAABB3);
    }

    function R_CullGeometry (): void
    {
        let nTrianglesAfterCulling = 0;
        for (let i = 0; i < nTris; ++i)
        {
            const triView = R_ToViewSpace(transformedTris3[i]);
            const aView = triView[0];
            if (
                // frustum-culling: is the triangle at least partially within
                // the view frustum?
                R_FrustumCull(triView) &&
                // backface-culling: is the triangle facing the camera?
                M_IsInFrontOfPlane3(ORIGIN, aView, M_TriNormal3(triView))
                // TODO: implement occlusion-culling
            )
                culledBuffer[nTrianglesAfterCulling++] = i;
        }
        nCulledBuffer = nTrianglesAfterCulling;
    }

    /* TODO: make a generic function that takes in as arguments the `planeRef` &
     * `planeNormal` to clip the geometry against, possibly, maybe??
     */
    function
    R_ClipGeometryAgainstNearPlane
    ( triView: tri3_t,
      clippedTriQueue: [tri3_t, tri3_t] ): number
    {
        let nVerticesInside = 0;
        const inside: vec3_t[] = Array(4);
        /* test each vertex in the original triangle against the near-clipping
         * plane to see whether they fall inside of the plane or not
         */
        for (let i = 0; i < 3; ++i)
        {
            const v = triView[i], vNext = triView[i === 2 ? 0 : i + 1];
            const vInside = v[2] >= Z_NEAR, vNextInside = vNext[2] >= Z_NEAR;
            if (vInside) inside[nVerticesInside++] = v;
            /* if the edge of the triangle formed by vertices `v` & `vNext`
             * intersects the near-clipping plane, store the point of
             * intersection as an "inside" vertex
             */
            // @ts-ignore >:[
            if (vInside ^ vNextInside)
            {
                const t = M_TimeBeforePlaneCollision3(v, vNext,
                                                      projectionOrigin, FWD)!;
                const intersect = M_Add3(M_Scale3(M_Sub3(vNext, v), t), v);
                inside[nVerticesInside++] = intersect;
            }
        }
        // early return: no vertices lie inside/in front of the near-clipping
        // plane, should cull the entire triangle
        if (!nVerticesInside) return 0;
        /* the vertices that fall inside the near-clipping plane form a
         * triangle, add it to the clip-buffer
         */
        clippedTriQueue[0] = Tri3(inside[0], inside[1], inside[2]);
        /* the vertices that fall inside the near-clipping plane form a quad,
         * triangulate it by forming an additional triangle and save that in the
         * clip-buffer
         */
        if (nVerticesInside === 4)
            clippedTriQueue[1] = Tri3(inside[2], inside[3], inside[0]);

        return nVerticesInside - 2; // triangulation of an n-gon
     }

    /* TODO: make a generic function that takes in as arguments the `planeRef` &
     * `planeNormal` to clip the geometry against, possibly, maybe??
     */
    function
    R_ClipGeometryAgainstNearPlane_Textured
    ( triView: tri3_t, clippedTriQueue: [tri3_t, tri3_t],
      triVertexNormals: tri3_t, clippedTriVertexNormalQueue: [tri3_t, tri3_t],
      uvMap: tri3_t, clippedUvMapQueue: [tri3_t, tri3_t] ): number
    {
        let nVerticesInside = 0;
        const inside: vec3_t[] = Array(4);
        const nInside: vec3_t[] = Array(4);
        const uvInside: vec3_t[] = Array(4);
        /* test each vertex in the original triangle against the near-clipping
         * plane to see whether they fall inside of the plane or not
         */
        for (let i = 0; i < 3; ++i)
        {
            const iNext = i === 2 ? 0 : i + 1;
            const v = triView[i], vNext = triView[iNext];
            const n = triVertexNormals[i], nNext = triVertexNormals[iNext];
            const uv = uvMap[i], uvNext = uvMap[iNext];
            const vInside = v[2] >= Z_NEAR, vNextInside = vNext[2] >= Z_NEAR;
            if (vInside)
            {
                inside[nVerticesInside] = v;
                nInside[nVerticesInside] = n;
                uvInside[nVerticesInside++] = uv;
            }
            /* if the edge of the triangle formed by vertices `v` & `vNext`
             * intersects the near-clipping plane, store the point of
             * intersection as an "inside" vertex
             */
            // @ts-ignore >:[
            if (vInside ^ vNextInside)
            {
                const t = M_TimeBeforePlaneCollision3(v, vNext,
                                                      projectionOrigin, FWD)!;
                const intersect = M_Add3(M_Scale3(M_Sub3(vNext, v), t), v);
                const intersectN = M_Add3(M_Scale3(M_Sub3(nNext, n), t), n);
                const intersectUV = M_Add3(M_Scale3(M_Sub3(uvNext, uv), t), uv);
                inside[nVerticesInside] = intersect;
                nInside[nVerticesInside] = intersectN;
                uvInside[nVerticesInside++] = intersectUV;
            }
        }
        // early return: no vertices lie inside/in front of the near-clipping
        // plane, should cull the entire triangle
        if (!nVerticesInside) return 0;
        /* the vertices that fall inside the near-clipping plane form a
         * triangle, add it to the clip-buffer...
         */
        clippedTriQueue[0] = Tri3(inside[0], inside[1], inside[2]);
        /* ...the same goes for the vertex normals */
        clippedTriVertexNormalQueue[0] =
            Tri3(nInside[0], nInside[1], nInside[2]);
        // ...the same goes for the vertices in the texture-space
        clippedUvMapQueue[0] = Tri3(uvInside[0], uvInside[1], uvInside[2]);
        /* the vertices that fall inside the near-clipping plane form a quad,
         * triangulate it by forming an additional triangle and save that in the
         * clip-buffer...
         */
        if (nVerticesInside === 4)
        {
            clippedTriQueue[1] = Tri3(inside[2], inside[3], inside[0]);
            /* ...the same goes for the vertex normals */
            clippedTriVertexNormalQueue[1] =
                Tri3(nInside[2], nInside[3], nInside[0]);
            // ...the same goes for the vertices in the texture-space
            clippedUvMapQueue[1] = Tri3(uvInside[2], uvInside[3], uvInside[0]);
        }

        return nVerticesInside - 2; // triangulation of an n-gon
    }

    function
    R_SortTwoTrianglesInCulledBuffer
    ( tri0: number,
      tri1: number ): number
    {
        const tri0View = R_ToViewSpace(transformedTris3[tri0]);
        const tri1View = R_ToViewSpace(transformedTris3[tri1]);

        return tri1View[0][2] + tri1View[1][2] + tri1View[2][2] -
               tri0View[0][2] - tri0View[1][2] - tri0View[2][2];
    }

    /* TODO: unused for the time being, going to be useful once more advanced
     * features like translucency are implemented
     */
    // @ts-ignore
    function R_SortGeometry (): void
    {
        const sorted = culledBuffer
            .slice(0, nCulledBuffer)
            .sort(R_SortTwoTrianglesInCulledBuffer);
        culledBuffer = new Uint32Array(
            Array.from(sorted).concat(Array(nTris - nCulledBuffer).fill(0))
        );
    }

    function R_RenderGeomeries_Wireframe (nTrisOnScreen: Uint32Array): void
    {
        let trisRendered = 0;
        for (let i = 0; i < nCulledBuffer; ++i)
        {
            const triIndex = culledBuffer[i];
            const triWorld = transformedTris3[triIndex];
            const triView = R_ToViewSpace(triWorld);
            // keep a buffer of clipped triangles for drawing
            const clippedTriQueue = Array(2) as [tri3_t, tri3_t];
            const nClipResult = R_ClipGeometryAgainstNearPlane(triView,
                                                               clippedTriQueue);
            // TODO: clip against far-plane
            for (let j = 0; j < nClipResult; ++j)
            {
                const triFrustum = clippedTriQueue[j];
                const triClip = R_ToClipSpace(triFrustum);
                const aClip3 = triClip[0];
                const bClip3 = triClip[1];
                const cClip3 = triClip[2];
                const ax = aClip3[0] * SCREEN_W_2 + SCREEN_W_2;
                const ay = aClip3[1] * SCREEN_H_2 + SCREEN_H_2;
                const bx = bClip3[0] * SCREEN_W_2 + SCREEN_W_2;
                const by = bClip3[1] * SCREEN_H_2 + SCREEN_H_2;
                const cx = cClip3[0] * SCREEN_W_2 + SCREEN_W_2;
                const cy = cClip3[1] * SCREEN_H_2 + SCREEN_H_2;
                R_DrawTriangle_Wireframe(ax, ay, bx, by, cx, cy,
                                         255, 255, 255, 255, 2);
                ++trisRendered;
            }
        }
        nTrisOnScreen[0] = trisRendered;
        nTrisOnScreen[1] = nCulledBuffer;
    }

    function R_RenderGeomeries_Flat (nTrisOnScreen: Uint32Array): void
    {
        let trisRendered = 0;
        for (let i = 0; i < nCulledBuffer; ++i)
        {
            const triIndex = culledBuffer[i];
            const triWorld = transformedTris3[triIndex];
            const triView = R_ToViewSpace(triWorld);
            // the original triangle after having clipped against the near-plane
            const clippedTriQueue = Array(2) as [tri3_t, tri3_t];
            const nClipResult = R_ClipGeometryAgainstNearPlane(triView,
                                                               clippedTriQueue);
            // TODO: clip against far-plane
            let faceLuminance = 1;
            if (nClipResult)
                // calculate the dot product of the directional light and the
                // unit normal of the triangle in view space to determine the
                // level of illumination on the surface
                faceLuminance = (
                    M_Dot3(DIRECTIONAL_LIGHT,
                           M_TriNormal3(clippedTriQueue[0])) + 1
                ) * 0.5;
            for (let j = 0; j < nClipResult; ++j)
            {
                const triFrustum = clippedTriQueue[j];
                const triClip = R_ToClipSpace(triFrustum);
                const aClip3 = triClip[0];
                const bClip3 = triClip[1];
                const cClip3 = triClip[2];
                const ax = aClip3[0] * SCREEN_W_2 + SCREEN_W_2;
                const ay = aClip3[1] * SCREEN_H_2 + SCREEN_H_2;
                const bx = bClip3[0] * SCREEN_W_2 + SCREEN_W_2;
                const by = bClip3[1] * SCREEN_H_2 + SCREEN_H_2;
                const cx = cClip3[0] * SCREEN_W_2 + SCREEN_W_2;
                const cy = cClip3[1] * SCREEN_H_2 + SCREEN_H_2;
                /* TODO: consider using the actual non-linear depth values,
                 * `triClip[i][2]`, i.e., the `z` in `gl_FragCoord`, in the
                 * depth-buffering instead
                 */
                const aw = triFrustum[0][2];
                const bw = triFrustum[1][2];
                const cw = triFrustum[2][2];
                R_FillTriangle_Flat(ax, ay, aw,
                                    bx, by, bw,
                                    cx, cy, cw,
                                    255, 255, 255, 255, faceLuminance);
                if (DEBUG_MODE)
                    R_DrawTriangle_Wireframe(ax, ay, bx, by, cx, cy,
                                             0, 0, 0, 255, 2);
                ++trisRendered;
            }
        }
        nTrisOnScreen[0] = trisRendered;
        nTrisOnScreen[1] = nCulledBuffer;
    }

    function R_RenderGeometries_Textured (nTrisOnScreen: Uint32Array): void
    {
        let trisRendered = 0;
        // early return if the mesh does not have texture-mapping
        if (!uvTable3) return;
        /* the directional light falling on the triangle */
        let lightX: number | undefined;
        let lightY: number | undefined;
        let lightZ: number | undefined;
        if (RENDER_MODES[renderMode] === RENDER_MODE.TEXTURED_SHADED)
        {
            lightX = 0; lightY = 0; lightZ = 1;
        }
        for (let i = 0; i < nCulledBuffer; ++i)
        {
            const triIndex = culledBuffer[i];
            const triWorld = transformedTris3[triIndex];
            const uvMap = uvTable3[triIndex];
            const triView = R_ToViewSpace(triWorld);
            // the original triangle after having clipped against the near-plane
            const clippedTriQueue = Array(2) as [tri3_t, tri3_t];
            // the vertex normals after having clipped against the near-plane
            const clippedTriVertexNormalQueue = Array(2) as [tri3_t, tri3_t];
            // the uv-map after having clipped against the near-plane
            const clippedUvMapQueue = Array(2) as [tri3_t, tri3_t];
            const nClipResult = R_ClipGeometryAgainstNearPlane_Textured(
                triView,
                clippedTriQueue,
                transformedTriVertexNormals3[triIndex],
                clippedTriVertexNormalQueue,
                uvMap,
                clippedUvMapQueue
            );
            // TODO: clip against far-plane
            for (let j = 0; j < nClipResult; ++j)
            {
                const triFrustum = clippedTriQueue[j];
                const triVertexNormals = clippedTriVertexNormalQueue[j];
                const uvFrustum = clippedUvMapQueue[j];
                const triClip = R_ToClipSpace(triFrustum);
                const aClip3 = triClip[0];
                const bClip3 = triClip[1];
                const cClip3 = triClip[2];
                const ax = aClip3[0] * SCREEN_W_2 + SCREEN_W_2;
                const ay = aClip3[1] * SCREEN_H_2 + SCREEN_H_2;
                const bx = bClip3[0] * SCREEN_W_2 + SCREEN_W_2;
                const by = bClip3[1] * SCREEN_H_2 + SCREEN_H_2;
                const cx = cClip3[0] * SCREEN_W_2 + SCREEN_W_2;
                const cy = cClip3[1] * SCREEN_H_2 + SCREEN_H_2;
                /* TODO: consider using the actual non-linear depth values,
                 * `triClip[i][2]`, i.e., the `z` in `gl_FragCoord`, in the
                 * depth-buffering instead
                 */
                const aw = triFrustum[0][2];
                const bw = triFrustum[1][2];
                const cw = triFrustum[2][2];
                const aUV = uvFrustum[0];
                const bUV = uvFrustum[1];
                const cUV = uvFrustum[2];
                const au = aUV[0], av = aUV[1], ac = aUV[2];
                const bu = bUV[0], bv = bUV[1], bc = bUV[2];
                const cu = cUV[0], cv = cUV[1], cc = cUV[2];
                /* vertex normals used in smooth shading */
                const nax = triVertexNormals[0][0];
                const nay = triVertexNormals[0][1];
                const naz = triVertexNormals[0][2];
                const nbx = triVertexNormals[1][0];
                const nby = triVertexNormals[1][1];
                const nbz = triVertexNormals[1][2];
                const ncx = triVertexNormals[2][0];
                const ncy = triVertexNormals[2][1];
                const ncz = triVertexNormals[2][2];
                R_DrawTriangle_Textured_Perspective(
                    A_Texture(textureTable[triIndex]),
                    ax, ay, aw,
                    bx, by, bw,
                    cx, cy, cw,
                    au, av, ac,
                    bu, bv, bc,
                    cu, cv, cc,
                    nax, nay, naz,
                    nbx, nby, nbz,
                    ncx, ncy, ncz,
                    1,
                    lightX, lightY, lightZ
                );
                if (DEBUG_MODE)
                    R_DrawTriangle_Wireframe(ax, ay, bx, by, cx, cy,
                                             255, 255, 255, 255, 2);
                ++trisRendered;
            }
        }
        nTrisOnScreen[0] = trisRendered;
        nTrisOnScreen[1] = nCulledBuffer;
    }

    function R_RenderGeometries (nTrisOnScreen: Uint32Array): void
    {
        R_CullGeometry();
        switch (RENDER_MODES[renderMode])
        {
            case RENDER_MODE.WIREFRAME:
                R_RenderGeomeries_Wireframe(nTrisOnScreen);

                break;
            case RENDER_MODE.FLAT:
                R_RenderGeomeries_Flat(nTrisOnScreen);

                break;
            case RENDER_MODE.TEXTURED:
            case RENDER_MODE.TEXTURED_SHADED:
                R_RenderGeometries_Textured(nTrisOnScreen);

                break;
            default:
                break;
        }
        if (DEBUG_MODE) R_DebugAxes();
    }

    function R_Tris (): tri3_t[]
    {
        return tris3;
    }

    window.__import__R_Geometry = function ()
    {
        return {
            R_ToggleGlobalRotation,
            R_ChangeRenderMode,
            R_LoadGeometry,
            R_InitUVTable,
            R_UpdateGeometry,
            R_RenderGeometries,
            R_Tris,
        };
    };
})();
