const mongoose = require('mongoose');

const StaffSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase:true
    },
    password: {
        type: String,
        required: true
    },
    usertype: {
        type: String,
        default: 'staff',
        required: true
    },
    verified: {
        type: Boolean,
        default: false
    },
    resetLink:{
        type: String,
        default:''
    }
}, {
    timestamps: true
});

module.exports = Staff = mongoose.model('staff', StaffSchema);