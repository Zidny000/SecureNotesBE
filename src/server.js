require('dotenv').config();
const connectDB = require('./config/db');
const app = require('./app');

if (!process.env.JWT_SECRET || !process.env.MONGO_URI) {
  console.error('Missing JWT_SECRET or MONGO_URI in .env');
  process.exit(1);
}

connectDB()
  .then(() => app.listen(process.env.PORT || 3000, () => console.log(`Server on :${process.env.PORT || 3000}`)))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
