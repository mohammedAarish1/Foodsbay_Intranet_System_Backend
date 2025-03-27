import mongoose, { Schema } from "mongoose"

// Create a schema for Complaints and Queries
const ticketSchema = new Schema({
    // Employee who raised the complaint/query
    employeeId: {
        type: String,    // Use String if employeeId is a string
        ref: 'Employee', // Reference to the Employee collection
        required: true,
    },
    // Type of the complaint or query (e.g., "Complaint" or "Query")
    type: {
        type: String,
        enum: ['Complaint', 'Query'],
        required: true
    },
    subject: {
        type: String,
        required: true,
    },

    // Description of the complaint or query
    description: {
        type: String,
        required: true,
        trim: true,
    },

    // Priority level of the complaint/query (e.g., "Low", "Medium", "High")
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium'
    },

    // Status of the complaint/query (e.g., "Pending", "Resolved", "In Progress")
    status: {
        type: String,
        enum: ['Open', 'Resolved', 'In Progress'],
        default: 'Open'
    },

    // Date when the complaint/query was submitted
    // submittedAt: {
    //     type: Date,
    //     default: Date.now
    // },
    // attachments: [
    //     { url: { type: String } }
    // ],
    // Date when the complaint/query was resolved (optional)
    resolvedAt: {
        type: Date
    },
    // Details about the resolution (if the complaint/query is resolved)
    response: {
        type: String,
        trim: true
    },
}, { timestamps: true });

// Create a model based on the schema
export const Ticket = mongoose.model('Ticket', ticketSchema);

