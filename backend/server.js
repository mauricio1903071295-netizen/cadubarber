const createApp = require('./app');
const env = require('./config/env');

const app = createApp();

app.listen(env.port, () => {
  console.log(`Backend rodando em http://localhost:${env.port}`);
});
