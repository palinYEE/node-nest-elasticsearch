import express, { Express } from 'express';
const app = express();
const port = 5678;

app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.listen(port, function() {
    console.log(`host connection port ${port}`);
});

app.get('/', (req, res) => {
    res.send({
        "message": "server check"
    });
});
