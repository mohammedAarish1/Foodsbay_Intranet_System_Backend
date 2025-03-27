import { Employee } from "../models/HRMS/employee.model.js";
import { Attendance } from "../models/USER/attendance.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { calculateTotalHours, generateTokens } from "../utils/helper.js";
import jwt from 'jsonwebtoken';
import { Leave } from '../models/USER/leave.model.js'




// helper function to convert the working hours in to hours and minutes
const convertToHoursMinutes = (decimalHours) => {
    // Calculate hours
    const hours = Math.floor(decimalHours);

    // Calculate minutes (from decimal part)
    const minutes = Math.round((decimalHours - hours) * 60);

    // Format the string to display
    return `${hours} hours ${minutes} minutes`;
}

// for sending the cookie
const options = {
    httpOnly: true,
    // secure: process.env.NODE_ENV === 'production', // Only use secure in production
    sameSite: 'strict', // or 'lax' depending on your requirements
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days expiration
};

const UserLogin = asyncHandler(async (req, res) => {
    const { userId, password } = req.body;
    if (!userId) {
        throw new ApiError(400, 'user Id is required')
    }

    // 1. find user 
    const user = await Employee.findOne({ employeeId: userId })
    if (!user) {
        throw new ApiError(404, 'User not found')
    }
    // console.log('test')
    if (user.passwordStatus.isTemporary) {
        if (user.password === password) {
            console.log('hhahaah')
            return res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        {
                            isTemporary: user.passwordStatus.isTemporary
                            // refreshToken: refreshToken // optional to send this
                        },
                        'Temporary password, redirect to change password'
                    )
                )
        }
    }

    // 2. check password
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, 'Invalid password')

    }

    // 3. generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);
    // console.log('refreshToken', refreshToken)
    // console.log('accessToken', accessToken)

    user.refreshToken = refreshToken
    await user.save();


    // Get the current time in IST (India Standard Time)
    //  const ISTOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
    //  const currentTimeIST = new Date(new Date().getTime() + ISTOffset);

    // 4. Track checkInTime (attendance)
    const currentDate = new Date(); // Get today's date in YYYY-MM-DD format
    currentDate.setUTCHours(0, 0, 0, 0)
    const previousDate = new Date(currentDate); // Get today's date in YYYY-MM-DD format
    previousDate.setDate(currentDate.getDate() - 1)

    const lastAttendance = await Attendance.findOne({ employeeId: userId })
        .sort({ date: -1 })
        .limit(1);
        
        const lastAttendanceDate = lastAttendance?.date || null
        console.log('lastAttendanceDate', lastAttendanceDate)
        console.log('previousDate', previousDate)

    if (lastAttendance && lastAttendanceDate !== previousDate) {
        //  const previousDay = absentStartDate.getDay()
        // check if the day is sunday (0 for sunday) or holiday

        let absentStartDate = new Date(lastAttendanceDate); // Create a new date object
        absentStartDate.setDate(absentStartDate.getDate() + 1)
        const absentEndDate = new Date(previousDate);
        const attendanceRecords = [];

        // Loop through each day between startDate and endDate (inclusive)
        while (absentStartDate <= absentEndDate) {
            attendanceRecords.push({
                employeeId: userId,
                date: new Date(absentStartDate),
                status: 'Absent',
            });

            // // Move to the next day
            absentStartDate.setDate(absentStartDate.getDate() + 1);
        }

        // Insert all attendance records into the Attendance collection
        await Attendance.insertMany(attendanceRecords);
    }

    // const previousDayattendance = await Attendance.findOne({ date: previousDate })
    // if (!previousDayattendance) {

    //     // // check if the user is on leave
    //     // const leave = await Leave.findOne({
    //     //     $or: [
    //     //         { startDate: previousDate },
    //     //         { endDate: previousDate },
    //     //         {
    //     //             $and: [
    //     //                 { startDate: { $lte: previousDate } },
    //     //                 { endDate: { $gte: previousDate } }
    //     //             ]
    //     //         }
    //     //     ]
    //     // });
    //     // if (leave) {
    //     //     const { _id, employeeId, startDate, endDate } = leave;

    //     //     let leaveStartDate = new Date(startDate); // Create a new date object
    //     //     const LeaveEndDate = new Date(endDate);
    //     //     const attendanceRecords = [];

    //     //     // Loop through each day between startDate and endDate (inclusive)
    //     //     while (leaveStartDate <= LeaveEndDate && leaveStartDate < currentDate) {
    //     //         attendanceRecords.push({
    //     //             employeeId: employeeId,
    //     //             date: new Date(leaveStartDate),
    //     //             status: 'Leave',
    //     //             leaveId: _id
    //     //         });

    //     //         // // Move to the next day
    //     //         leaveStartDate.setDate(leaveStartDate.getDate() + 1);
    //     //     }

    //     //     // Insert all attendance records into the Attendance collection
    //     //     await Attendance.insertMany(attendanceRecords);
    //     //     console.log("Attendance records created successfully.");
    //     // }


    //     // const previousDay = previousDate.getDay()
    //     // // check if the day is sunday (0 for sunday) or holiday
    //     // if (previousDay !== 1) {
    //     //     await Attendance.create({
    //     //         employeeId: userId,
    //     //         date: previousDate,
    //     //         status: 'Absent',
    //     //     });
    //     // }
    // }

    // check if the user has already logged in today
    let attendance = await Attendance.findOne({
        employeeId: userId,
        date: currentDate,
    });


    if (!attendance) {
        // If attendance record does not exist for today, create a new one
        attendance = new Attendance({
            employeeId: userId,
            date: currentDate,
            status: 'Present', // You can change this based on business logic
            sessions: [{ logInTime: new Date() }], // Track the current time as checkInTime
        });
    } else {
        // If attendance record exists and there's no sessions recoreded, just update the checkInTime
        if (attendance.sessions.length === 0) {
            attendance.sessions.push({ logInTime: new Date() });
        } else {
            attendance.sessions = [...attendance.sessions, { logInTime: new Date() }]
        }
    }

    await attendance.save();

    // 4. get user excluding password and refreshToken
    // console.log('user token', user.refreshToken)
    const loggedInUser = await Employee.findById(user._id).select("-password -refreshToken")


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
const userLogout = asyncHandler(async (req, res) => {

    const userId = req.user._id;  // Get the logged-in user's ID
    // Create start and end of today for date comparison
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0); // Start of the day
    // Find attendance record for today
    const attendance = await Attendance.findOne({
        date,
        employeeId: req.user.employeeId,
    });

    if (attendance && attendance.sessions.length !== 0 && attendance.date === date) {
        // Update the checkOutTime
        attendance.sessions.forEach(session => {
            if (session.logInTime && session.logOutTime === null && session.workingHours === 0) {
                session.logOutTime = new Date();
                session.workingHours = calculateTotalHours(session.logInTime, session.logOutTime);
            }
        })

        await attendance.save();
    }

    await Employee.findByIdAndUpdate(
        userId,
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


// =========================== handle the employee password change =============================
const handlePasswordChange = asyncHandler(async (req, res) => {
    const { userId, oldPassword, newPassword, confirmPassword } = req.body;


    if (!oldPassword || !newPassword || !confirmPassword) {
        throw new ApiError(404, 'Please provide all the passwords')
    }

    let user;

    // Case 1: User has a temporary password (no userId provided)
    if (!userId) {
        // 1. Find user by temporary password
        user = await Employee.findOne({ password: oldPassword });
        if (!user) {
            throw new ApiError(400, 'Password is incorrect')
        }
        const { accessToken, refreshToken } = generateTokens(user._id);
        user.passwordStatus.isTemporary = false;
        user.passwordStatus.lastChanged = new Date();
        user.password = newPassword;
        user.refreshToken = refreshToken
        await user.save();
        const loggedInUser = await Employee.findById(user._id).select("-password -refreshToken")


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
                    'Password changed successfully'
                )
            )

    }
    // Case 2: User is an existing user (has userId)
    else {
        // 2. Find user by userId
        user = await Employee.findById(userId);
        if (!user) {
            throw new ApiError(404, 'User not found')
        }

        // 3. Verify the old password for full users
        // const isOldPasswordCorrect = await bcrypt.compare(oldPassword, user.password);
        const isOldPasswordCorrect = await user.isPasswordCorrect(oldPassword);
        if (!isOldPasswordCorrect) {
            throw new ApiError(400, 'Old password is incorrect')
        }

        user.password = newPassword;
        await user.save();

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    {},
                    'Password changed successfully'
                )
            )
    }

}

)


// ====================================== token refresh endpoint ===============
const refreshToken = asyncHandler(async (req, res) => {
    try {
        const { refreshToken } = req.cookies;
        // console.log('refreshToken',refreshToken)
        if (!refreshToken) {
            return res.status(401).json({ message: "Refresh token not found" });
        }

        // Verify refresh token
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        console.log('decoded', decoded)
        const user = await Employee.findById(decoded._id);
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
        // const userData = {
        //     id: user._id,
        //     userName: user.userName,
        //     email: user.email,
        //     fullName: user.fullName,
        //     phoneNumber: user.fullName
        // }

        const refreshedUser = await Employee.findById(user._id).select("-password -refreshToken")

        return res
            .status(200)
            .cookie("accessToken", tokens.accessToken, options)
            .cookie("refreshToken", tokens.refreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        user: refreshedUser,
                        accessToken: tokens.accessToken,
                    },
                    "Access token refreshed"
                )
            )
    } catch (error) {
        res.status(401).json({ message: "Invalid refresh token" });
    }
});


export {
    UserLogin,
    handlePasswordChange,
    userLogout,
    refreshToken
}