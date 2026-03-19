/**
 * Middleware de autenticación para el backoffice.
 * Soporta tokens en Header: Authorization (Bearer o directo) y Query: token.
 * Soporta también Polka manual query parsing.
 */
export const backofficeAuth = (req: any, res: any, next: () => void) => {
    // En Polka req.query puede ser undefined, parseamos manualmente si es necesario
    if (!req.query && req.url && req.url.includes('?')) {
        try {
            const url = new URL(req.url, 'http://localhost');
            const qry: any = {};
            url.searchParams.forEach((v, k) => qry[k] = v);
            req.query = qry;
        } catch (e) { req.query = {}; }
    }

    let token = req.headers['authorization'] || (req.query && (req.query as any).token) || '';
    if (typeof token === 'string') {
        if (token.startsWith('token=')) token = token.slice(6);
        else if (token.startsWith('Bearer ')) token = token.slice(7);
        else if (token.split(' ').length > 1) token = token.split(' ')[1]; // Por si es "Bearer TOKEN" sin el espacio exacto
    }
    
    // Si no hay token en query o headers, enviamos 401
    if (!token) {
        return res.status(401).json({ success: false, error: 'Unauthorized: No token provided' });
    }

    const expectedToken = process.env.BACKOFFICE_TOKEN || 'RIALWAY_PASS_2024';
    if (token === expectedToken) {
        return next();
    }
    
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid token' });
};
