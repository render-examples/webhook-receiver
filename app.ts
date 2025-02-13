import express from "express";
const app = express();
const port = process.env.PORT || 3001;

app.post("/webhook", express.raw({type: 'application/json'}), (req, res) => {
    console.log({body: JSON.parse(req.body)});
    res.send({})
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));