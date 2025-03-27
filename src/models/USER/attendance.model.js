import mongoose, { Schema } from "mongoose";

const attendanceSchema = new Schema(
    {
        employeeId: {
            type: String,    // Use String if employeeId is a string
            ref: 'Employee', // Reference to the Employee collection
            required: true,
        },
        date: {
            type: Date,
            required: true,
            // unique: true, // Enforces a single record per day for each employee
        },
        status: {
            type: String,
            enum: ['Present', 'Absent', 'Late', 'Leave', 'Holiday'],
            required: true,
        },
        sessions: [
            {
                logInTime: {
                    type: Date,
                    default: null,
                },
                logOutTime: {
                    type: Date,
                    default: null,
                },
                workingHours: {
                    type: Number,
                    default: 0,
                },
                logoutUpdateRequest: {
                    isRequested: {
                        type: Boolean,
                        default: false,
                    },
                    requestedLogoutTime: {
                        type: Date,
                        // default: null,
                    },
                    reason: {
                        type: String,
                        // default: null,
                    },
                    status: {
                        type: String,
                        enum: ['Pending', 'Approved', 'Rejected'],
                        // default: 'Pending',
                    },
                    hrComment: {
                        type: String,
                        // default: null,
                    },
                },
            },
        ],
        leaveId: {
            // type:String,
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Leave', // References the Leave model
            default: null, // Null if not on leave
        },
        // attendanceRequest: {
        //     isRequested: { type: Boolean, default: false },
        //     reason: { type: String, default: null },
        //     date: { type: Date },
        //     requestedLogInTime: {
        //         type: Date,
        //         default: null,
        //     },
        //     requestedLogOutTime: {
        //         type: Date,
        //         default: null,
        //     },
        //     status: {
        //         type: String,
        //         enum: ['Pending', 'Approved', 'Rejected'],
        //         default: 'Pending',
        //     },
        // },
        isApproved: { type: Boolean, default: true }// Default approved

        // overtimeHours: {
        //     type: Number,
        //     default: 0,  // Store overtime hours if needed
        // },
        // comments: {
        //     type: String,
        //     default: null,  // Additional comments (optional)
        // },
    },
    {
        timestamps: true,  // Automatically includes createdAt and updatedAt fields
    }
);

export const Attendance = mongoose.model('Attendance', attendanceSchema);