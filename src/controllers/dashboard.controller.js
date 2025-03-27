import { Employee } from "../models/HRMS/employee.model.js";
import { Holiday } from "../models/HRMS/holiday.model.js";
import { Attendance } from "../models/USER/attendance.model.js";
import { Leave } from "../models/USER/leave.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";



const statsData = [
    {
        title: 'Total Employees',
        value: '248',
        desc: ``,
        bgColor: ['#1976d2', '#2196f3']
    },
    {
        title: 'Active Employees',
        value: '37',
        desc: '',
        bgColor: ['#6a1b9a', '#8e24aa']
    },
    {
        title: 'Inactive Employees',
        value: '23',
        desc: '',
        bgColor: ['#ff5722', '#ff9800']
    },
    {
        title: 'New Employees',
        value: '02',
        desc: '',
        bgColor: ['#2e7d32', '#4caf50']
    },

]




const attendanceData = [
    { time: '9 AM', count: 180 },
    { time: '10 AM', count: 210 },
    { time: '11 AM', count: 225 },
    { time: '12 PM', count: 223 },
    { time: '1 PM', count: 220 },
    { time: '2 PM', count: 218 }
];

const employeesOnLeave = [
    { name: 'Alice Johnson', department: 'Marketing', reason: 'Vacation', days: 5 },
    { name: 'Bob Smith', department: 'IT', reason: 'Sick Leave', days: 2 },
    { name: 'Carol White', department: 'Sales', reason: 'Personal', days: 1 }
];

const pendingApprovals = [
    { type: 'Leave Request', count: 5, employee: 'John Doe', department: 'Production', urgent: true },
    { type: 'Half Day', count: 3, employee: 'Jane Smith', department: 'Quality', urgent: false },
    { type: 'WFH Request', count: 2, employee: 'Mike Johnson', department: 'Sales', urgent: true }
];

const celebrations = [
    { type: 'Birthday', name: 'Sarah Wilson', date: 'Today', department: 'Marketing', profilePicture: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTmI57giWxjA-WXBTE7HIzLV0Y9YcEnxIyrCQ&s', daysUntil: 3 },
    { type: 'Holiday', name: 'Company Day', date: 'Next Monday', department: 'All', profilePicture: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTmI57giWxjA-WXBTE7HIzLV0Y9YcEnxIyrCQ&s', daysUntil: 3 }
];

const pendingCompliance = [
    { type: 'Document Verification', count: 8, employee: 'John Doe', department: 'Production', urgent: true },
    { type: 'Policy Updates', count: 3, employee: 'John Doe', department: 'Production', urgent: false },
    { type: 'Training Completion', count: 12, employee: 'John Doe', department: 'Production', urgent: true }
];


// Helper function to calculate the number of new employees (hired in the last 30 days)
const calculateNewEmployees = async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newEmployees = await Employee.find({
        'workDetails.hireDate': { $gte: thirtyDaysAgo },
    });

    return newEmployees.length;
};

const getStatsData = async () => {
    try {
        // Total Employees
        const totalEmployees = await Employee.countDocuments();

        // Active Employees
        const activeEmployees = await Employee.countDocuments({ status: 'Active' });

        // Inactive Employees
        const inactiveEmployees = await Employee.countDocuments({ status: 'Inactive' });

        // New Employees (hired in the last 30 days)
        const newEmployees = await calculateNewEmployees();
        // Send response

        const statsData = [
            {
                title: 'Total Employees',
                value: totalEmployees,
                desc: ``,
                bgColor: ['#1976d2', '#2196f3']
            },
            {
                title: 'Active Employees',
                value: activeEmployees,
                desc: '',
                bgColor: ['#6a1b9a', '#8e24aa']
            },
            {
                title: 'Inactive Employees',
                value: inactiveEmployees,
                desc: '',
                bgColor: ['#ff5722', '#ff9800']
            },
            {
                title: 'New Employees',
                value: newEmployees,
                desc: '',
                bgColor: ['#2e7d32', '#4caf50']
            },
        ]

        return statsData;
    } catch (error) {
        console.error(error);
    }
}

// function for celbrations data
const getCelebrations = async () => {
    try {
        // 1. Define date range
        const currentDate = new Date();
        const endDate = new Date();
        endDate.setDate(currentDate.getDate() + 30);

        // 2. Get Employees 
        const employees = await Employee.find(
            { status: "Active" },
            'basicInfo.firstName basicInfo.lastName basicInfo.dob employeeId profilePicture workDetails.department'
        );

        // 3. Filter out the employees for upcoming birthdays
        const upcomingBirthdays = employees
            .filter(employee => {
                if (!employee.basicInfo?.dob) return false;

                const dob = new Date(employee.basicInfo.dob);
                const birthdayThisYear = new Date(
                    currentDate.getFullYear(),
                    dob.getMonth(),
                    dob.getDate()
                );


                // If birthday already passed this year, check next year's birthday
                if (birthdayThisYear < currentDate) {
                    birthdayThisYear.setFullYear(birthdayThisYear.getFullYear() + 1);
                }

                return birthdayThisYear <= endDate;
            })
            // 4. calculate the days left until the birthday and format the data
            .map(employee => {
                const dob = new Date(employee.basicInfo.dob);
                const birthdayThisYear = new Date(
                    currentDate.getFullYear(),
                    dob.getMonth(),
                    dob.getDate()
                );

                // If birthday already passed this year, use next year's birthday
                if (birthdayThisYear < currentDate) {
                    birthdayThisYear.setFullYear(birthdayThisYear.getFullYear() + 1);
                }

                // Calculate age they will be on their birthday
                const upcomingYear = birthdayThisYear.getFullYear();
                const birthYear = dob.getFullYear();
                const age = upcomingYear - birthYear;

                return {
                    // id: employee._id,
                    // employeeId: employee.employeeId,
                    name: `${employee.basicInfo.firstName} ${employee.basicInfo.lastName}`,
                    date: birthdayThisYear,
                    type: 'Birthday',
                    department: employee.workDetails.department,
                    profilePicture: employee.profilePicture || null,
                    // age: age,
                    daysUntil: Math.floor((birthdayThisYear - currentDate) / (1000 * 60 * 60 * 24))
                };
            });

        // 5. Get upcoming holidays
        const upcomingHolidays = await Holiday.find({
            status: "Active",
            date: { $gte: currentDate, $lte: endDate }
        }).select('name date type description notes').lean();

        // 6. format holidays data
        const formattedHolidays = upcomingHolidays.map(holiday => {
            const holidayDate = new Date(holiday.date);
            return {
                // id: holiday._id,
                name: holiday.name,
                date: holidayDate,
                type: 'Holiday',
                department: null,
                profilePicture: null,
                // category: holiday.type,
                // description: holiday.description || null,
                daysUntil: Math.floor((holidayDate - currentDate) / (1000 * 60 * 60 * 24))
            };
        });

        // 7. Combine and sort by date (using daysUntil for more accurate sorting)
        const celebrationsData = [...upcomingBirthdays, ...formattedHolidays]
            .sort((a, b) => a.daysUntil - b.daysUntil);


        return celebrationsData;
    } catch (error) {
        console.error(error);
    }
}

const getCurrentDayAttendance = async () => {
    try {
        // Get the start and end of the current day
        const now = new Date();
        now.setUTCHours(0, 0, 0, 0)
        console.log('now', now)
        // Get all attendance records for today
        const attendanceRecords = await Attendance.find({
            date: now
        });
        // Count by status
        const present = attendanceRecords.filter(record => record.status === 'Present').length;
        const absent = attendanceRecords.filter(record => record.status === 'Absent').length;
        const leaveAttendance = attendanceRecords.filter(record => record.status === 'Leave');
        const leave = leaveAttendance.length;

        let employeesOnLeave;
        if (leave > 0) {
            // 2. Process each attendance record to get related information
            employeesOnLeave = await Promise.all(leaveAttendance.map(async (attendance) => {
                // Initialize the result object
                const record = {};

                // 3. If leaveId exists, fetch only totalDays and reason from leave document
                if (attendance.leaveId) {
                    const leaveDetails = await Leave.findById(attendance.leaveId, 'totalDays reason');
                    if (leaveDetails) {
                        record.totalDays = leaveDetails.totalDays;
                        record.reason = leaveDetails.reason;
                    }
                }

                // 4. Fetch only name and department from employee document
                const employeeDetails = await Employee.findOne(
                    { employeeId: attendance.employeeId },
                    'basicInfo.firstName basicInfo.lastName workDetails.department'
                );
                console.log('employee details', employeeDetails)
                if (employeeDetails) {
                    record.name = employeeDetails.basicInfo?.firstName + ' ' + employeeDetails.basicInfo?.lastName;
                    record.department = employeeDetails.workDetails?.department;
                }

                return record;
            }));
        }

        // Calculate average working hours for present employees
        // let avgWorkingHours = 0;
        // const presentEmployees = attendanceRecords.filter(record => record.status === 'Present');

        // if (presentEmployees.length > 0) {
        //     const totalHours = presentEmployees.reduce((sum, record) => {
        //         return sum + record.sessions.reduce((sessionSum, session) =>
        //             sessionSum + (session.workingHours || 0), 0);
        //     }, 0);
        //     avgWorkingHours = parseFloat((totalHours / presentEmployees.length).toFixed(2));
        // }


        const todayAttendance = [
            {
                name: 'Present',
                value: present,
                color: '#4caf50'
            },
            {
                name: 'Absent',
                value: absent,
                color: '#f44336'
            },
            {
                name: 'Leave',
                value: leave,
                color: '#ff9800'
            }
        ]

        // Create response object
        const response = {
            date: now,
            todayAttendance,
            employeesOnLeave
        };

        return (response);
    } catch (error) {
        console.error('Error fetching today\'s attendance:', error);

    }
}

const getPendingApprovals = async () => {
    try {
        // fetch pending leave approval
        const leaves = await Leave.find({ status: 'pending' })
        let pendingApprovals = []
        if (leaves.length > 0) {
            for (const leave of leaves) {
                const employee = await Employee.findOne({ employeeId: leave.employeeId }).select('basicInfo workDetails');

                const approval = {
                    type: 'Leave Request',
                    status:leave.status,
                    employee: employee.basicInfo.firstName + ' ' + employee.basicInfo.lastName,
                    department: employee.workDetails.department
                };

                // Push approval to the array
                pendingApprovals.push(approval);
            }
        }
        // console.log('leaves', leaves)

        console.log('pendingapprovals', pendingApprovals)
        return pendingApprovals;

    } catch (error) {

    }
}
const getAllDashboardInfo = async (req, res) => {

    // ------------------------------ stats data ---------------------------------
    const statsData = await getStatsData();
    // ------------------------------ Celebrations data ---------------------------------
    const celebrations = await getCelebrations();
    // ------------------------------ get current day attendance ---------------------------------
    const attendanceData = await getCurrentDayAttendance();

    const pendingApprovals =await  getPendingApprovals();
    // console.log('attendanceData', attendanceData)
    const responseData = {
        stats: statsData,
        attendance: attendanceData,
        // leaves: employeesOnLeave,
        approvals: pendingApprovals,
        compliance: pendingCompliance,
        topPerformer: {
            /* ... */
        },
        celebrations,
    }

    return res.status(201).json(
        new ApiResponse(200, responseData, "Info fetched successfully", "Success")
    )

};

const getUpcomingBirthdays = async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;

        // Validate days parameter
        if (days <= 0 || days > 365) {
            return res.status(400).json({
                success: false,
                message: 'Days parameter must be between 1 and 365'
            });
        }

        const currentDate = new Date();
        const endDate = new Date();
        endDate.setDate(currentDate.getDate() + days);

        // Get all active employees
        const employees = await Employee.find(
            { status: "Active" },
            'basicInfo.firstName basicInfo.lastName basicInfo.dob profilePicture employeeId workDetails.department workDetails.jobTitle'
        );

        const upcomingBirthdays = employees
            .filter(employee => {
                if (!employee.basicInfo?.dob) return false;

                const dob = new Date(employee.basicInfo.dob);
                const birthdayThisYear = new Date(
                    currentDate.getFullYear(),
                    dob.getMonth(),
                    dob.getDate()
                );

                // If birthday already passed this year, check next year's birthday
                if (birthdayThisYear < currentDate) {
                    birthdayThisYear.setFullYear(birthdayThisYear.getFullYear() + 1);
                }

                return birthdayThisYear <= endDate;
            })
            .map(employee => {
                const dob = new Date(employee.basicInfo.dob);
                const birthdayThisYear = new Date(
                    currentDate.getFullYear(),
                    dob.getMonth(),
                    dob.getDate()
                );

                // If birthday already passed this year, use next year's birthday
                if (birthdayThisYear < currentDate) {
                    birthdayThisYear.setFullYear(birthdayThisYear.getFullYear() + 1);
                }

                // Calculate age they will be on their birthday
                const upcomingYear = birthdayThisYear.getFullYear();
                const birthYear = dob.getFullYear();
                const age = upcomingYear - birthYear;

                return {
                    id: employee._id,
                    employeeId: employee.employeeId,
                    name: `${employee.basicInfo.firstName} ${employee.basicInfo.lastName}`,
                    department: employee.workDetails?.department || null,
                    jobTitle: employee.workDetails?.jobTitle || null,
                    date: birthdayThisYear,
                    profilePicture: employee.profilePicture || null,
                    age: age,
                    daysUntil: Math.floor((birthdayThisYear - currentDate) / (1000 * 60 * 60 * 24))
                };
            })
            .sort((a, b) => a.daysUntil - b.daysUntil);

        return res.status(200).json({
            success: true,
            count: upcomingBirthdays.length,
            data: upcomingBirthdays
        });

    } catch (error) {
        console.error('Error fetching upcoming birthdays:', error);
        return res.status(500).json({
            success: false,
            message: 'Server Error',
            error: process.env.NODE_ENV === 'production' ? undefined : error.message
        });
    }
};

/**
 * Get upcoming holidays only
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUpcomingHolidays = async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;

        // Validate days parameter
        if (days <= 0 || days > 365) {
            return res.status(400).json({
                success: false,
                message: 'Days parameter must be between 1 and 365'
            });
        }

        const currentDate = new Date();
        const endDate = new Date();
        endDate.setDate(currentDate.getDate() + days);

        const upcomingHolidays = await Holiday.find({
            status: "Active",
            date: { $gte: currentDate, $lte: endDate }
        }).select('name date type description notes').lean();

        const formattedHolidays = upcomingHolidays.map(holiday => {
            const holidayDate = new Date(holiday.date);
            return {
                id: holiday._id,
                name: holiday.name,
                date: holidayDate,
                category: holiday.type,
                description: holiday.description || null,
                notes: holiday.notes || null,
                daysUntil: Math.floor((holidayDate - currentDate) / (1000 * 60 * 60 * 24))
            };
        }).sort((a, b) => a.daysUntil - b.daysUntil);

        return res.status(200).json({
            success: true,
            count: formattedHolidays.length,
            data: formattedHolidays
        });

    } catch (error) {
        console.error('Error fetching upcoming holidays:', error);
        return res.status(500).json({
            success: false,
            message: 'Server Error',
            error: process.env.NODE_ENV === 'production' ? undefined : error.message
        });
    }
};









export {
    getAllDashboardInfo
}