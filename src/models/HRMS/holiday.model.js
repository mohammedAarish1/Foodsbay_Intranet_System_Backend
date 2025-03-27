import mongoose,{Schema} from 'mongoose';

const holidaySchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  date: {
    type: Date,
    required: true,
  },
  type: {
    type: String,
    enum: ['Public', 'Festival', 'National', 'Other'],
    default: 'Public',
  },
  description: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active',
  },
//   applicableFor: {
//     type: [String], // could be departments, job roles, or leave policies
//     default: [],
//   },
  notes: {
    type: String,
    default: '',
  },
 
},{timestamps:true});

// Ensure the 'updatedAt' field is updated when the holiday details are modified
holidaySchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

export const Holiday = mongoose.model('Holiday', holidaySchema);

