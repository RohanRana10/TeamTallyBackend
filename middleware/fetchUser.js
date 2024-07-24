const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET;

const fetchUser = (req, res, next) => {
    try {
        const token = req.header('auth-token');
        if (!token) {
            return res.status(401).json({ error: "please authenticate using a valid token" });
        }
        const data = jwt.verify(token, jwtSecret);
        req.user = data.user;
        next();

    } catch (error) {
        console.error("error fetching authtoken: ", error);
        res.status(401).json({ error: "please authenticate using a valid token" });
    }
}

module.exports = fetchUser;