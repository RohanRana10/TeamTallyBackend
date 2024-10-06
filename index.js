const express = require('express');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;
const connectToMongo = require('./db');
var cors = require('cors')
connectToMongo();

app.use(cors());

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.use(express.json());
app.use('/auth', require('./routes/auth'));
app.use('/groups', require('./routes/groups'));
app.use('/payments', require('./routes/payments'));
app.use('/screens', require('./routes/screens'));

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
