import { Router } from 'express';
import {
    createEmployee,
    deleteEmployee,
    generateReport,
    getAllEmployees,
    getAllLeaves,
    getAllTickets,
    getAttendanceList,
    getLogoutRequestList,
    handleAttendanceVerification,
    updateEmpLogOutTime,
    updateEmployeeEntry,
    updateLeaveStatus,
    updateTicketStatus
} from '../../controllers/HRMS/employee.controller.js';
import { upload } from "../../config/multer.js"
import { addHoliday, deleteHoliday, getHolidayList } from '../../controllers/HRMS/holiday.controller.js';
import { getAllDashboardInfo } from '../../controllers/dashboard.controller.js';
import { addPerformanceReview } from '../../controllers/HRMS/performance.controller.js';

const router = Router()


router.route('/create/employee').post(upload.fields([
    { name: 'documents', maxCount: 3 },   // For multiple files under "documents"
    { name: 'profilePicture', maxCount: 1 }   // For a single file under "profileImage"
]), createEmployee);

router.route('/list/employees').get(getAllEmployees)
router.route('/delete/employee/:id').delete(deleteEmployee)
router.route('/update/employee/:id').put(upload.fields([
    { name: 'documents', maxCount: 3 },   // For multiple files under "documents"
    { name: 'profilePicture', maxCount: 1 }   // For a single file under "profileImage"
]), updateEmployeeEntry);

// ============= leave and attendance routes =============
router.route('/list/leaves').get(getAllLeaves)
router.route('/update/leave-status/:leaveId').put(updateLeaveStatus)
router.route('/list/attendance').get(getAttendanceList)
router.route('/update/logout-time/:id').put(updateEmpLogOutTime)
router.route('/update/logout-time/:id').put(updateEmpLogOutTime)
router.route('/logout/request-list').get(getLogoutRequestList)
router.route('/list/tickets').get(getAllTickets)
router.route('/update/ticket-status/:ticketId').put(updateTicketStatus)


// ========= holiday routes ============
router.route('/add/holiday').post(addHoliday);
router.route('/holiday/list').get(getHolidayList);
router.route('/delete/Holiday/:id').delete(deleteHoliday)

router.route('/dashboard').get(getAllDashboardInfo)
router.route('/verify-attendance').post(handleAttendanceVerification)
router.route('/generate-report').post(generateReport)


// performance
router.route('/add/performance-review').post(addPerformanceReview);

export default router;