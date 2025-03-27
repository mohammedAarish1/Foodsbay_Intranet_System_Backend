import mongoose, { Schema } from "mongoose";
import bcrypt from 'bcryptjs';
import jwt from "jsonwebtoken";

const userSchema = new Schema({
    userName: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    phoneNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
    },
    department: {
        type: String,
        required: true,
    },
    avatar: {
        type: String,
        // default:"https://res.cloudinary.com/dqzjxwzjx/image/upload,
        // required:true,
    },
    refreshToken: {
        type: String,
    },
    role: {
        type: String,
        trim: true,
        // required:true,
    },
    accountStatus: {
        type: String,
        trim: true,
        default: 'active',
        enum: ['active', 'in active'],

    }

}, { timestamps: true })


// encrypting the password
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    this.password = await bcrypt.hash(this.password, 10);
    return next();
})

// decrypting and checking of the password
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
};

// generate the access token
userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

// generate the refresh token
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model('User', userSchema)