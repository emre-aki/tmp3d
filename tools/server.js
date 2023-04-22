/*
 *  server.js
 *  tmp3d
 *
 *  Created by Emre Akı on 2022-04-23.
 *
 *  SYNOPSIS:
 *      The module that helps serve the Tmp3D Engine locally as a static site.
 */

const express = require("express");
const path = require("path");

const packageJson = require("../package.json");
const { LogInfo } = require("./log");

const ENV = process.env;
const PORT = ENV.PORT || 3000;
const ROOT = path.join(__dirname, "..", "src");
const CLIENT_ENV = { debugMode: ENV.DEBUG, version: packageJson.version };
const LOG_OPTIONS = { context: "server" };

function serve ()
{
    LogInfo(`Serving ${ROOT} through port ${PORT}`, LOG_OPTIONS);
}

function main ()
{
    express()
        .use(express.static(path.join(ROOT, "..", "assets")))
        .use("/engine", express.static(path.join(ROOT, "engine")))
        .use("/game", express.static(path.join(ROOT, "game")))
        .use("/data", express.static(path.join(ROOT, "data")))
        .set("view engine", "ejs")
        .set("views", path.join(ROOT, "view"))
        .get("/", (_, res) => res.render("index", { env: CLIENT_ENV }))
        .listen(PORT, serve);
}

main();
