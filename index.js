const express = require('express');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;
const connectToMongo = require('./db');
connectToMongo();

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.use(express.json());
app.use('/auth', require('./routes/auth'));
app.use('/groups', require('./routes/groups'));

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
