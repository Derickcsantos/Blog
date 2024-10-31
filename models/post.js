const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    content: { type: String, required: true },
    media: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);
