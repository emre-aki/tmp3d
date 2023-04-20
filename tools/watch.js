/*
 *  watch.js
 *  tmp3d
 *
 *  Created by Emre Akı on 2023-04-22.
 *
 *  SYNOPSIS:
 *      A module for watching and re-building changes in the local project tree.
 */

const { Build } = require("./build");

const ENV = process.env;

function main ()
{
    Build("dist", ENV.DEBUG, 1);
    require("./server");
}

main();
