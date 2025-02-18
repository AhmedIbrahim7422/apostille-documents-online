const mongoose = require("mongoose")

const Schema = mongoose.Schema

const orderSchema = new Schema({

    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    country: String,
    documents: Array,
    files: Array,

    shipping: {
        shipType: { type: String, required: true },
        shipFileName: {type: String},
        shipData: {
            name: String,
            companyName: String,
            address: String,
            city: String,
            state: String,
            zipcode: String,
            phone: String,
            country: String,
        } 
    }
})

module.exports = mongoose.model("Order", orderSchema)