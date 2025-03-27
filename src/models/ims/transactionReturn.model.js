import mongoose, { Schema } from "mongoose";

// Define the PurchaseEntry Schema
const transactionReturnSchema = new Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',  // Reference to the Item collection
    required: true,
  },
  invoiceNo: {
    type: String,
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
  quantity: {
    type: Number,
    required: true,
  },
  unit: {
    type: String,
    required: true,
    enum: ['jars', 'kg', 'litre', 'g','pcs','ml'],
  },
  clientVendor: {
    type: String,
    required: true,
  },
  creditNoteNo: {
    type: String,
    required: function () {
      // creditNoteNo is required only for Sales Returns (when no debitNoteNo is provided)
      return !this.debitNoteNo;
    },
  },
  debitNoteNo: {
    type: String,
    required: function () {
      // debitNoteNo is required only for Purchase Returns (when no creditNoteNo is provided)
      return !this.creditNoteNo;
    },
  },
  condition: {
    type: String,
    required: function(){
      return  !this.debitNoteNo;
    },
  },
  remarks: {
    type: String,
    default: 'N/A',
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
  },
}, {
  timestamps: true,  // Automatically add createdAt and updatedAt fields
});

export const SalesReturn = mongoose.model('SalesReturn', transactionReturnSchema)
export const PurchaseReturn = mongoose.model('PurchaseReturn', transactionReturnSchema)
