const mongoose = require("mongoose");

const MongoDB_URL = process.env.MongoDB_URL;

const connect = async () => {
    try {
      await mongoose.connect(MongoDB_URL);
      console.log("Connected to MongoDB successfully");
      
    } catch (error) {
        console.log("Error connecting to MongoDB:", error.message);
        
    }
}

module.exports = connect;