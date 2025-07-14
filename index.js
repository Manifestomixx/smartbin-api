require('dotenv/config');
const express = require('express');
const app = express();
const cors = require('cors');
const connect = require('./config/DB');
const transactionRoute = require('./routes/transactionRoute');
const userRoute = require('./routes/userRoute');
const authRoute = require('./routes/authRoute');
const billRoute = require('./routes/billRoute');
const PORT = 5000;


app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1/payment', transactionRoute);
app.use('/api/v1/user', userRoute);
app.use('/api/v1/auth', authRoute);
app.use('/api/v1/bill', billRoute);



// Test Route
app.get('/', (req, res) => {
    res.send('ALAT Payment API is running...');
  });

// Connect to MongoDB and start the server
connect().then(() => {
    try {
        app.listen(PORT, () => {
            console.log(`Server is connected to http://localhost:${PORT}`);
        });
    } catch (error) {
        console.log("cannot connect to server", error);
        
    }
})
.catch((error) => {
    console.log("failed to connect to MongoDB", error);
    
})

app.get('/', (req, res) => {
    res.status(200).json({
        message: "Welcome to SmartBin API",
    })
})

app.use((req, res) => {
    res.status(404).json({
        message: "Route not found"
    });
})