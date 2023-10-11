const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = function(req, res, next) {
    // Get the token from the header
    const token = req.header('x-auth-token');

    // Check if no token
    if(!token) {
        return res.status(401).json({ msg: 'No staff or admin token, authorization denied!'});
    }

    //Verify token
    try {
        let decodedAdmin=null;
        let decodedStaff=null;
        try {
            decodedAdmin = jwt.verify(token, process.env.JWTSECRETADMIN);    
        } catch (err) {
            decodedStaff = jwt.verify(token, process.env.JWTSECRETSTAFF);    
        }

        if(decodedAdmin) req.userId = decodedAdmin.admin.id;
        else if(decodedStaff) req.userId = decodedStaff.staff.id;
        next();
    } catch(err) {
        res.status(401).json({ msg: 'Token is invalid!'});
    }
};