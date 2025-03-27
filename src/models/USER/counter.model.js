import mongoose, { Schema } from 'mongoose';

// Counter schema for employeeId tracking
const counterSchema = new Schema({
  name: { type: String, required: true, unique: true },
  value: { type: Number, required: true,default: 0 },
}, { timestamps: true });

const Counter = mongoose.model('Counter', counterSchema);

export { Counter };
