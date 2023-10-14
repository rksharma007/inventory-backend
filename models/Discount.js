const mongoose = require('mongoose');

const DiscountSchema = new mongoose.Schema({
    store: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'store'
    },
    item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'item'
    },
    discount: {  // in percentage
        type: Number,
        required: true
    },
    description: {
        type: String,
    },
    active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = Discount = mongoose.model('discount', DiscountSchema);