const mongoose = require('mongoose');
require('dotenv').config();
const db = process.env.MONGOURI;

const connectDB = async () => {
    try{
        await mongoose.connect(db,{
            useNewUrlParser : true,
        });

        console.log('MongoDB Connected.....');
    } catch(err){
        console.error(err.message);
        process.exit(1); //Exit process with failure
    }
}

module.exports = connectDB;