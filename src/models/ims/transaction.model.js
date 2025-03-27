import mongoose, { Schema } from "mongoose";


// Define the PurchaseEntry Schema
const transactionSchema = new Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',  // Reference to the Item collection
    required: true,
  },
  invoiceNo: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  unitPrice: {
    type: Number,
    required: true,
  },
  taxableAmount: {
    type: Number,
    required: true,
  },
  taxAmount: {
    type: Number,
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  unit: {
    type: String,
    required: true,
    enum: ['jars', 'kg', 'litre', 'g', 'pcs'],
  },
  clientVendor: {
    type: String,
    required: true,
  },
  biltyNumber: {
    type: String,
    required: true,
  },
  remarks: {
    type: String,
    default: 'N/A'
  },
  documents: [{
    originalName: String,
    filename: String,
    path: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }, // Reference to the User collection
}, {
  timestamps: true,  // Automatically add createdAt and updatedAt fields
});

export const Purchase = mongoose.model('Purchase', transactionSchema)
export const Sales = mongoose.model('Sales', transactionSchema)
