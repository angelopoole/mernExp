const mongoose = require('mongoose');
const config = require('config');
const db = config.get('mongoURI');

// we could use .then format but we're using async/await instead, this is because its much cleaner and lets our code look syncronus even though it isnt
const connectDB = async () => {
  try {
    await mongoose.connect(db, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false,
    });

    console.log('mongoDB Connected...');
  } catch (err) {
    console.log(err.message);
    // Exit process with falure
    process.exit(1);
  }
};

module.exports = connectDB;
