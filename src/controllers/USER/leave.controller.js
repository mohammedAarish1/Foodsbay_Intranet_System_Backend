import { Leave } from "../../models/USER/leave.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { Employee } from "../../models/HRMS/employee.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { formatDate } from '../../utils/helper.js'
import { Attendance } from "../../models/USER/attendance.model.js";

// route for adding new leave request
const addLeaveRequest = asyncHandler(async (req, res) => {

    // 1. extract the data from body
    const { employeeId, leaveType, startDate, endDate, totalDays, reason } = req.body;
    console.log('leaveType', leaveType);
    // 2. check if the employee exists
    const employee = await Employee.findOne({ employeeId });

    // 3. if there's no employee return the error message
    if (!employee) {
        throw new ApiError(409, 'Employee not found')

    }

    // 4. check and return error  if the employee doesn't have the sufficient leave balance
    if (employee.leaves.balance < totalDays) {
        throw new ApiError(409, `Only ${employee.leaves.balance} days of leave available`)
    }

    // 5. if everything is okay create a leave document
    const leave = new Leave({
        employeeId,
        leaveType,
        startDate,
        endDate,
        totalDays,
        reason,
        status: 'pending'
    })

    // 6. save the leave document
    const savedLeave = await leave.save();


    // 7. Update the employee's leave balance by subtracting the totalDays from the balance
    employee.leaves.balance -= totalDays;
    await employee.save()

    // 8. handle marking attendance with staus as leave for all the leave days
    let leaveStartDate = new Date(startDate); 
    const LeaveEndDate = new Date(endDate);
    const attendanceRecords = [];

    // Loop through each day between startDate and endDate (inclusive)
    while (leaveStartDate <= LeaveEndDate) {
        attendanceRecords.push({
            employeeId,
            date: new Date(leaveStartDate),
            status: 'Leave',
            leaveId: savedLeave._id
        });

         // Move to the next day
        leaveStartDate.setDate(leaveStartDate.getDate() + 1);
    }

    // Insert all attendance records into the Attendance collection
    await Attendance.insertMany(attendanceRecords);
    console.log("Attendance records created successfully.");


    // 9. preparet the response data
    const responseData = {
        ...leave.toObject(),  // Convert the saved entry to a plain object
    };

    responseData.createdAt = formatDate(responseData.createdAt);
    responseData.updatedAt = formatDate(responseData.updatedAt);

    // 10. send response
    return res.status(200).json(
        new ApiResponse(200, responseData || {}, "Requested Submitted successfully", "Success")
    );
});


// get single user leave list
const getSingleUserLeaves = asyncHandler(async (req, res) => {
    const { id } = req.params;
    console.log('id', id)
    const leaveList = await Leave.find({ employeeId: id });
    // console.log(leaveList)


    const responseData = leaveList.map(entry => ({
        ...entry.toObject(),
        // basicInfo: { ...entry.basicInfo.toObject(), dob: formatDate(entry.basicInfo.dob) },
        startDate: formatDate(entry.startDate),
        endDate: formatDate(entry.endDate),
        createdAt: formatDate(entry.createdAt),  // Format createdAt
        updatedAt: formatDate(entry.updatedAt),  // Format updatedAt
        createdBy: entry.createdBy ? entry.createdBy.fullName : 'Unknown'  // Send the user's fullName as createdBy
    }));

    console.log('responseData', responseData)

    return res.status(200).json(
        // new ApiResponse(200, formattedItemList || [], "Item list fetched successfully", "Success")
        new ApiResponse(200, responseData || [], "leave list fetched successfully", "Success")
    );
})

const deleteLeaveRequest = asyncHandler(async (req, res) => {
    // 1. Extract the item ID from the URL parameters
    const { id } = req.params;

    // 2. Check if the item exists in the database
    const leaveRequest = await Leave.findById(id);

    // 3. If the item doesn't exist, return a 404 error
    if (!leaveRequest) {
        throw new ApiError(404, 'No leave found')
    }

    // 4. Delete the item from the database
    await Leave.findByIdAndDelete(id);

    // 5. Return a success response
    return res.status(200).json(
        new ApiResponse(200, { id }, "Request deleted successfully", "Success")
    );
})


export {
    addLeaveRequest,
    getSingleUserLeaves,
    deleteLeaveRequest,
}