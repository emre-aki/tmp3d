const express = require("express");
const path = require("path");

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

express()
    .use(express.static(path.join(ROOT, "..", "assets")))
    .use("/engine", express.static(path.join(ROOT, "engine")))
    .use("/game", express.static(path.join(ROOT, "game")))
    .use("/data", express.static(path.join(ROOT, "data")))
    .set("view engine", "ejs")
    .set("views", path.join(ROOT, "view"))
    .get("/", (_, res) => res.render("index"))
    .listen(PORT, () => console.log(`Listening on ${PORT}\n ROOT: ${ROOT}`));
