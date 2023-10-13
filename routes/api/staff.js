const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { check, validationResult }= require('express-validator');
const emailService = require('../../services/email.service');

// Bring staff model
const Staff = require('../../models/Staff');

// Bring auth token
const authStaff = require('../../middleware/authStaff')

// @route    POST api/staff/register
// @desc     Register Staff
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
            let staff = await Staff.findOne({ email });;
            // See if the staff exists
            if(staff){
                return res.status(400).json({ errors: [{msg: 'Staff with this email already exists'}]});
            }

            staff = new Staff({
                name,
                email,
                password,
            });

            // Encrypt password
            const salt = await bcrypt.genSalt(10);
            staff.password = await bcrypt.hash(password, salt);
            await staff.save();

            // Return jsonwebtoken
            const payload = {
                staff:{
                    id : staff.id
                }
            }

            jwt.sign(
                payload,
                process.env.JWTSECRETSTAFF,
                { expiresIn: 360000 },
                (err, token) => {
                    if(err) throw err;

                    // Send verification email
                    const verifyLink = `${process.env.BACKENDURL}/api/staff/verify/${staff.id}`;
                    emailService.verifyEmail(staff.email, verifyLink);

                    res.status(200).json({ token });
                }
            );
        } catch(err) {
            console.error(err.message);
            res.status(500).send('Server error');
        }
    }
);


// @route    POST api/staff/login
// @desc     Authenticate staff & get token
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
            let staff = await Staff.findOne({ email });
            // See if the staff exists
            if(!staff){
                return res
                .status(400)
                .json({ errors: [{ msg: 'Invalid Credentials' }] });
            }

            const isMatch = await bcrypt.compare(password, staff.password);
            if(!isMatch){
                return res
                .status(400)
                .json({ errors: [{ msg: 'Invalid Credentials!' }] });
            }
            
            const payload = {
                staff:{
                    id : staff.id
                }
            }

            jwt.sign(
                payload,
                process.env.JWTSECRETSTAFF,
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

// @route    GET api/staff/verify/:id
// @desc     Verify staff email
// @access   Public
router.get('/verify/:id', async (req,res) => {
    try {
        const staff = await Staff.findOne({ _id: req.params.id });
        if(!staff){
            return res.status(404).json({ msg: 'Account not found' });
        }
        if(staff.verified){
            return res.status(400).json({ msg: 'Email already verified' });
        }
        staff.verified = true;
        await staff.save();
        res.status(200).send('Email verified');
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route    GET api/staff/resend/:id
// @desc     Resend verification email
// @access   Public
router.get('/resend/:id', async (req,res) => {
    try {
        const staff = await Staff.findOne({ _id: req.params.id });
        if(!staff){
            return res.status(404).json({ msg: 'Staff not found' });
        }
        if(staff.verified){
            return res.status(400).json({ msg: 'Email already verified' });
        }
        // Send verification email
        const verifyLink = `${process.env.BACKENDURL}/api/staff/verify/${staff.id}`;
        emailService.verifyEmail(staff.email, verifyLink);
        res.status(200).send('Verification email sent. Check your email');
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route    POST api/staff/forgot-password
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
        const staff = await Staff.findOne({ email });
        if(!staff){
            return res.status(404).json({ msg: 'Email not found' });
        }

        // Generate Reset Pawword Token
        const payload = {
            staff:{
                id : staff.id
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
            await Staff.updateOne({ _id: staff.id }, { $set: { resetLink: token } });
        } catch (err) {
            res.status(500).send('Error updating reset link');
        }

        try {
            await emailService.resetPasswordEmail(staff.email, resetLink);
            res.status(200).send('Email sent. Follow the instructions in the email to reset your password');
        } catch (err) {
            res.status(500).send('Error sending password reset link');
        }
       
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route    PUT api/staff/resetpassword
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
        
        const staff = await Staff.findOne({ _id: decoded.staff.id });
        if(!staff){
            return res.status(404).json({ msg: 'Account not found' });
        }

        // Encrypt password
        const salt = await bcrypt.genSalt(10);
        staff.password = await bcrypt.hash(password, salt);
        staff.resetLink = '';
        await staff.save();
        await emailService.passwordChangedSuccessfully(staff.email);
        res.status(200).send('Password Updated Successfully');
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route    PUT api/staff/changepassword
// @desc     Change password
// @access   Private
router.put('/changepassword',[
    check('newPassword', 'Password must be minimum 8 characters long.').isLength({min: 8}),
    check('oldPassword', 'Current password is required').exists()
], authStaff, async (req,res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array() });
    }

    const { newPassword, oldPassword } = req.body;
    try{
        const staff = await Staff.findOne({ _id: req.userId });
        if(!staff){
            return res.status(404).json({ msg: 'Account not found' });
        }

        const isMatch = await bcrypt.compare(oldPassword, staff.password);
        if(!isMatch){
            return res.status(400).json({ errors: [{ msg: 'Invalid Credentials!' }] });
        }

        // Encrypt password
        const salt = await bcrypt.genSalt(10);
        staff.password = await bcrypt.hash(newPassword, salt);
        await staff.save();
        await emailService.passwordChangedSuccessfully(staff.email);
        res.status(200).send('Password Updated Successfully');
    } catch(err){
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route    GET api/staff/me
// @desc     Get logged in staff
// @access   Private
router.get('/me', authStaff, async (req,res) => {
    try {
        const staff = await Staff.findOne({ _id: req.userId }).select('-password').select('-resetLink');
        res.send(staff);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


module.exports = router;