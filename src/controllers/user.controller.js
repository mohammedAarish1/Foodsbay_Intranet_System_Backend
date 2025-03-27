import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { User } from '../models/user.model.js';
import { generateTokens } from '../utils/helper.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

// for sending the cookie
const options = {
    httpOnly: true,
    // secure: process.env.NODE_ENV === 'production', // Only use secure in production
    sameSite: 'strict', // or 'lax' depending on your requirements
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days expiration
};




// ====================== user sign up =============================== //
const registerUser = asyncHandler(async (req, res) => {
    const { userName, fullName, email, phoneNumber, password, department } = req.body;
    if ([userName, email, fullName, phoneNumber, password, department].some((field) => field.trim() === '')) {
        return new ApiError(400, 'All Fields are required')
    }

    // check if user already exists
    const existingUser = await User.findOne({
        $or: [{ userName }, { email }, { phoneNumber }]
    });

    if (existingUser) {
        return new ApiError(409, 'User with same username, email or phoneNumber already exists')
    }

    const user = await User.create({
        userName,
        fullName,
        email,
        phoneNumber,
        password,
        department,
    })

    if (!user) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }
    return res.status(201).json(
        new ApiResponse(200, {}, "User registered Successfully", "Success")
    )
})

// ====================== user log in =============================== //
const loginUser = asyncHandler(async (req, res) => {
    const { userId, password } = req.body;
    if (!userId) {
        throw new ApiError(400, 'user Id is required') 
    }

    // 1. find user
    const user = await User.findOne({ userName })

    if (!user) {
        return res.status(401).json({message:'Invalid username'})
    }
    // console.log('test')

    // 2. check password
    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        return res.status(401).json({message:'Invalid password'})

    }

    // 3. generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);
    // console.log('refreshToken', refreshToken)
    // console.log('accessToken', accessToken)

    user.refreshToken = refreshToken
    await user.save()
    // 4. get user excluding password and refreshToken
    // console.log('user token', user.refreshToken)
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")


    return res
        .status(200)
        .cookie('accessToken', accessToken, options)
        .cookie('refreshToken', refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken: accessToken,
                    // refreshToken: refreshToken // optional to send this
                },
                'User logged in successfully'
            )
        )

});


// ====================== user log out =============================== //
const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: { refreshToken: '' },
        },
        {
            new: true,
        }
    )


    return res
        .status(200)
        .clearCookie('accessToken', options)
        .clearCookie('refreshToken', options)
        .json(new ApiResponse(200, {}, "User Logged out"))
})


// token refresh endpoint ===============
const refreshToken = asyncHandler(async (req, res) => {
    try {
        const { refreshToken } = req.cookies;
        // console.log('refreshToken',refreshToken)
        if (!refreshToken) {
            return res.status(401).json({ message: "Refresh token not found" });
        }

        // Verify refresh token
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

        const user = await User.findById(decoded._id);
        // Find user and check if refresh token matches

        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        if (refreshToken !== user.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used");
        }
        // console.log('userwwwww', user)
        // Generate new tokens
        const tokens = generateTokens(user._id);

        // Update refresh token in database
        user.refreshToken = tokens.refreshToken;
        await user.save();

        // prepare the user data object
        const userData = {
            id: user._id,
            userName: user.userName,
            email: user.email,
            fullName: user.fullName,
            phoneNumber: user.fullName
        }

        return res
            .status(200)
            .cookie("accessToken", tokens.accessToken, options)
            .cookie("refreshToken", tokens.refreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        user:userData,
                        accessToken: tokens.accessToken,
                    },
                    "Access token refreshed"
                )
            )
    } catch (error) {
        res.status(401).json({ message: "Invalid refresh token" });
    }
});


// const verifyToken = asyncHandler(async (req, res) => {
//     try {
//         // Generate new tokens if needed
//         const { accessToken } = await generateTokens(req.user._id);
//         console.log('user', req.user)
//         return res
//             .status(200)
//             .json(
//                 new ApiResponse(200,
//                     {
//                         user: req.user,
//                         accessToken
//                     },
//                     'Token verified successfully')
//             );
//     } catch (error) {
//         throw new ApiError(401, 'Authentication failed');
//     }
// })

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshToken
    // refreshAccessToken,
    // verifyToken
}