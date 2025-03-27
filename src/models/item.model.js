import mongoose, { Schema } from "mongoose";


const itemSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
  },
  inventoryType: {
    type: String,
    required: [true, 'Inventory type is required'],
    trim: true,
  },
  stockInHand: {
    type: Number,
    min: [0, 'Stock in hand cannot be less than 0'],
    default: 0
  },
  minStock: {
    type: Number,
    required: [true, 'Minimum stock is required'],
    min: [0, 'Minimum stock cannot be less than 0'],
  },
  status: {
    type: String,
    enum: ['In Stock', 'Out of Stock'],
    default: 'Out of Stock'
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    enum: ['jars', 'kg', 'litre', 'g', 'pcs', 'ml'],
  },
  // vendorName: {
  //   type: String,
  //   required: [true, 'Vendor name is required'],
  //   trim: true,
  // },
  hsnCode: {
    type: String,
    required: [true, 'HSN Code is required'],
    trim: true,
  },
  hsnDesc: {
    type: String,
    trim: true,
    default: 'N/A'
  },
  gstRate: {
    type: Number,
    required: [true, 'GST rate is required'],
    min: [0, 'GST rate cannot be negative'],
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }, // Reference to the User collection
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
});


export const Item = mongoose.model('Item', itemSchema)
