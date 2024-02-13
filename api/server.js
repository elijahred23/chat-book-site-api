import express from 'express';

const app = express();

const port = 3000;


app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET', 'POST', 'PUT', 'DELETE');
    res.header('Access-Control-Allow-Headers', 'Contenty-Type');
    next();
});


app.get('/', (req, res) => {
    res.send({ message: 'HELLO WORLD, THIS IS YOUR CHAT BOOK API' });
});


app.listen(port, () => {
    console.log(`Listening on port ${port}`);
})