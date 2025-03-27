import { Attendance } from "../../models/USER/attendance.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { calculateTotalHours, formatDate } from "../../utils/helper.js";
import { data } from '../../attendance_data.js'
import mongoose from "mongoose";

// get single user leave list
const getSingleUserAttendance = asyncHandler(async (req, res) => {
    const { id } = req.params;
    console.log('id', id)
    const attendanceList = await Attendance.find({ employeeId: id });
    console.log(attendanceList)


    const responseData = attendanceList.map(entry => ({
        ...entry.toObject(),
        // basicInfo: { ...entry.basicInfo.toObject(), dob: formatDate(entry.basicInfo.dob) },
        date: formatDate(entry.date, 'date'),
        sessions: entry.sessions.map(session => {
            return {
                ...session.toObject(),
                // _id: session._id,
                // workingHours: session.workingHours,
                logInTime: formatDate(session.logInTime, 'time'),
                logOutTime: formatDate(session.logOutTime, 'time'),
            }
        }),
    }));

    console.log('responseData', responseData)

    return res.status(200).json(
        // new ApiResponse(200, formattedItemList || [], "Item list fetched successfully", "Success")
        new ApiResponse(200, attendanceList || [], "attendance list fetched successfully", "Success")
    );
})



// handle user's request for log out update
const handleLogoutRequest = asyncHandler(async (req, res) => {
    const _id = req.params.id;
    const { sessionId, updatedLogoutTime, date } = req.body;

    const attendance = await Attendance.findById(_id)

    if (!attendance) {
        throw new ApiError(404, 'Attendance not found')
    }
    // Find the session within the 'sessions' array by sessionId
    const sessionIndex = attendance.sessions.findIndex(session => session._id.toString() === sessionId);
    console.log('sessionIndex', sessionIndex)

    if (sessionIndex === -1) {
        throw new ApiError(404, 'log in Session not found')
    }


    const [hour, minute] = updatedLogoutTime.split(':'); // Split to get hour and minute

    // Create a date object by combining the date and time (defaulting to midnight for date)
    const logOutTime = new Date(attendance.date);
    logOutTime.setHours(hour);
    logOutTime.setMinutes(minute);
    logOutTime.setSeconds(0);  // Set seconds to 0 if you don't need them



    const logoutRequest = {
        isRequested: true,
        requestedLogoutTime: logOutTime,
        status: 'Pending'
    }

    attendance.sessions[sessionIndex].logoutUpdateRequest = logoutRequest


    // Update the logOutTime of the found session

    // Save the updated attendance document
    const updatedAttendance = await attendance.save();
    const logInTime = updatedAttendance.sessions[sessionIndex].logInTime
    updatedAttendance.sessions[sessionIndex].logInTime = formatDate(logInTime, 'time')

    const responseData = {
        ...updatedAttendance.toObject(),
        date: formatDate(updatedAttendance.date, 'date'),
        sessions: updatedAttendance.sessions.map(session => (
            { ...session.toObject(), logInTime: formatDate(session.logInTime, 'time') }
        )),  // Format createdAt
    };

    console.log('responsedata', responseData)

    console.log('updatedAttendance', responseData)
    return res.status(200).json(
        new ApiResponse(200, responseData, "Submitted successfully", "Success")
    );

})


const handleAttendanceRequest = asyncHandler(async (req, res) => {
    console.log('dataaa',req.body.formData)
    const { employeeId, date, requestedLogInTime, requestedLogOutTime } = req.body.formData;
    console.log('date', date)
    console.log('employeeId', employeeId)
    const attendanceDate = new Date(date)
    const [loginHour, loginMinute] = requestedLogInTime.split(':'); // Split to get hour and minute
    const [logoutHour, logoutMinute] = requestedLogOutTime.split(':'); // Split to get hour and minute

    const logInTime = new Date(date);
    logInTime.setHours(loginHour);
    logInTime.setMinutes(loginMinute);
    logInTime.setSeconds(0);  // Set seconds to 0 if you don't need them


    const logOutTime = new Date(date);
    logOutTime.setHours(logoutHour);
    logOutTime.setMinutes(logoutMinute);
    logOutTime.setSeconds(0);  // Set seconds to 0 if you don't need them

    const attendance = new Attendance({
        employeeId,
        date: attendanceDate,
        status: 'Present',
        sessions: [
            {
                logInTime,
                logOutTime,
                workingHours: calculateTotalHours(logInTime, logOutTime)
            }],
        isApproved: false
    })

    const responseData = await attendance.save()

    return res.status(200).json(
        new ApiResponse(200, responseData, "Requested successfully", "Success")
    );
})

export {
    getSingleUserAttendance,
    handleLogoutRequest,
    handleAttendanceRequest
}