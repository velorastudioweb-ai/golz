import fs from "fs";
import path from "path";

const src = fs.readFileSync("client/src/data/servicesFallback.js", "utf8");
const re = /\{"title":"([^"]+)","slug":"([^"]+)".*?"image":"([^"]*)"/g;
let m;
while ((m = re.exec(src))) {
  const [, title, slug, image] = m;
  const disk = image ? path.join("client/public", image) : "";
  console.log(
    `${fs.existsSync(disk) ? "OK  " : image ? "MISS" : "EMPTY"} | ${slug.padEnd(30)} | ${title.padEnd(32)} | ${image || "-"}`
  );
}
