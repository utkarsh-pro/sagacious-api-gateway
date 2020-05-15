const express = require('express')

const app = express();

app.use(require('cors')())

app.get("/:any", (req, res) => {
    res.send(req.headers)
})

app.listen("9000", () => console.log("Test server is up on PORT", 9000))