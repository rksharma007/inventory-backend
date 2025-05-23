const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { check, validationResult }= require('express-validator');
const emailService = require('../../services/email.service');

// Bring admin model
const Admin = require('../../models/Admin');

// Bring auth token
const authAdmin = require('../../middleware/authAdmin')

// @route    POST api/admin/register
// @desc     Register Admin
// @access   Public
router.post('/register', [
    check('name' , 'Name cannot be blank.').not().isEmpty(),
    check('email', 'Please enter a valid email.').isEmail(),
    check('password', 'Password must be minimum 8 characters long.').isLength({min: 8})
    ],
    async (req,res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({errors: errors.array() });
        }

        const {name, email, password} = req.body;

        try{
            let admin = await Admin.findOne({ email });;
            // See if the admin exists
            if(admin){
                return res.status(400).json({ errors: [{msg: 'Admin with this email already exists'}]});
            }

            admin = new Admin({
                name,
                email,
                password,
            });

            // Encrypt password
            const salt = await bcrypt.genSalt(10);
            admin.password = await bcrypt.hash(password, salt);
            await admin.save();

            // Return jsonwebtoken
            const payload = {
                admin:{
                    id : admin.id
                }
            }

            jwt.sign(
                payload,
                process.env.JWTSECRETADMIN,
                { expiresIn: 360000 },
                (err, token) => {
                    if(err) throw err;

                    // Send verification email
                    const verifyLink = `${process.env.BACKENDURL}/api/admin/verify/${admin.id}`;
                    emailService.verifyEmail(admin.email, verifyLink);

                    res.status(200).json({ token });
                }
            );
        } catch(err) {
            console.error(err.message);
            res.status(500).send('Server error');
        }
    }
);


// @route    POST api/admin/login
// @desc     Authenticate admin & get token
// @access   Public
router.post('/login', [
    check('email', 'Please enter a valid email').isEmail(),
    check('password', 'Password is required!').exists(),
    ],
    async (req,res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({errors: errors.array() });
        }

        const { email, password } = req.body;

        try{
            let admin = await Admin.findOne({ email });
            // See if the admin exists
            if(!admin){
                return res
                .status(400)
                .json({ errors: [{ msg: 'Invalid Credentials' }] });
            }

            const isMatch = await bcrypt.compare(password, admin.password);
            if(!isMatch){
                return res
                .status(400)
                .json({ errors: [{ msg: 'Invalid Credentials!' }] });
            }
            
            const payload = {
                admin:{
                    id : admin.id
                }
            }

            jwt.sign(
                payload,
                process.env.JWTSECRETADMIN,
                { expiresIn: 360000 },
                (err, token) => {
                    if(err) throw err;
                    res.json({ token });
                }
            );

        } catch(err) {
            console.error(err.message);
            res.status(500).send('Server error');
        }
    }
);

// @route    GET api/admin/verify/:id
// @desc     Verify admin email
// @access   Public
router.get('/verify/:id', async (req,res) => {
    try {
        const admin = await Admin.findOne({ _id: req.params.id });
        if(!admin){
            return res.status(404).json({ msg: 'Account not found' });
        }
        if(admin.verified){
            return res.status(400).json({ msg: 'Email already verified' });
        }
        admin.verified = true;
        await admin.save();
        res.status(200).send('Email verified');
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route    GET api/admin/resend/:id
// @desc     Resend verification email
// @access   Public
router.get('/resend/:id', async (req,res) => {
    try {
        const admin = await Admin.findOne({ _id: req.params.id });
        if(!admin){
            return res.status(404).json({ msg: 'Admin not found' });
        }
        if(admin.verified){
            return res.status(400).json({ msg: 'Email already verified' });
        }
        // Send verification email
        const verifyLink = `${process.env.BACKENDURL}/api/admin/verify/${admin.id}`;
        emailService.verifyEmail(admin.email, verifyLink);
        res.status(200).send('Verification email sent. Check your email');
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route    POST api/admin/forgot-password
// @desc     Forgot password
// @access   Public
router.post('/forgotpassword',[
    check('email', 'Please enter a valid email').isEmail()
], async (req,res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array() });
    }

    const { email } = req.body;

    try {
        const admin = await Admin.findOne({ email });
        if(!admin){
            return res.status(404).json({ msg: 'Email not found' });
        }

        // Generate Reset Pawword Token
        const payload = {
            admin:{
                id : admin.id
            }
        }

        const token = jwt.sign(
            payload,
            process.env.JWTRESETPASSWORD,
            { expiresIn: '10m' }
        );

        // Send reset password email
        const resetLink = `${process.env.FRONTENDURL}/resetpassword/${token}`;

        try {
            await Admin.updateOne({ _id: admin.id }, { $set: { resetLink: token } });
        } catch (err) {
            res.status(500).send('Error updating reset link');
        }

        try {
            await emailService.resetPasswordEmail(admin.email, resetLink);
            res.status(200).send('Email sent. Follow the instructions in the email to reset your password');
        } catch (err) {
            res.status(500).send('Error sending password reset link');
        }
       
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route    PUT api/admin/resetpassword
// @desc     Reset password
// @access   Public
router.put('/resetpassword',[
    check('password', 'Password must be minimum 8 characters long.').isLength({min: 8})
], async (req,res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array() });
    }

    const { password, token } = req.body;

    try {
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWTRESETPASSWORD);
        } catch (err) {
            return res.status(401).json({ msg: 'Timer Expired. Try sending reset link again.' });
        }
        
        const admin = await Admin.findOne({ _id: decoded.admin.id });
        if(!admin){
            return res.status(404).json({ msg: 'Account not found' });
        }

        // Encrypt password
        const salt = await bcrypt.genSalt(10);
        admin.password = await bcrypt.hash(password, salt);
        admin.resetLink = '';
        await admin.save();
        await emailService.passwordChangedSuccessfully(admin.email);
        res.status(200).send('Password Updated Successfully');
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route    PUT api/admin/changepassword
// @desc     Change password
// @access   Private
router.put('/changepassword',[
    check('newPassword', 'Password must be minimum 8 characters long.').isLength({min: 8}),
    check('oldPassword', 'Current password is required').exists()
], authAdmin, async (req,res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array() });
    }

    const { newPassword, oldPassword } = req.body;
    try{
        const admin = await Admin.findOne({ _id: req.userId });
        if(!admin){
            return res.status(404).json({ msg: 'Account not found' });
        }

        const isMatch = await bcrypt.compare(oldPassword, admin.password);
        if(!isMatch){
            return res.status(400).json({ errors: [{ msg: 'Invalid Credentials!' }] });
        }

        // Encrypt password
        const salt = await bcrypt.genSalt(10);
        admin.password = await bcrypt.hash(newPassword, salt);
        await admin.save();
        await emailService.passwordChangedSuccessfully(admin.email);
        res.status(200).send('Password Updated Successfully');
    } catch(err){
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route    GET api/admin/me
// @desc     Get logged in admin
// @access   Private
router.get('/me', authAdmin, async (req,res) => {
    try {
        const admin = await Admin.findOne({ _id: req.userId }).select('-password').select('-resetLink');
        res.send(admin);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


module.exports = router;