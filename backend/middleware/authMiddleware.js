const jwt = require("jsonwebtoken");
const authMiddleware = (req, res, next) => {

    //Get token from request  header
    const authHeader = req.headers.authorization;
    
    if(!authHeader || !authHeader.startsWith("Bearer ")){
        return res.status(401).json({
            message: "Access denied. No token provided."
        });
    }
    const token = authHeader.split(" ")[1];
    try{
        //verify JWT token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
            
        );

        //Attach user information to request
        req.user = decoded;

        //Allow request to continue
        next();
    } catch(error){
        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
};

module.exports = authMiddleware;