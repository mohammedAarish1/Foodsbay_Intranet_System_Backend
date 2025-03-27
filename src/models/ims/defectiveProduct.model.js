import mongoose, { Schema } from "mongoose";

// Define the PurchaseEntry Schema
const defectiveProductSchema = new Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',  // Reference to the Item collection
    required: true,
  },
  salesReturnId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalesReturn',  // Reference to the Item collection
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  unit: {
    type: String,
    required: true,
    enum: ['jars', 'kg','litre','g','pcs'],
  },
  condition: {
    type: String,
    required: true,
  },
//   remarks: {
//     type: String,
//     default:'N/A',
//   },
//   documents: [{
//     originalName: String,
//     filename: String,
//     path: String,
//     uploadedAt: { type: Date, default: Date.now }
// }]
}, {
  timestamps: true,  // Automatically add createdAt and updatedAt fields
});

export const DefectiveProduct=mongoose.model('DefectiveProduct',defectiveProductSchema)
