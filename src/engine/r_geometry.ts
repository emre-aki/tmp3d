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
    const { __DEBUG_MODE__: DEBUG_MODE } = window;

    const { A_Texture } = __import__A_Assets();

    const {
        FRUSTUM_AABB3,
        SCREEN_W_2, SCREEN_H_2,
        Z_NEAR,
    } = __import__G_Const();

    const {
        I_GetKeyState,
        I_Keys,
    } = __import__I_Input();

    const {
        M_BoundingBoxVsBoundingBoxCollision3,
        M_LineSegmentVsPlaneCollision3,
        M_TimeBeforePlaneCollision3,
     } = __import__M_Collision();

    const {
        M_AABB3FromTri3,
        M_RotateTriAroundAxis3,
        M_Tri3: Tri3,
        M_TriNormal3,
    } = __import__M_Tri3();

    const {
        M_Add3,
        M_IsInFrontOfPlane3,
        M_Scale3,
        M_Sub3,
        M_Vec3: Vec3,
    } = __import__M_Vec3();

    const {
        R_GetProjectionOrigin,
        R_TriToClipSpace,
        R_TriToViewSpace,
        R_TriToWorldSpace,
        R_VecToClipSpace,
        R_VecToViewSpace,
        /* base vectors in world space */
        R_Origin: ORIGIN,
        R_Right: RIGHT,
        R_Down: DOWN,
        R_Fwd: FWD,
    } = __import__R_Camera();

    const {
        R_DrawLine,
        R_DrawTriangle_Wireframe,
        R_FillTriangle_Colored,
        R_FillTriangle_Textured_Perspective,
    } = __import__R_Draw();

    const { R_UpdateLight } = __import__R_Light();

    const {
        R_ShaderMode_Fill,
        R_ShaderMode_Smooth,
        R_ShaderMode_Texture,
        R_ShaderMode_Wireframe,
        R_PixelShaderObj: pso,
        R_VertexShaderObj: vso,
    } = __import__R_Shader();

    // the center of the projection (near-clipping) plane
    let projectionOrigin: vec3_t;
    let nTris: number; // total number of triangles in the model
    let tris3: tri3_t[]; // a pool of raw triangle data
    let transformedTris3: tri3_t[]; // triangles after transformation
    // normal vectors associated with vertices of each triangle in the pool,
    // used in smooth shading
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
        const vertexNormals3 = Array<vec3_t>(nVertices);
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
            const uvFace = triangles[i];
            const texUVA2 = vertices[uvFace.a];
            const texUVB2 = vertices[uvFace.b];
            const texUVC2 = vertices[uvFace.c];
            /* FIXME: add `Tri2` & `Vec2` */
            uvTable3[i] = Tri3(Vec3(texUVA2[0], texUVA2[1], 1),
                               Vec3(texUVB2[0], texUVB2[1], 1),
                               Vec3(texUVC2[0], texUVC2[1], 1));
            textureTable[i] = uvFace.textureId;
        }
    }

    /* TODO: add functionality here to allow updating parts of the geometry as
     * opposed to the entire model
     */
    function R_UpdateWorld (): void
    {
        R_UpdateLight(pso);
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
            const triView = R_TriToViewSpace(transformedTris3[i]);
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
    //
    // R_ClipGeometryAgainstNearPlane
    // Clip the given triangle against the near-clipping plane of the view
    // frustum
    //
    // Expects the input triangle `triView` to be in view space.
    //
    function
    R_ClipGeometryAgainstNearPlane
    ( triView: tri3_t,
      clippedTriQueue: [tri3_t, tri3_t],
      triVertexNormals: tri3_t,
      clippedTriVertexNormalQueue: [tri3_t, tri3_t] ): number
    {
        let nVerticesInside = 0;
        const inside = Array<vec3_t>(4), nInside = Array<vec3_t>(4);
        /* test each vertex in the original triangle against the near-clipping
         * plane to see whether they fall inside of the plane or not
         */
        for (let i = 0; i < 3; ++i)
        {
            const iNext = i === 2 ? 0 : i + 1;
            const v = triView[i], vNext = triView[iNext];
            const n = triVertexNormals[i], nNext = triVertexNormals[iNext];
            const vInside = v[2] >= Z_NEAR, vNextInside = vNext[2] >= Z_NEAR;
            if (vInside)
            {
                inside[nVerticesInside] = v;
                nInside[nVerticesInside++] = n;
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
                inside[nVerticesInside] = intersect;
                nInside[nVerticesInside++] = intersectN;
            }
        }
        // early return: no vertices lie inside/in front of the near-clipping
        // plane, should cull the entire triangle
        if (!nVerticesInside) return 0;
        /* the vertices that fall inside the near-clipping plane form a
         * triangle, add it to the clip-buffer
         */
        clippedTriQueue[0] = Tri3(inside[0], inside[1], inside[2]);
        /* ...the same goes for the vertex normals */
        clippedTriVertexNormalQueue[0] =
            Tri3(nInside[0], nInside[1], nInside[2]);
        /* the vertices that fall inside the near-clipping plane form a quad,
         * triangulate it by forming an additional triangle and save that in the
         * clip-buffer
         */
        if (nVerticesInside === 4)
        {
            clippedTriQueue[1] = Tri3(inside[2], inside[3], inside[0]);
            /* ...the same goes for the vertex normals */
            clippedTriVertexNormalQueue[1] =
                Tri3(nInside[2], nInside[3], nInside[0]);
        }

        return nVerticesInside - 2; // triangulation of an n-gon
     }

    /* TODO: make a generic function that takes in as arguments the `planeRef` &
     * `planeNormal` to clip the geometry against, possibly, maybe??
     */
    //
    // R_ClipGeometryAgainstNearPlane_Textured
    // Clip the given triangle, along with the UV-map and the vertex normals
    // associated with each of its vertices, against the near-clipping plane of
    // the view frustum
    //
    // Expects the input triangle `triView` to be in view space — UV-map and
    // vertex normals can be in any arbitrary space.
    //
    function
    R_ClipGeometryAgainstNearPlane_Textured
    ( triView: tri3_t,
      clippedTriQueue: [tri3_t, tri3_t],
      triVertexNormals: tri3_t,
      clippedTriVertexNormalQueue: [tri3_t, tri3_t],
      uvMap: tri3_t,
      clippedUvMapQueue: [tri3_t, tri3_t] ): number
    {
        let nVerticesInside = 0;
        const inside = Array<vec3_t>(4);
        const nInside = Array<vec3_t>(4);
        const uvInside = Array<vec3_t>(4);
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
        // ...the same goes for the vertices in the texture space
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
            // ...the same goes for the vertices in the texture space
            clippedUvMapQueue[1] = Tri3(uvInside[2], uvInside[3], uvInside[0]);
        }

        return nVerticesInside - 2; // triangulation of an n-gon
    }

    function
    R_SortTwoTrianglesInCulledBuffer
    ( tri0: number,
      tri1: number ): number
    {
        const tri0View = R_TriToViewSpace(transformedTris3[tri0]);
        const tri1View = R_TriToViewSpace(transformedTris3[tri1]);

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
        /* go over and render all of the triangles that survived culling */
        for (let i = 0; i < nCulledBuffer; ++i)
        {
            const triIndex = culledBuffer[i];
            const triWorld = transformedTris3[triIndex];
            const triView = R_TriToViewSpace(triWorld);
            // keep a buffer of clipped triangles for drawing
            const clippedTriQueue = Array(2) as [tri3_t, tri3_t];
            // UNUSED: the vertex normals after having clipped against the
            // near-plane
            const clippedTriVertexNormalQueue = Array(2) as [tri3_t, tri3_t];
            const nClipResult = R_ClipGeometryAgainstNearPlane(
                triView,
                clippedTriQueue,
                transformedTriVertexNormals3[triIndex],
                clippedTriVertexNormalQueue
            );
            // TODO: clip against far-plane
            for (let j = 0; j < nClipResult; ++j)
            {
                const triFrustum = clippedTriQueue[j];
                const triClip = R_TriToClipSpace(triFrustum);
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

    function R_RenderGeomeries_ColorFill (nTrisOnScreen: Uint32Array): void
    {
        let trisRendered = 0;
        /* go over and render all of the triangles that survived culling */
        for (let i = 0; i < nCulledBuffer; ++i)
        {
            const triIndex = culledBuffer[i];
            const triWorld = transformedTris3[triIndex];
            const triView = R_TriToViewSpace(triWorld);
            // the original triangle after having clipped against the near-plane
            const clippedTriQueue = Array(2) as [tri3_t, tri3_t];
            // the vertex normals after having clipped against the near-plane
            const clippedTriVertexNormalQueue = Array(2) as [tri3_t, tri3_t];
            const nClipResult = R_ClipGeometryAgainstNearPlane(
                triView,
                clippedTriQueue,
                transformedTriVertexNormals3[triIndex],
                clippedTriVertexNormalQueue
            );
            // TODO: clip against far-plane
            /* calculate the surface normal if the shader mode is set to
             * flat-shading
             */
            if (nClipResult && !(pso.mode & R_ShaderMode_Smooth))
            {
                const triNormal = M_TriNormal3(triWorld);
                pso.normalX = triNormal[0];
                pso.normalY = triNormal[1];
                pso.normalZ = triNormal[2];
            }
            else
            {
                pso.normalX = undefined;
                pso.normalY = undefined;
                pso.normalZ = undefined;
            }
            for (let j = 0; j < nClipResult; ++j)
            {
                const triFrustum = clippedTriQueue[j];
                const triFrustumWorld = R_TriToWorldSpace(triFrustum);
                const triVertexNormals = clippedTriVertexNormalQueue[j];
                const triClip = R_TriToClipSpace(triFrustum);
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
                const aw = 1 / triFrustum[0][2];
                const bw = 1 / triFrustum[1][2];
                const cw = 1 / triFrustum[2][2];
                /* configure the vertex shader object for the draw call */
                vso.ax = ax; vso.ay = ay; vso.aw = aw;
                vso.bx = bx; vso.by = by; vso.bw = bw;
                vso.cx = cx; vso.cy = cy; vso.cw = cw;
                /* vertex normals used in smooth shading */
                const aNormal3 = triVertexNormals[0];
                const bNormal3 = triVertexNormals[1];
                const cNormal3 = triVertexNormals[2];
                const nAX = aNormal3[0], nAY = aNormal3[1], nAZ = aNormal3[2];
                const nBX = bNormal3[0], nBY = bNormal3[1], nBZ = bNormal3[2];
                const nCX = cNormal3[0], nCY = cNormal3[1], nCZ = cNormal3[2];
                vso.nax = nAX; vso.nay = nAY; vso.naz = nAZ;
                vso.nbx = nBX; vso.nby = nBY; vso.nbz = nBZ;
                vso.ncx = nCX; vso.ncy = nCY; vso.ncz = nCZ;
                /* world space vertex coordinates used in point lighting */
                const a3 = triFrustumWorld[0];
                const b3 = triFrustumWorld[1];
                const c3 = triFrustumWorld[2];
                const wAX = a3[0], wAY = a3[1], wAZ = a3[2];
                const wBX = b3[0], wBY = b3[1], wBZ = b3[2];
                const wCX = c3[0], wCY = c3[1], wCZ = c3[2];
                vso.wax = wAX; vso.way = wAY; vso.waz = wAZ;
                vso.wbx = wBX; vso.wby = wBY; vso.wbz = wBZ;
                vso.wcx = wCX; vso.wcy = wCY; vso.wcz = wCZ;
                /* FIXME: clip these color coordinates as well, along with the
                 * vertices of the triangle, maybe??
                 */
                // assign each vertex a specific color to be interpolated across
                // the entire triangle
                vso.ar = 255; vso.ag = 255; vso.ab = 255;
                vso.br = 255; vso.bg = 255; vso.bb = 255;
                vso.cr = 255; vso.cg = 255; vso.cb = 255;
                R_FillTriangle_Colored(vso, pso);
                if (pso.mode & R_ShaderMode_Wireframe)
                    R_DrawTriangle_Wireframe(ax, ay, bx, by, cx, cy,
                                             0, 0, 0, 255, 2);
                ++trisRendered;
            }
        }
        nTrisOnScreen[0] = trisRendered;
        nTrisOnScreen[1] = nCulledBuffer;
    }

    function R_RenderGeometries_TextureFill (nTrisOnScreen: Uint32Array): void
    {
        let trisRendered = 0;
        // early return if the mesh does not have texture-mapping
        if (!uvTable3) return;
        /* go over and render all of the triangles that survived culling */
        for (let i = 0; i < nCulledBuffer; ++i)
        {
            const triIndex = culledBuffer[i];
            const triWorld = transformedTris3[triIndex];
            const triView = R_TriToViewSpace(triWorld);
            const triNormalsWorld = transformedTriVertexNormals3[triIndex];
            const uvMap = uvTable3[triIndex];
            // the original triangle after having clipped against the near-plane
            const clippedTriQueue = Array(2) as [tri3_t, tri3_t];
            // the vertex normals after having clipped against the near-plane
            const clippedTriVertexNormalQueue = Array(2) as [tri3_t, tri3_t];
            // the uv-map after having clipped against the near-plane
            const clippedUvMapQueue = Array(2) as [tri3_t, tri3_t];
            const nClipResult = R_ClipGeometryAgainstNearPlane_Textured(
                triView,
                clippedTriQueue,
                triNormalsWorld,
                clippedTriVertexNormalQueue,
                uvMap,
                clippedUvMapQueue
            );
            /* calculate the surface normal if the shader mode is set to
             * flat-shading
             */
            if (nClipResult && !(pso.mode & R_ShaderMode_Smooth))
            {
                const triNormal = M_TriNormal3(triWorld);
                pso.normalX = triNormal[0];
                pso.normalY = triNormal[1];
                pso.normalZ = triNormal[2];
            }
            else
            {
                pso.normalX = undefined;
                pso.normalY = undefined;
                pso.normalZ = undefined;
            }
            // grab the texture and pass it along to the pixel shader object
            pso.tex = A_Texture(textureTable[triIndex]);
            // TODO: clip against far-plane
            for (let j = 0; j < nClipResult; ++j)
            {
                const triFrustum = clippedTriQueue[j];
                const triFrustumWorld = R_TriToWorldSpace(triFrustum);
                const triVertexNormals = clippedTriVertexNormalQueue[j];
                const uvFrustum = clippedUvMapQueue[j];
                const triClip = R_TriToClipSpace(triFrustum);
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
                 * depth-buffering (and in depth-buffering only, not in
                 * perspective-correction) instead
                 */
                const aw = 1 / triFrustum[0][2];
                const bw = 1 / triFrustum[1][2];
                const cw = 1 / triFrustum[2][2];
                /* configure the vertex shader object for the draw call */
                vso.ax = ax; vso.ay = ay; vso.aw = aw;
                vso.bx = bx; vso.by = by; vso.bw = bw;
                vso.cx = cx; vso.cy = cy; vso.cw = cw;
                /* UV coordinates for texture-mapping */
                const aUV = uvFrustum[0];
                const bUV = uvFrustum[1];
                const cUV = uvFrustum[2];
                const au = aUV[0], av = aUV[1];
                const bu = bUV[0], bv = bUV[1];
                const cu = cUV[0], cv = cUV[1];
                vso.au = au; vso.av = av;
                vso.bu = bu; vso.bv = bv;
                vso.cu = cu; vso.cv = cv;
                /* vertex normals used in smooth shading */
                const aNormal3 = triVertexNormals[0];
                const bNormal3 = triVertexNormals[1];
                const cNormal3 = triVertexNormals[2];
                const nAX = aNormal3[0], nAY = aNormal3[1], nAZ = aNormal3[2];
                const nBX = bNormal3[0], nBY = bNormal3[1], nBZ = bNormal3[2];
                const nCX = cNormal3[0], nCY = cNormal3[1], nCZ = cNormal3[2];
                vso.nax = nAX; vso.nay = nAY; vso.naz = nAZ;
                vso.nbx = nBX; vso.nby = nBY; vso.nbz = nBZ;
                vso.ncx = nCX; vso.ncy = nCY; vso.ncz = nCZ;
                /* world space vertex coordinates used in point lighting */
                const a3 = triFrustumWorld[0];
                const b3 = triFrustumWorld[1];
                const c3 = triFrustumWorld[2];
                const wAX = a3[0], wAY = a3[1], wAZ = a3[2];
                const wBX = b3[0], wBY = b3[1], wBZ = b3[2];
                const wCX = c3[0], wCY = c3[1], wCZ = c3[2];
                vso.wax = wAX; vso.way = wAY; vso.waz = wAZ;
                vso.wbx = wBX; vso.wby = wBY; vso.wbz = wBZ;
                vso.wcx = wCX; vso.wcy = wCY; vso.wcz = wCZ;
                R_FillTriangle_Textured_Perspective(vso, pso);
                if (pso.mode & R_ShaderMode_Wireframe)
                    R_DrawTriangle_Wireframe(ax, ay, bx, by, cx, cy,
                                             255, 255, 255, 255, 2);
                ++trisRendered;
            }
        }
        nTrisOnScreen[0] = trisRendered;
        nTrisOnScreen[1] = nCulledBuffer;
    }

    //
    // R_RenderLine
    // Render a 3-D line
    //
    // Vertices `src` and `dest` are in world space
    //
    function
    R_RenderLine
    ( src: vec3_t, dest: vec3_t,
      r: number, g: number, b: number, a: number,
      stroke: number ): void
    {
        const srcView = R_VecToViewSpace(src);
        const destView = R_VecToViewSpace(dest);
        const zNear = projectionOrigin[2];
        const zSrc = srcView[2], zDest = destView[2];
        let srcClip: vec3_t, destClip: vec3_t;
        // both ends of the line are behind the near-clipping plane, nothing to
        // draw, exit early
        if (zSrc < zNear && zDest < zNear) return;
        // both ends of the line are in front of the near-clipping plane, no
        // need to clip
        if (zSrc >= zNear && zDest >= zNear)
        {
            srcClip = R_VecToClipSpace(srcView);
            destClip = R_VecToClipSpace(destView);
        }
        /* one end of the line is behind, while the other is in front: it has to
         * be clipped against the near-clipping plane
         */
        else
        {
            const intersect = M_LineSegmentVsPlaneCollision3(srcView,
                                                             destView,
                                                             projectionOrigin,
                                                             FWD);
            if (!intersect) return; // how would this ever happen!?
            /* clip the `src` endpoint */
            if (zDest > zSrc)
            {
                srcClip = R_VecToClipSpace(intersect);
                destClip = R_VecToClipSpace(destView);

            }
            /* clip the `dest` endpoint */
            else
            {
                srcClip = R_VecToClipSpace(srcView);
                destClip = R_VecToClipSpace(intersect);
            }
        }
        R_DrawLine(srcClip[0] * SCREEN_W_2 + SCREEN_W_2,
                   srcClip[1] * SCREEN_H_2 + SCREEN_H_2,
                   destClip[0] * SCREEN_W_2 + SCREEN_W_2,
                   destClip[1] * SCREEN_H_2 + SCREEN_H_2,
                   r, g, b, a,
                   stroke);
    }

    function R_RenderDebugAxes (length: number): void
    {
        R_RenderLine(ORIGIN, M_Scale3(RIGHT, length), 255, 0, 0, 255, 2);
        R_RenderLine(ORIGIN, M_Scale3(DOWN, length), 0, 255, 0, 255, 2);
        R_RenderLine(ORIGIN, M_Scale3(FWD, length), 0, 0, 255, 255, 2);
    }

    function R_RenderGeometries (nTrisOnScreen: Uint32Array): void
    {
        R_CullGeometry();
        if (pso.mode & R_ShaderMode_Fill)
        {
            if (pso.mode & R_ShaderMode_Texture)
                R_RenderGeometries_TextureFill(nTrisOnScreen);
            else
                R_RenderGeomeries_ColorFill(nTrisOnScreen);
        }
        else
            R_RenderGeomeries_Wireframe(nTrisOnScreen);
        if (DEBUG_MODE) R_RenderDebugAxes(1000);
    }

    function R_Tris (): tri3_t[]
    {
        return tris3;
    }

    window.__import__R_Geometry = function ()
    {
        return {
            R_ToggleGlobalRotation,
            R_LoadGeometry,
            R_InitUVTable,
            R_UpdateWorld,
            R_RenderLine,
            R_RenderGeometries,
            R_Tris,
        };
    };
})();
