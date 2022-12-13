/*
 *  file.js
 *  tmp3d
 *
 *  Created by Emre Akı on 2022-07-03.
 *
 *  SYNOPSIS:
 *      The module that helps with filesystem I/O.
 */

const fs = require("fs");

function ReadFile (path, options)
{
    try { return fs.readFileSync(path, options); }
    catch (error) { throw new Error(`ReadFile: ${error}`); }
}

function WriteFile (path, data, options)
{
    try { fs.writeFileSync(path, data, options); }
    catch (error) { throw new Error(`WriteFile: ${error}`); }
}

exports.ReadFile = ReadFile;
exports.WriteFile = WriteFile;
