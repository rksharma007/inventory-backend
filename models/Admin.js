const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({
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
        default: 'admin',
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

module.exports = Admin = mongoose.model('admin', AdminSchema);