
import mongoose, { Schema } from 'mongoose';

// Define the schema for individual performance review details (evaluator, rating, reviewDate)
// const performanceReviewDetailSchema = new Schema({
//     rating: {
//         type: Number,
//         required: true,
//         min: 0.5,
//         max: 5,
//     },
//     evaluator: {
//         type: String, // Reference to Employee model
//         ref: 'Employee',
//         required: true,

//     },
//     reviewDate: {
//         type: Date,
//         required: true,
//     },
//     comments: {
//         type: String,
//         default: '',
//     },
// }); // We don't need individual _id for these nested documents


const performanceReviewDetailSchema = new Schema({
    evaluator: {
        type: String, // Reference to Employee model
        ref: 'Employee',
        required: true,

    },
    reviewDate: {
        type: Date,
        required: true,
    },

    review: [{
        param: {
            type: String,
            required: true,
        },
        rating: {
            type: Number,
            required: true,
            min: 0.5,
            max: 5,
        },
        comment: {
            type: String,
            default: '',
        },
    }]
}); // We don't need individual _id for these nested documents

// Main Performance Review schema
const performanceSchema = new Schema(
    {
        employeeId: {
            type: String, // Reference to Employee model
            ref: 'Employee',
            required: true,
        },
        month: {
            type: String,
            required: true,
            // A composite unique index to ensure an employee has only one review per month
            unique: true,
        },
        // performance: {
        //     // Generic performance fields using the same structure
        //     // The key can be dynamic for scalability (e.g., adding new parameters)
        //     awareness: [performanceReviewDetailSchema],
        //     responsiveness: [performanceReviewDetailSchema],
        //     punctuality: [performanceReviewDetailSchema],
        //     behavior: [performanceReviewDetailSchema],
        //     discipline: [performanceReviewDetailSchema],
        // },
        performance:[performanceReviewDetailSchema],

    },
    { timestamps: true } // Adds createdAt and updatedAt fields
);

// Create a composite unique index to ensure one review per employee per month
// performanceReviewSchema.index({ employeeId: 1, month: 1 }, { unique: true });

export const Performance = mongoose.model('Performance', performanceSchema);

