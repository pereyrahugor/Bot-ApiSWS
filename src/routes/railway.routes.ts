import bodyParser from 'body-parser';
import { backofficeAuth } from "../middleware/auth";

export interface RailwayDependencies {
    RailwayApi: any;
}

/**
 * Registra rutas para administración de Railway.
 */
export const registerRailwayRoutes = (app: any, deps: RailwayDependencies) => {
    const { RailwayApi } = deps;

    app.get('/api/railway/deployments', backofficeAuth, async (req: any, res: any) => {
        try {
            const result = await RailwayApi.getDeployments();
            res.json({ success: true, data: result });
        } catch (e: any) {
            res.status(500).json({ success: false, error: e.message });
        }
    });

    app.post('/api/railway/restart', backofficeAuth, bodyParser.json(), async (req: any, res: any) => {
        try {
            const { deploymentId } = req.body;
            if (!deploymentId) return res.status(400).json({ success: false, error: 'deploymentId id required' });
            
            const result = await RailwayApi.restartDeployment(deploymentId);
            res.json({ success: true, data: result });
        } catch (e: any) {
            res.status(500).json({ success: false, error: e.message });
        }
    });

    app.post('/api/railway/vars/update', backofficeAuth, bodyParser.json(), async (req: any, res: any) => {
        try {
            const { variables } = req.body;
            if (!variables) return res.status(400).json({ success: false, error: 'variables map is required' });
            
            const result = await RailwayApi.updateVariables(variables);
            res.json({ success: true, data: result });
        } catch (e: any) {
            res.status(500).json({ success: false, error: e.message });
        }
    });

    app.get('/api/railway/vars', backofficeAuth, async (req: any, res: any) => {
        try {
            const result = await RailwayApi.getVariables();
            res.json({ success: true, data: result });
        } catch (e: any) {
            res.status(500).json({ success: false, error: e.message });
        }
    });
};
