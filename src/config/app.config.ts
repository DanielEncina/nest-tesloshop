export const EnvConfigutation = () => ({
  appId: process.env.APP_ID,
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  nodeEnv: process.env.NODE_ENV || 'dev',
  defaultLimit: +process.env.DEFAULT_LIMIT || 10,
  defaultOffset: +process.env.DEFAULT_OFFSET || 0,
  port: +process.env.PORT || 3000,
  dbHost: process.env.DB_HOST || '',
  dbName: process.env.DB_NAME || '',
  dbUser: process.env.DB_USER || '',
  dbPassword: process.env.DB_PASSWORD || '',
  dbPort: +process.env.DB_PORT || 5432,
  hostApi: process.env.HOST_API || 'http://localhost',
});
