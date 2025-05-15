/**
 * Swagger UI configuration
 */
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

// Load the OpenAPI specification
const swaggerDocument = YAML.load(path.join(__dirname, '../docs/api/openapi.yaml'));

/**
 * Initialize Swagger UI middleware
 * @param {Object} app - Express application
 */
function setupSwagger(app) {
    // Serve Swagger UI
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
        explorer: true,
        customCss: '.swagger-ui .topbar { display: none }',
        swaggerOptions: {
            docExpansion: 'none',
            filter: true,
            showRequestDuration: true,
        }
    }));

    // Serve the raw OpenAPI specification
    app.get('/api-docs.yaml', (req, res) => {
        res.setHeader('Content-Type', 'text/yaml');
        res.setHeader('Content-Disposition', 'inline; filename="openapi.yaml"');
        res.sendFile(path.join(__dirname, '../docs/api/openapi.yaml'));
    });

    console.log('Swagger UI initialized at /api-docs');
}

module.exports = {
    setupSwagger
};
