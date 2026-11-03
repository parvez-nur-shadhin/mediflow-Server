const express = require("express");
const app = express();
const PORT = process.env.PORT || 8000;

app.get("/", (req, res) => {
    res.send("Mediflow Server is Running");
});

app.listen(PORT, () => {
    console.log(`The app is listening on port ${PORT} `);
});