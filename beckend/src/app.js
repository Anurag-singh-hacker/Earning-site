const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const config = require('./config/env');
const routes = require('./routes');
const { apiLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Adjust/remove based on your deployment. Needed for correct req.ip
// (used in audit logs and rate limiting) behind a reverse proxy / load balancer.
app.set('trust proxy', 1);

app.use(helmet());
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(apiLimiter);

app.use('/api', routes);

app.use((req, res) => {
  res.status(404).json({ success: false, error: { message: 'Route not found' } });
});

app.use(errorHandler);

module.exports = app;

