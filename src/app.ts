import express from 'express';
import helmet from 'helmet';
import { healthRoutes } from './routes/health.routes.js';
import { guaranteeTemplateRoutes } from './routes/guaranteeTemplate.routes.js';
import { agreementTemplateRoutes } from './routes/agreementTemplate.routes.js';
import { agreementCollectionRoutes } from './routes/agreementCollection.routes.js';
import { agreementVersionRoutes } from './routes/agreementVersion.routes.js';
import { stateRoutes } from './routes/state.routes.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { checkServiceAuthentication } from './middlewares/service.authenticator.js';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';

const app = express();

app.use(helmet());
app.use(express.json());

// Swagger setup
const swaggerPath = path.resolve(process.cwd(), 'src/docs/swagger.yaml');
const swaggerDocument = YAML.load(swaggerPath);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(healthRoutes);
app.use('/api/v1', checkServiceAuthentication, guaranteeTemplateRoutes);
app.use('/api/v1', checkServiceAuthentication, agreementTemplateRoutes);
app.use('/api/v1', checkServiceAuthentication, agreementCollectionRoutes);
app.use('/api/v1', checkServiceAuthentication, agreementVersionRoutes);
app.use('/api/v1', checkServiceAuthentication, stateRoutes);
app.use(errorHandler);

export default app;
