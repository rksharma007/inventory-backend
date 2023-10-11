const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = function(req, res, next) {
    // Get the token from the header
    const token = req.header('x-auth-token');

    // Check if no token
    if(!token) {
        return res.status(401).json({ msg: 'No staff token, authorization denied!'});
    }

    //Verify token
    try {
        const decoded = jwt.verify(token, process.env.JWTSECRETSTAFF);
        req.userId = decoded.staff.id;
        next();
    } catch(err) {
        res.status(401).json({ msg: 'Token is invalid!'});
    }
};