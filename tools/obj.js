/*
 *  obj.js
 *  tmp3d
 *
 *  Created by Emre Akı on 2022-07-03.
 *
 *  SYNOPSIS:
 *      A CLI that provides some utility functions to help work with .obj files.
 */

const cli = require("commander");
const path = require("path");

const { ReadFile, WriteFile } = require("./file.js");
const { ArrayToStr, DateToStr } = require("./misc.js");

const ROOT = path.join(__dirname, "..");
const ASSETS_PATH = path.join(ROOT, "assets");
const MESH_PATH = path.join(ROOT, "src", "data", "mesh");
const VIEW_PATH = path.join(ROOT, "src", "view", "index.ejs");

const DELIMITER = ",\n            ";

const tmp3DMeshTemplate = `/*
 *  %filename
 *  tmp3d
 *
 *  Created by Emre Akı on %dateCreated.
 *
 *  SYNOPSIS:
 *      The initial 3-D geometry data and their respective UV mappings.
 */

(function ()
{
    function D_Vertices ()
    {
        return [
            %v
        ];
    }

    function D_UV ()
    {
        return [
            %vt
        ];
    }

    function D_Triangles ()
    {
        return [
            %f
        ];
    }

    function D_UVMap ()
    {
        return [
            %vf
        ];
    }

    function D_TextureAtlas ()
    {
        return {
            %ta
        };
    }

    window.__import__D_Mesh = function ()
    {
        return {
            D_Vertices: D_Vertices,
            D_UV: D_UV,
            D_Triangles: D_Triangles,
            D_UVMap: D_UVMap,
            D_TextureAtlas: D_TextureAtlas,
        };
    };
})();
`;

function ParseLine (line)
{
    return line.split(/\ +/);
}

function TextureAtlas (pathToMtl)
{
    const textureAtlas = {};
    // early return if there's no material file to be read
    if (!pathToMtl) return textureAtlas;
    const rawMtl = ReadFile(pathToMtl, { encoding: "utf8" });
    const lines = rawMtl.split("\n");
    let mtlId; // current material id
    for (const line of lines)
    {
        const tokens = ParseLine(line);
        // encountered a new material definition:
        //   update the current material id
        if (tokens[0] === "newmtl") mtlId = tokens[1];
        /* encountered a texture map definition for the current material:
         *   save the path to the texture in the `textureAtlas` with its key
         *   being the current material id
         */
        else if (tokens[0].match(/map\_K[ads]/))
        {
            const pathToTexture = `${path.join(path.dirname(pathToMtl),
                                               tokens[1])}`;
            textureAtlas[mtlId] =
                path.join("/", path.relative(ASSETS_PATH, pathToTexture));
        }
    }
    return textureAtlas;
}

function ObjToTmp3D (pathToObj, pathToMtl, outputFilename, zOffset)
{
    const textureAtlas = TextureAtlas(pathToMtl); // construct a texture atlas
    let mtlId; // current material id
    // TODO: consider not using dynamic allocation
    const vertices = [], triangles = [], uvVertices = [], uvMap = [];
    const rawObj = ReadFile(pathToObj, { encoding: "utf8" });
    const lines = rawObj.split("\n");
    for (const line of lines)
    {
        const tokens = ParseLine(line);
        const dataType = tokens[0];
        switch (dataType)
        {
            case "v": // vertex
            {
                const vertex = tokens.slice(1); // world-space coordinates
                /* rotate the vertex read around the x-axis by π radians as the
                 * +y axis in Tmp3D point down whereas in Blender it points up
                 */
                const vertexParsed = [parseFloat(vertex[0]),
                                      -parseFloat(vertex[1]),
                                      -parseFloat(vertex[2]) + zOffset];
                vertices.push(vertexParsed);
                break;
            }
            case "vt": // texture vertices
            {
                const uv = tokens.slice(1); // texture-space coordinates
                // flip the `v` coordinate, as it points up in Blender but down
                // in Tmp3D
                uvVertices.push([parseFloat(uv[0]), 1 - parseFloat(uv[1])]);
                break;
            }
            case "f": // face
            {
                const texturedMatch = line.match(/(\d+)\/(\d+)/g);
                /* encountered a textured face data */
                if (texturedMatch)
                {
                    /* Tmp3D can only process triangles */
                    if (texturedMatch.length !== 3)
                        throw new Error("ObjToTmp3D: Invalid face geometry in" +
                                        pathToObj + ".");
                    const texturedMatchA = texturedMatch[0].split("/");
                    const texturedMatchB = texturedMatch[1].split("/");
                    const texturedMatchC = texturedMatch[2].split("/");
                    /* offset the indices of the vertices by `-1` because
                     * Blender start counting from 1
                     */
                    const triangle = [parseInt(texturedMatchA[0]) - 1,
                                      parseInt(texturedMatchB[0]) - 1,
                                      parseInt(texturedMatchC[0]) - 1];
                    triangles.push(triangle);
                    const texture = [parseInt(texturedMatchA[1]) - 1,
                                     parseInt(texturedMatchB[1]) - 1,
                                     parseInt(texturedMatchC[1]) - 1];
                    // if there's a material defined for the face, write it in
                    // the uv-map
                    if (mtlId) texture.push(`"${mtlId}"`);
                    uvMap.push(texture);
                }
                /* encountered a textureless face data */
                else
                {
                    const vertexIndices = tokens.slice(1);
                    /* Tmp3D can only process triangles */
                    if (vertexIndices.length !== 3)
                        throw new Error("ObjToTmp3D: Invalid face geometry in" +
                                        pathToObj + ".");
                    /* offset the indices of the vertices by `-1` because
                     * Blender start counting from 1
                     */
                    const triangle = [parseInt(vertexIndices[0]) - 1,
                                      parseInt(vertexIndices[1]) - 1,
                                      parseInt(vertexIndices[2]) - 1];
                    triangles.push(triangle);
                }
                break;
            }
            case "usemtl": // use material definition
                mtlId = tokens[1];
                break;
            default:
                break;
        }
    }
    const verticesSerialized = vertices.map(vertex => ArrayToStr(vertex));
    const trianglesSerialized = triangles.map(triangle => ArrayToStr(triangle));
    const uvVerticesSerialized = uvVertices.map(vertex => ArrayToStr(vertex));
    const uvMapSerialized = uvMap.map(uvIndices => ArrayToStr(uvIndices));
    const textureAtlasSerialized = Object
        .entries(textureAtlas)
        .map(([textureId, texturePath]) => `"${textureId}": "${texturePath}"`);
    /* replace serialized mesh data in the template and return the resulting
     * file
     */
    return tmp3DMeshTemplate
        .replace(/\%filename$/m, outputFilename)
        .replace(/\%dateCreated/m, DateToStr(new Date()))
        .replace(/\%v$/m, `${verticesSerialized.join(DELIMITER)}`)
        .replace(/\%f$/m, `${trianglesSerialized.join(DELIMITER)}`)
        .replace(/\%vt$/m, `${uvVerticesSerialized.join(DELIMITER)}`)
        .replace(/\%vf$/m, `${uvMapSerialized.join(DELIMITER)}`)
        .replace(/\%ta$/m, `${textureAtlasSerialized.join(DELIMITER)}`);
}

function ReplaceModelPathInView (modelFilename)
{
    const indexEjs = ReadFile(VIEW_PATH, { encoding: "utf8" });
    const replaced = indexEjs.replace(/\/data\/mesh\/.+\.js/,
                                      `/data/mesh/${modelFilename}`);
    WriteFile(VIEW_PATH, replaced, { encoding: "utf8" });
}

function HandleCommand (pathToObj, args)
{
    /* read optional arguments */
    const pathToMtl = args.material;
    const zOffset = parseFloat(args.zOffset);
    const verbose = args.verbose;
    /* throw an error if the input is not an `.obj` file */
    const objFilename = path.basename(pathToObj).match(/(.+)\.obj$/)[1];
    if (!objFilename)
        throw new Error("HandleCommand: The input is not an .obj file.");
    /* determine the path into which the output will be written */
    const outputPath = path.join(MESH_PATH,
                                 `d_${objFilename.toLowerCase()}.js`);
    const outputFilename = path.basename(outputPath);
    const tmp3Data = ObjToTmp3D(pathToObj, pathToMtl, outputFilename, zOffset);
    if (verbose) console.log(tmp3Data);
    WriteFile(outputPath, tmp3Data, { encoding: "utf8" });
    ReplaceModelPathInView(outputFilename);
    console.log(`Mesh saved at ${path.relative(ROOT, outputPath)}`);
}

function main ()
{
    cli
        .name("obj-utils")
        .description("A set of utility functions to help work with .obj files")
        .version("0.0.1");
    cli
        .command("convert")
        .argument("<path>", "Path to the .obj file to convert")
        .alias("c")
        .description("Convert a Wavefront .obj file into a format that Tmp3D could operate on")
        .option("-m, --material [value]", "Material library file")
        .option("-z, --z-offset [value]", "Offset the model along z-axis", "0.001")
        .option("-v, --verbose", "Verbose mode")
        .action(HandleCommand);
    cli.parse(process.argv);
}

main();
