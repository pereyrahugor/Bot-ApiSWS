import path from 'path';
import fs from 'fs';
import serve from 'serve-static';

export interface StaticDependencies {
    __dirname: string;
}

/**
 * Función auxiliar para servir páginas HTML con reemplazo dinámico (Multitenancy Visual)
 */
function serveHtmlPage(app: any, route: string, filename: string, deps: StaticDependencies) {
    const handler = (req: any, res: any) => {
        try {
            const possiblePaths = [
                path.join(process.cwd(), 'src', 'html', filename),
                path.join(process.cwd(), filename),
                path.join(process.cwd(), 'src', filename),
                path.join(deps.__dirname, 'html', filename),
                path.join(deps.__dirname, filename),
                path.join(deps.__dirname, '..', 'src', 'html', filename)
            ];

            let htmlPath = null;
            for (const p of possiblePaths) {
                if (fs.existsSync(p) && fs.lstatSync(p).isFile()) {
                    htmlPath = p;
                    break;
                }
            }

            if (htmlPath) {
                let content = fs.readFileSync(htmlPath, 'utf-8');
                const assistantName = process.env.ASSISTANT_NAME || process.env.RAILWAY_PROJECT_NAME || "Bot RialWay";
                
                // Sustituciones dinámicas
                content = content.replace(/{{ASSISTANT_NAME}}/g, assistantName);
                content = content.replace(/{{PROJECT_NAME}}/g, assistantName);
                
                if (filename === 'backoffice.html') {
                    content = content.replace(
                        '<h2 style="margin:0; font-size: 1.2rem;">Backoffice</h2>',
                        `<h2 style="margin:0; font-size: 1.2rem;">Backoffice - ${assistantName}</h2>`
                    );
                }

                res.setHeader('Content-Type', 'text/html');
                res.end(content);
            } else {
                console.error(`[ERROR] File not found: ${filename}`);
                res.status(404).send('HTML no encontrado en el servidor');
            }
        } catch (err) {
            console.error(`[ERROR] Failed to serve ${filename}:`, err);
            res.status(500).send('Error interno al servir HTML');
        }
    };
    app.get(route, handler);
}

/**
 * Registra rutas estáticas y páginas HTML.
 */
export const registerStaticRoutes = (app: any, deps: StaticDependencies) => {
    // Páginas HTML principales
    serveHtmlPage(app, "/dashboard", "dashboard.html", deps);
    serveHtmlPage(app, "/login", "login.html", deps);
    serveHtmlPage(app, "/backoffice", "backoffice.html", deps);
    serveHtmlPage(app, "/webchat", "webchat.html", deps);
    serveHtmlPage(app, "/webreset", "webreset.html", deps);
    serveHtmlPage(app, "/variables", "variables.html", deps);

    // Archivos estáticos
    app.use("/js", serve(path.join(process.cwd(), "src", "js")));
    app.use("/style", serve(path.join(process.cwd(), "src", "style")));
    app.use("/assets", serve(path.join(process.cwd(), "src", "assets")));
    app.use("/uploads", serve(path.join(process.cwd(), "uploads")));

    // QR.png
    app.get("/qr.png", (req: any, res: any) => {
        const qrPath = path.join(process.cwd(), 'bot.qr.png');
        if (fs.existsSync(qrPath)) {
            res.setHeader('Content-Type', 'image/png');
            fs.createReadStream(qrPath).pipe(res);
        } else {
            res.status(404).end('QR not found');
        }
    });

    // Root Redirect (aunque se puede manejar con middleware global, lo dejamos aquí para consistencia)
    app.get("/", (req: any, res: any) => {
        res.writeHead(302, { 'Location': '/dashboard' });
        res.end();
    });
};
