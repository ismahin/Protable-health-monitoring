import fs from "node:fs";
const file = "dist/index.html";
let html = fs.readFileSync(file, "utf8");
html = html.replace(
  /<title>[^<]*<\/title>/,
  "<title>PHMS | Portable Health Monitoring System</title>",
);
html = html.replace(
  "</head>",
  '<meta name="description" content="PHMS: live health readings, ECG and pulse graphs, GPS location, and AI questions in one dashboard."/><meta name="theme-color" content="#080F17"/></head>',
);
if (!/<html[^>]*\blang=/.test(html))
  html = html.replace("<html ", '<html lang="en" ');
fs.writeFileSync(file, html);
console.log("Prepared PHMS web title, description and browser theme.");
