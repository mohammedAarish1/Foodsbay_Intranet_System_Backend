import { Router } from "express";
// import { verifyJWT } from "../middlewares/auth.middleware.js";
import multer from 'multer';
import { addLeaveRequest,deleteLeaveRequest,getSingleUserLeaves } from '../../controllers/USER/leave.controller.js';
import { getSingleUserAttendance, handleAttendanceRequest, handleLogoutRequest } from "../../controllers/USER/attendance.controller.js";
import { createTicket, getUserTicketList } from "../../controllers/USER/ticket.controller.js";
// ---------------- purchase API endpoints --------

const router = Router();

const upload = multer({
    dest: 'uploads/purchases',
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB file size limit
});



router.route('/leave-request').post(addLeaveRequest);
router.route('/leave/list/:id').get(getSingleUserLeaves);
router.route('/leave/request/:id').delete( deleteLeaveRequest);
router.route('/attendance/list/:id').get(getSingleUserAttendance);
router.route('/add/logout-request/:id').put(handleLogoutRequest);
router.route('/add/attendance-request').post(handleAttendanceRequest); 
router.route('/add/ticket').post(createTicket); 
router.route('/ticket/list/:id').get(getUserTicketList); 


export default router;