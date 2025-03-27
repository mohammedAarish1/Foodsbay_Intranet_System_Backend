import mongoose, { Schema } from "mongoose";

const leaveSchema = new Schema({
    employeeId: {
        type: String,    // Use String if employeeId is a string
        ref: 'Employee', // Reference to the Employee collection
        required: true,
    },
    leaveType: {
        type: String,
        required: true,

    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    totalDays: {
        type: Number,
        required: true,
    },
    reason: {
        type: String,
        // required:true,
    },
    status: {
        type: String,
        required: true,
        enum: ['rejected', 'approved', 'pending'],
        default: 'pending'
    },
    comment: {
        type: String,
        default: ''
    }
    // acknowledgment:{
    //     type:Boolean,
    //     default:false
    // }
}, { timestamps: true })


export const Leave = mongoose.model('Leave', leaveSchema);