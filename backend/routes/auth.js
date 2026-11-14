const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middleware/authMiddleware");
const db = require("../db");

const router = express.Router();


//Signup API
router.post("/signup", async(req, res)=>{
    try{
        const{name, email, password}=req.body;

        //Check required fields
        if(!name||!email||!password){
            return res.status(400).json({
                message: "Name, email and password are required"
            });
        }
        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();

        if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)){
            return res.status(400).json({
                message: "Please enter a valid email address"
            });
        }

        if(password.length < 8){
            return res.status(400).json({
                message: "Password must contain at least 8 characters"
            });
        }

        //Check whether email already exists
        db.query("SELECT id FROM users WHERE email = ?",
            [cleanEmail],async(err, results)=>{
                if(err){
                    return res.status(500).json({
                        message: "Database error"
                    });
                }
                if(results.length > 0 ){
                    return res.status(409).json({
                        message:"Email already registered"
                    });
                }

                //Hash password
                const hashedPassword = await bcrypt.hash(password, 10);

                //Save user
                db.query("INSERT INTO users (name, email, password) VALUES(?, ?, ?)",
                    [cleanName, cleanEmail, hashedPassword], (err, result)=>{
                        if(err){
                            return res.status(500).json({
                                message: "Unable to register user"
                            });
                        }

                        return res.status(201).json({
                            message:"Signup successful!",
                            userId: result.insertId
                        });

                    }
                );
            }
        );
    }
    catch(error){
        return res.status(500).json({
            message: "Server error"
        });
    }
});

//Login API
router.post("/login", (req, res) => {
    const {email, password} = req.body;

    //Check required fields
    if(!email || !password){
        return res.status(400).json({
            message: "Email and password are required"
        });
    }
    const cleanEmail = email.trim().toLowerCase();

    //Find user by email
    db.query("SELECT * FROM users WHERE email = ?",[cleanEmail],
        async(err, results) => {
            if(err){
                return res.status(500).json({
                    message: "Database error"
                });
            }
            if(results.length === 0){
                return res.status(401).json({
                    message: "Invalid email or password"
                });
            }

            const user = results[0];
            try{
                // Compare entered password with hashed password
                const isPasswordValid = await bcrypt.compare(
                    password, user.password
                );
                
                if(!isPasswordValid){
                    return res.status(401).json({
                        message: "Invalid email or password"
                    });
                }

                //Generate Jwt token 
                const token = jwt.sign({
                    id: user.id,
                    email:user.email
                },
                process.env.JWT_SECRET,{expiresIn: "1h"});

                return res.status(200).json({
                    message: "Login successful!",
                    token: token,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email
                    }
                });
            }

            catch(error){
                return res.status(500).json({
                    message: "Login failed"
                });
            }
        });

});

//Protected route - Get logged-in user
router.get("/me", authMiddleware, (req, res) =>{
    res.status(200).json({
        message: "Authentication successful",
        user: req.user
    });
});

// ADMIN LOGIN API
router.post("/admin/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Email and password are required"
        });
    }

    const cleanEmail = email.trim().toLowerCase();

    db.query(
        "SELECT * FROM admins WHERE LOWER(email) = ?",
        [cleanEmail],
        async (err, results) => {
            if (err) {
                return res.status(500).json({
                    message: "Database error"
                });
            }

            if (results.length === 0) {
                return res.status(401).json({
                    message: "Invalid email or password"
                });
            }

            try {
                const admin = results[0];

                const isValid = await bcrypt.compare(
                    password,
                    admin.password
                );

                if (!isValid) {
                    return res.status(401).json({
                        message: "Invalid email or password"
                    });
                }

                const token = jwt.sign(
                    {
                        id: admin.id,
                        email: admin.email,
                        role: "admin"
                    },
                    process.env.JWT_SECRET,
                    { expiresIn: "1h" }
                );

                return res.status(200).json({
                    message: "Admin login successful!",
                    token,
                    admin: {
                        id: admin.id,
                        name: admin.name,
                        email: admin.email
                    }
                });
            } catch (error) {
                return res.status(500).json({
                    message: "Admin login failed"
                });
            }
        }
    );
});

module.exports = router;
