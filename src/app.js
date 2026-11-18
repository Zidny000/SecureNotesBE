const express = require('express');
const helmet = require('helmet');
const errorHandler = require('./middleware/error');

const app = express();
app.use(helmet());
app.use(express.json({ limit: '10kb' }));

// Enable CORS for frontend clients
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/users.routes'));
app.use('/api/notes', require('./routes/notes.routes'));
app.use('/api/posts', require('./routes/posts.routes'));

app.use('/api', (req, res) => res.status(404).json({ message: 'Route not found' }));
app.use(errorHandler);

module.exports = app;
