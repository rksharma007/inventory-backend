const mongoose = require('mongoose');

const UnitSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
    }
}, {
    timestamps: true
});

module.exports = Unit = mongoose.model('unit', UnitSchema);