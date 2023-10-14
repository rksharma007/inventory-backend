const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
    store: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'store'
    },
    name: {
        type: String,
        required: true
    },
    code: {
        type: String,
        default: ''
    },
    description: {
        type: String,
    },
    itemcount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = Category = mongoose.model('category', CategorySchema);