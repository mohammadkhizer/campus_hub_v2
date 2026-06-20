/**
 * OpenTelemetry Instrumentation for CampusHub.
 * Automatically instruments HTTP, Mongoose, and common Node.js modules.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Dynamic imports to prevent Webpack from bundling Node-only modules in Edge/Client runtimes
    const { NodeSDK } = await import('@opentelemetry/sdk-node');
    const { getNodeAutoInstrumentations } = await import('@opentelemetry/auto-instrumentations-node');
    const { OTLPTraceExporter } = await import('@opentelemetry/exporter-otlp-http');
    const { Resource } = await import('@opentelemetry/resources');
    const { SemanticResourceAttributes } = await import('@opentelemetry/semantic-conventions');

    const sdk = new NodeSDK({
      resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: 'campus-hub',
        [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
      }),
      traceExporter: new OTLPTraceExporter({
        url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
        headers: {
          'Authorization': `Bearer ${process.env.OTEL_EXPORTER_OTLP_TOKEN || ''}`,
        },
      }),
      instrumentations: [
        getNodeAutoInstrumentations({
          '@opentelemetry/instrumentation-fs': { enabled: false },
          '@opentelemetry/instrumentation-dns': { enabled: false },
        }),
      ],
    });

    try {
      sdk.start();
      console.log('✅ OpenTelemetry: SDK initialized successfully');
    } catch (error) {
      console.error('❌ OpenTelemetry: SDK initialization failed', error);
    }

    // Graceful shutdown
    process.on('SIGTERM', () => {
      sdk.shutdown()
        .then(() => console.log('OpenTelemetry: SDK terminated'))
        .catch((error) => console.error('OpenTelemetry: Error terminating SDK', error))
        .finally(() => process.exit(0));
    });
  }
}
