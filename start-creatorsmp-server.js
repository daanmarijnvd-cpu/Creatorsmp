const { spawn } = require("child_process");
const fs = require("fs");
const http = require("http");
const path = require("path");

const host = "127.0.0.1";
const port = 8765;
const pagePath = path.join(__dirname, "csmptest.html");
const address = `http://${host}:${port}/`;

const server = http.createServer((request, response) => {
    const pathname = new URL(request.url, address).pathname;
    if (pathname === "/shutdown") {
        if (request.method !== "POST" || request.headers.origin !== address.slice(0, -1)) {
            response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
            response.end("Verzoek niet toegestaan");
            return;
        }

        response.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
        response.end("De CreatorSMP-server wordt gestopt.");
        response.once("finish", () => {
            setTimeout(() => {
                server.close(error => {
                    if (error) {
                        console.error("De webserver kon niet netjes worden afgesloten:", error.message);
                        process.exitCode = 1;
                        return;
                    }
                    console.log("CreatorSMP-server is gestopt.");
                });
                if (typeof server.closeAllConnections === "function") {
                    server.closeAllConnections();
                }
            }, 150);
        });
        return;
    }

    if (pathname !== "/" && pathname !== "/csmptest.html") {
        response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        response.end("Niet gevonden");
        return;
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
        response.writeHead(405, { "Content-Type": "text/plain; charset=utf-8", "Allow": "GET, HEAD" });
        response.end("Methode niet toegestaan");
        return;
    }

    fs.readFile(pagePath, (error, contents) => {
        if (error) {
            console.error(`Kan ${pagePath} niet lezen:`, error.message);
            response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
            response.end("De CreatorSMP-pagina kon niet worden geopend.");
            return;
        }

        response.writeHead(200, {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-store"
        });
        response.end(request.method === "HEAD" ? undefined : contents);
    });
});

server.on("error", error => {
    console.error(`De webserver kon niet starten op poort ${port}: ${error.message}`);
    if (error.code === "EADDRINUSE") {
        console.error("Poort 8765 is al in gebruik. Sluit de andere server en probeer opnieuw.");
    }
    process.exitCode = 1;
});

server.listen(port, host, () => {
    console.log("CreatorSMP draait op " + address);
    console.log("Laat dit venster open. Druk op Ctrl+C om de server te stoppen.");

    const browser = spawn("cmd.exe", ["/c", "start", "", address], {
        detached: true,
        stdio: "ignore"
    });
    browser.on("error", error => {
        console.error("De browser kon niet automatisch worden geopend:", error.message);
        console.log("Open de website zelf via " + address);
    });
    browser.unref();
});
