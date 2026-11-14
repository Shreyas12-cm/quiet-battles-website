const express= require("express");
const cors = require("cors");
require("dotenv").config();
const authRoutes = require("./routes/auth");
const contentRoutes = require("./routes/content");

const db = require("./db");
const app = express();


app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/content", contentRoutes);

app.get("/", (req, res) => {
    res.send("QUIET BATTLES Backend is running!");
});

app.get("/api/products", (req, res) => {
    db.query("SELECT * FROM products",(err, results) =>{
        if(err){
            return res.status(500).json({
                error: err.message
            });
        }

        res.json(results);
    });


});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});