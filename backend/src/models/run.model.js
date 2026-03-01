import mongoose, { Schema } from 'mongoose';

const runSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    repoUrl: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['running', 'done', 'error'],
        default: 'running',
    },
    stats: {
        totalScanned: { type: Number, default: 0 },
        successfulFixes: { type: Number, default: 0 },
        syntaxErrorsPrevented: { type: Number, default: 0 },
        totalCharsSaved: { type: Number, default: 0 },
    },
    errorMessage: { type: String, default: null },
    startedAt: { type: Date, default: Date.now },
    finishedAt: { type: Date, default: null },
}, { timestamps: true });

export const Run = mongoose.model('Run', runSchema);
