import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { Counter } from '../USER/counter.model.js';
// Enum for employee status
const statusEnum = ['Active', 'Inactive', 'On-Leave', 'Terminated'];

const addressSchema = new Schema({
    mainAddress: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true }, 
    country: { type: String, default:'India' },
});

const bankDetailsSchema = new Schema({
    accountNumber: { type: String, required: true, },
    bankName: { type: String, required: true, },
    ifscCode: { type: String, required: true, },
});

const leavesSchema=new Schema({
    total: {
        type: Number,
        default: 12,
    },
    balance: {
        type: Number,
        default: 12,
    },
})

const basicInfoSchema = new Schema({
    firstName: {
        type: String,
        required: true,
        trim: true,
    },
    lastName: {
        type: String,
        trim: true,
    },
    dob: {
        type: Date,
        required: true,
    },
    email: {
        type: String,
        required: true,
        // unique: true,
        lowercase: true,
        trim: true
    },
    phoneNumber: {
        type: String,
        required: true,
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        required: true,
    },
})

const emergencyContactSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    phoneNumber: {
        type: String,
        required: true,
    },
    relation: {
        type: String,
        required: true,
    },
})

const workDetailsSchema=new Schema({
    hireDate: {
        type: Date,
        required: true,
    },
    department: {
        type: String,
        required: true,
    },
    jobTitle: {
        type: String,
        required: true,
    },
    salary: {
        type: Number,
        required: true,
        trim: true
    },
    workLocation: {
        type: String,
        required: true,
    },
    // managerId: {
    //     type: Schema.Types.ObjectId,
    //     ref: 'Employee', // Referencing other employees (managers)
    // },
})

const employeeSchema = new Schema({
    // employeeId: {
    //     type: String,
    //     unique: true,
    //     required: true,
    // },
    employeeId: {
        type: String,
        unique: true,
        // Remove required: true from here
        // We'll handle validation in a custom validator
        validate: {
            validator: function(v) {
                // If the document is new, don't validate employeeId
                // as it will be generated in the pre-save hook
                if (this.isNew) {
                    return true;
                }
                // For existing documents, employeeId should exist
                return !!v;
            },
            message: 'Employee ID is required for existing employees'
        }
    },
    basicInfo: {
        type: basicInfoSchema,
        required: true
    },
    address: {
        type: addressSchema,
        required: true
    },
    workDetails:{
         type: workDetailsSchema,
         required: true
         },
    status: {
        type: String,
        enum: statusEnum,
        default: 'Active',
    },
    bankDetails: {
        type: bankDetailsSchema,
        required: true
    },
    leaves:{
        type:leavesSchema,
    },
    attendanceHistory: [
        {
            date: {
                type: Date,
                // required: true,
            },
            status: {
                type: String,
                enum: ['present', 'absent', 'half-day'],
                // required: true,
            },
        },
    ],
    emergencyContact: {
        type: emergencyContactSchema,
        required: true
    },
    documents: [
        {
            documentType: {
                type: String,
                required: true,
            },
            documentUrl: {
                type: String,
                required: true,
            },
        },
    ],
    profilePicture: {
        type: String,
        default:null
    },
    password: {
         type: String,
          required: true
         },
    passwordStatus: {
            isTemporary: {
                type: Boolean,
                default: true
            },
            lastChanged: {
                type: Date,
                default: null
            }
        },
        refreshToken: {
            type: String,
        },
},{timestamps:true});


employeeSchema.pre('save', async function(next) {
    try {
        if (this.isModified('password') || this.isNew) {
            // const salt = await bcrypt.genSalt(10);
            // this.password = await bcrypt.hash(this.password, salt);
            if (!this.passwordStatus?.isTemporary) {
                const salt = await bcrypt.genSalt(10);
                this.password = await bcrypt.hash(this.password, salt);
            }

        }

        if (this.isNew) {
            // Get the counter document
            const counter = await Counter.findOneAndUpdate(
                { name: 'employeeId' },
                { $inc: { value: 1 } },
                { new: true, upsert: true }
            );

            // Generate the new employee ID
            this.employeeId = `EMP-${String(counter.value).padStart(2, '0')}`;
        }

        next();
    } catch (error) {
        next(error);
    }
});

// Added a post-save hook to ensure employeeId exists
employeeSchema.post('save', function(error, doc, next) {
    if (error.name === 'ValidationError' && error.errors.employeeId) {
        next(new Error('Failed to generate employee ID'));
    } else {
        next(error);
    }
});


// decrypting and checking of the password
employeeSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
};



export const Employee = mongoose.model('Employee', employeeSchema);
 




// import mongoose, { Schema } from 'mongoose';
// import bcrypt from 'bcryptjs';

// // Enum for employee status
// const statusEnum = ['active', 'inactive', 'on-leave', 'terminated'];

// // Address Schema
// const addSchema = new Schema({
//   mainAdd: { type: String, required: true, trim: true },
//   city: { type: String, required: true, trim: true },
//   state: { type: String, required: true, trim: true },
//   country: { type: String, required: true, trim: true },
//   pincode: { type: String, required: true, trim: true },
// });

// // Bank Details Schema (encrypted)
// const bankDetailsSchema = new Schema({
//   accountNumber: { type: String, required: true },
//   bankName: { type: String, required: true },
//   ifscCode: { type: String, required: true },
// }, { _id: false });

// // Basic Info Schema
// const basicInfoSchema = new Schema({
//   firstName: { type: String, required: true, trim: true },
//   lastName: { type: String, trim: true },
//   dob: { type: Date, required: true },
//   email: { type: String, required: true, lowercase: true, trim: true },
//   phoneNumber: { type: String, required: true, trim: true },
//   gender: { type: String, enum: ['male', 'female', 'other'], required: true },
// });

// // Emergency Contact Schema
// const emergencyContactSchema = new Schema({
//   name: { type: String, required: true },
//   phoneNumber: { type: String, required: true },
//   relation: { type: String, required: true },
// }, { _id: false });

// // Performance Reviews Schema
// const performanceReviewSchema = new Schema({
//   date: { type: Date, required: true },
//   rating: { type: Number, required: true },
//   comments: { type: String },
// }, { _id: false });

// // Employee Schema
// const employeeSchema = new Schema({
//   basicInfo: { type: basicInfoSchema, required: true },
//   address: { type: addSchema, required: true },
//   employeeId: { type: String, unique: true, required: true, trim: true },
//   hireDate: { type: Date, required: true },
//   department: { type: String, required: true },
//   jobTitle: { type: String, required: true },
//   managerId: { type: Schema.Types.ObjectId, ref: 'Employee' },
//   status: { type: String, enum: statusEnum, default: 'active' },
//   salary: { type: Number, required: true },
//   workLocation: { type: String, required: true },
//   bankDetails: { type: bankDetailsSchema, required: true },
//   totalLeaves: { type: Number, default: 0 },
//   leaveBalance: { type: Number, default: 0 },
//   attendanceHistory: [
//     {
//       date: { type: Date, required: true },
//       status: { type: String, enum: ['present', 'absent', 'half-day'], required: true },
//     }
//   ],
//   emergencyContact: { type: emergencyContactSchema, required: true },
//   performanceReviews: [performanceReviewSchema],
//   documents: [
//     {
//       documentType: { type: String, required: true },
//       documentUrl: { type: String, required: true },
//     }
//   ],
//   profilePicture: { type: String },
//   totalSessionTime: { type: Number, default: 0 }, // For tracking total time spent
//   performanceData: {
//     totalWorkSessions: { type: Number, default: 0 },
//     averageSessionDuration: { type: Number, default: 0 },
//   },
//   createdAt: { type: Date, default: Date.now },
//   updatedAt: { type: Date, default: Date.now },
//   modifiedBy: { type: Schema.Types.ObjectId, ref: 'Employee' }, // Tracks who made the last update
// }, { timestamps: true });

// // Pre-save hook to handle encryption of sensitive data
// employeeSchema.pre('save', async function(next) {
//   const employee = this;
  
//   // Encrypt bank details before saving
//   if (employee.isModified('bankDetails')) {
//     employee.bankDetails.accountNumber = await bcrypt.hash(employee.bankDetails.accountNumber, 10);
//     employee.bankDetails.ifscCode = await bcrypt.hash(employee.bankDetails.ifscCode, 10);
//   }
  
//   next();
// });

// // Indexes for performance improvement
// employeeSchema.index({ employeeId: 1 });
// employeeSchema.index({ email: 1 });
// employeeSchema.index({ status: 1 });

// // Method to compare encrypted bank details
// employeeSchema.methods.compareBankDetails = async function(accountNumber, ifscCode) {
//   const employee = this;
  
//   const isAccountNumberMatch = await bcrypt.compare(accountNumber, employee.bankDetails.accountNumber);
//   const isIfscCodeMatch = await bcrypt.compare(ifscCode, employee.bankDetails.ifscCode);
  
//   return isAccountNumberMatch && isIfscCodeMatch;
// };

// export const Employee = mongoose.model('Employee', employeeSchema);
