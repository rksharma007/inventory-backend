const mongoose = require('mongoose');

const StoreSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'admin'
    },
    name: {
        type: String,
        required: true
    },
    address: {
        type: String,
    },
    phone: {
        type: String,
        required: true,
        unique: true,
    },
    alternatePhone: {
        type: String,
    },
    email: {
        type: String,
        default: '',
        lowercase:true
    },
    gstin: {
        type: String,
        default: '',
        unique: true,
    },
    tax: {
        type: Number,
        default: 0,
    },
    logo: {
        type: String,
        default: "https://st3.depositphotos.com/4177785/35869/v/600/depositphotos_358692326-stock-illustration-convenience-store-rgb-color-icon.jpg",
    }
}, {
    timestamps: true
});

module.exports = Store = mongoose.model('admin', StoreSchema);