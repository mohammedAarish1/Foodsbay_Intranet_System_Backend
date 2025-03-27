import { Employee } from "../../models/HRMS/employee.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { calculateTotalHours, formatDate, parsedData } from "../../utils/helper.js";
import { ApiResponse } from '../../utils/ApiResponse.js'
import { ApiError } from "../../utils/ApiError.js";
import { DocumentStorageService } from "../../utils/fileUploading.js";
import { Leave } from "../../models/USER/leave.model.js"
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

import fs from 'fs/promises';
import path from 'path';
import { Attendance } from "../../models/USER/attendance.model.js";
import { generateAttendanceReport, generateLeaveReport } from "../../utils/report.js";
import { Ticket } from "../../models/USER/ticket.model.js";


// ====================== Report generation ================================ //

// import puppeteer from 'puppeteer';
// import { format } from 'date-fns';
// // Import your models

// // Factory function to get the appropriate report generator
// const getReportGenerator = (reportType) => {
//   const generators = {
//     attendance: generateAttendanceReport,
//     leave: generateLeaveReport,
//     // Add more report generators here as needed
//   };

//   return generators[reportType] || null;
// };

// // Main controller function for generating reports
// const generateReport = async (req, res) => {
//   try {
//     const { employeeId, startDate, endDate, reportType } = req.body;

//     // Validate required fields
//     if (!employeeId || !startDate || !endDate || !reportType) {
//       return res.status(400).json({ success: false, message: 'Missing required fields' });
//     }

//     // Parse dates
//     const parsedStartDate = new Date(startDate);
//     const parsedEndDate = new Date(endDate);

//     // Validate date range
//     if (isNaN(parsedStartDate) || isNaN(parsedEndDate) || parsedEndDate < parsedStartDate) {
//       return res.status(400).json({ success: false, message: 'Invalid date range' });
//     }

//     // Get the appropriate report generator
//     const reportGenerator = getReportGenerator(reportType);
//     if (!reportGenerator) {
//       return res.status(400).json({ success: false, message: 'Unsupported report type' });
//     }

//     // Get employee information
//     const employee = await Employee.findOne({ employeeId });
//     if (!employee) {
//       return res.status(404).json({ success: false, message: 'Employee not found' });
//     }

//     // Generate the report
//     const pdfBuffer = await reportGenerator(employee, parsedStartDate, parsedEndDate);

//     // Set headers for PDF download
//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader('Content-Disposition', `attachment; filename=${reportType}_report_${'employeeId'}.pdf`);

//     // Send the PDF buffer
//     res.setHeader('Content-Length', pdfBuffer.length);
//     res.send(Buffer.from(pdfBuffer, 'binary'));

//   } catch (error) {
//     console.error('Error generating report:', error);
//     res.status(500).json({ success: false, message: 'Failed to generate report', error: error.message });
//   }
// };

// // Attendance report generator
// async function generateAttendanceReport(employee, startDate, endDate) {
//   try {
//     // Fetch attendance records for the date range
//     const attendanceRecords = await Attendance.find({
//       employeeId: employee.employeeId,
//       date: { $gte: startDate, $lte: endDate }
//     }).sort({ date: 1 });
//     // Calculate statistics
//     const totalWorkDays = getWorkingDaysBetweenDates(startDate, endDate);
//     const presentDays = attendanceRecords.filter(record => record.status === 'Present').length;
//     const absentDays = attendanceRecords.filter(record => record.status === 'Absent').length;
//     const leaveDays = attendanceRecords.filter(record => record.status === 'Leave').length;
//     const attendanceRate = totalWorkDays > 0 ? (presentDays / totalWorkDays) * 100 : 0;

//     // Calculate total working hours
//     let totalWorkingHours = 0;
//     attendanceRecords.forEach(record => {
//       if (record.sessions && record.sessions.length > 0) {
//         record.sessions.forEach(session => {
//           if (session.workingHours) {
//             totalWorkingHours += session.workingHours;
//           }
//         });
//       }
//     });

//     // Format dates for display
//     const formattedStartDate = format(startDate, 'dd MMM yyyy');
//     const formattedEndDate = format(endDate, 'dd MMM yyyy');

//     // Generate HTML content for the report
//     const htmlContent = `
//       <!DOCTYPE html>
//       <html>
//       <head>
//         <meta charset="UTF-8">
//         <title>Attendance Report</title>
//         <style>
//           body {
//             font-family: Arial, sans-serif;
//             margin: 0;
//             padding: 20px;
//             color: #333;
//           }
//           .header {
//             text-align: center;
//             margin-bottom: 20px;
//             border-bottom: 1px solid #ddd;
//             padding-bottom: 10px;
//           }
//           .company-name {
//             font-size: 24px;
//             font-weight: bold;
//             margin-bottom: 5px;
//           }
//           .report-title {
//             font-size: 18px;
//             color: #666;
//           }
//           .info-section {
//             margin-bottom: 20px;
//           }
//           .info-row {
//             display: flex;
//             margin-bottom: 5px;
//           }
//           .info-label {
//             font-weight: bold;
//             width: 150px;
//           }
//           .summary-box {
//             border: 1px solid #ddd;
//             border-radius: 5px;
//             padding: 15px;
//             margin-bottom: 20px;
//             background-color: #f9f9f9;
//           }
//           .summary-title {
//             font-weight: bold;
//             margin-bottom: 10px;
//             border-bottom: 1px solid #eee;
//             padding-bottom: 5px;
//           }
//           .summary-grid {
//             display: grid;
//             grid-template-columns: 1fr 1fr;
//             gap: 10px;
//           }
//           .summary-item {
//             display: flex;
//             justify-content: space-between;
//           }
//           table {
//             width: 100%;
//             border-collapse: collapse;
//           }
//           th, td {
//             border: 1px solid #ddd;
//             padding: 8px;
//             text-align: left;
//           }
//           th {
//             background-color: #f2f2f2;
//           }
//           tr:nth-child(even) {
//             background-color: #f9f9f9;
//           }
//           .footer {
//             margin-top: 30px;
//             border-top: 1px solid #ddd;
//             padding-top: 10px;
//             font-size: 12px;
//             text-align: center;
//             color: #666;
//           }
//         </style>
//       </head>
//       <body>
//         <div class="header">
//           <div class="company-name">Your HRMS</div>
//           <div class="report-title">Attendance Report</div>
//         </div>

//         <div class="info-section">
//           <div class="info-row">
//             <span class="info-label">Employee ID:</span>
//             <span>${employee.employeeId}</span>
//           </div>
//           <div class="info-row">
//             <span class="info-label">Employee Name:</span>
//             <span>${employee.basicInfo.firstName} ${employee.basicInfo.lastName}</span>
//           </div>
//           <div class="info-row">
//             <span class="info-label">Department:</span>
//             <span>${employee.workDetails.department}</span>
//           </div>
//           <div class="info-row">
//             <span class="info-label">Job Title:</span>
//             <span>${employee.workDetails.jobTitle}</span>
//           </div>
//           <div class="info-row">
//             <span class="info-label">Period:</span>
//             <span>${formattedStartDate} to ${formattedEndDate}</span>
//           </div>
//         </div>

//         <div class="summary-box">
//           <div class="summary-title">Attendance Summary</div>
//           <div class="summary-grid">
//             <div class="summary-item">
//               <span>Working Days:</span>
//               <span>${totalWorkDays}</span>
//             </div>
//             <div class="summary-item">
//               <span>Present Days:</span>
//               <span>${presentDays}</span>
//             </div>
//             <div class="summary-item">
//               <span>Absent Days:</span>
//               <span>${absentDays}</span>
//             </div>
//             <div class="summary-item">
//               <span>Leave Days:</span>
//               <span>${leaveDays}</span>
//             </div>
//             <div class="summary-item">
//               <span>Attendance Rate:</span>
//               <span>${attendanceRate.toFixed(2)}%</span>
//             </div>
//             <div class="summary-item">
//               <span>Total Working Hours:</span>
//               <span>${totalWorkingHours}</span>
//             </div>
//           </div>
//         </div>

//         <h3>Attendance Details</h3>
//         <table>
//           <thead>
//             <tr>
//               <th>Date</th>
//               <th>Status</th>
//               <th>Check In</th>
//               <th>Check Out</th>
//               <th>Working Hours</th>
//             </tr>
//           </thead>
//           <tbody>
//             ${attendanceRecords.map(record => {
//               const date = format(new Date(record.date), 'dd MMM yyyy');
//               let checkIn = '-';
//               let checkOut = '-';
//               let workingHours = '-';

//               if (record.sessions && record.sessions.length > 0) {
//                 const session = record.sessions[0];
//                 if (session.logInTime) {
//                   checkIn = format(new Date(session.logInTime), 'hh:mm a');
//                 }
//                 if (session.logOutTime) {
//                   checkOut = format(new Date(session.logOutTime), 'hh:mm a');
//                 }
//                 if (session.workingHours) {
//                   workingHours = `${session.workingHours} hrs`;
//                 }
//               }

//               return `
//                 <tr>
//                   <td>${date}</td>
//                   <td>${record.status}</td>
//                   <td>${checkIn}</td>
//                   <td>${checkOut}</td>
//                   <td>${workingHours}</td>
//                 </tr>
//               `;
//             }).join('')}
//           </tbody>
//         </table>

//         <div class="footer">
//           <p>Generated on ${format(new Date(), 'dd MMM yyyy, hh:mm a')}</p>
//           <p>This is a system-generated report.</p>
//         </div>
//       </body>
//       </html>
//     `;

//     // Generate PDF from HTML using Puppeteer
//     return await generatePDFFromHTML(htmlContent);
//   } catch (error) {
//     console.error('Error in generateAttendanceReport:', error);
//     throw error;
//   }
// }

// // Leave report generator
// async function generateLeaveReport(employee, startDate, endDate) {
//   try {
//     // Fetch leave records for the date range
//     const leaveRecords = await Leave.find({
//       employeeId: employee.employeeId,
//       $or: [
//         // Leave starts within the range
//         { startDate: { $gte: startDate, $lte: endDate } },
//         // Leave ends within the range
//         { endDate: { $gte: startDate, $lte: endDate } },
//         // Leave spans the entire range
//         { startDate: { $lte: startDate }, endDate: { $gte: endDate } }
//       ]
//     }).sort({ startDate: 1 });

//     // Calculate leave statistics
//     const totalLeaves = leaveRecords.reduce((sum, record) => sum + record.totalDays, 0);
//     const approvedLeaves = leaveRecords.filter(record => record.status === 'approved').reduce((sum, record) => sum + record.totalDays, 0);
//     const pendingLeaves = leaveRecords.filter(record => record.status === 'pending').reduce((sum, record) => sum + record.totalDays, 0);
//     const rejectedLeaves = leaveRecords.filter(record => record.status === 'rejected').reduce((sum, record) => sum + record.totalDays, 0);

//     // Count leave types
//     const leaveTypeCount = leaveRecords.reduce((acc, record) => {
//       acc[record.leaveType] = (acc[record.leaveType] || 0) + record.totalDays;
//       return acc;
//     }, {});

//     // Format dates for display
//     const formattedStartDate = format(startDate, 'dd MMM yyyy');
//     const formattedEndDate = format(endDate, 'dd MMM yyyy');

//     // Generate HTML content for the report
//     const htmlContent = `
//       <!DOCTYPE html>
//       <html>
//       <head>
//         <meta charset="UTF-8">
//         <title>Leave Report</title>
//         <style>
//           body {
//             font-family: Arial, sans-serif;
//             margin: 0;
//             padding: 20px;
//             color: #333;
//           }
//           .header {
//             text-align: center;
//             margin-bottom: 20px;
//             border-bottom: 1px solid #ddd;
//             padding-bottom: 10px;
//           }
//           .company-name {
//             font-size: 24px;
//             font-weight: bold;
//             margin-bottom: 5px;
//           }
//           .report-title {
//             font-size: 18px;
//             color: #666;
//           }
//           .info-section {
//             margin-bottom: 20px;
//           }
//           .info-row {
//             display: flex;
//             margin-bottom: 5px;
//           }
//           .info-label {
//             font-weight: bold;
//             width: 150px;
//           }
//           .summary-box {
//             border: 1px solid #ddd;
//             border-radius: 5px;
//             padding: 15px;
//             margin-bottom: 20px;
//             background-color: #f9f9f9;
//           }
//           .summary-title {
//             font-weight: bold;
//             margin-bottom: 10px;
//             border-bottom: 1px solid #eee;
//             padding-bottom: 5px;
//           }
//           .summary-grid {
//             display: grid;
//             grid-template-columns: 1fr 1fr;
//             gap: 10px;
//           }
//           .summary-item {
//             display: flex;
//             justify-content: space-between;
//           }
//           table {
//             width: 100%;
//             border-collapse: collapse;
//           }
//           th, td {
//             border: 1px solid #ddd;
//             padding: 8px;
//             text-align: left;
//           }
//           th {
//             background-color: #f2f2f2;
//           }
//           tr:nth-child(even) {
//             background-color: #f9f9f9;
//           }
//           .footer {
//             margin-top: 30px;
//             border-top: 1px solid #ddd;
//             padding-top: 10px;
//             font-size: 12px;
//             text-align: center;
//             color: #666;
//           }
//           .status-approved {
//             color: green;
//             font-weight: bold;
//           }
//           .status-pending {
//             color: orange;
//             font-weight: bold;
//           }
//           .status-rejected {
//             color: red;
//             font-weight: bold;
//           }
//         </style>
//       </head>
//       <body>
//         <div class="header">
//           <div class="company-name">Your HRMS</div>
//           <div class="report-title">Leave Report</div>
//         </div>

//         <div class="info-section">
//           <div class="info-row">
//             <span class="info-label">Employee ID:</span>
//             <span>${employee.employeeId}</span>
//           </div>
//           <div class="info-row">
//             <span class="info-label">Employee Name:</span>
//             <span>${employee.basicInfo.firstName} ${employee.basicInfo.lastName}</span>
//           </div>
//           <div class="info-row">
//             <span class="info-label">Department:</span>
//             <span>${employee.workDetails.department}</span>
//           </div>
//           <div class="info-row">
//             <span class="info-label">Job Title:</span>
//             <span>${employee.workDetails.jobTitle}</span>
//           </div>
//           <div class="info-row">
//             <span class="info-label">Period:</span>
//             <span>${formattedStartDate} to ${formattedEndDate}</span>
//           </div>
//         </div>

//         <div class="summary-box">
//           <div class="summary-title">Leave Summary</div>
//           <div class="summary-grid">
//             <div class="summary-item">
//               <span>Total Leaves:</span>
//               <span>${totalLeaves}</span>
//             </div>
//             <div class="summary-item">
//               <span>Approved Leaves:</span>
//               <span>${approvedLeaves}</span>
//             </div>
//             <div class="summary-item">
//               <span>Pending Leaves:</span>
//               <span>${pendingLeaves}</span>
//             </div>
//             <div class="summary-item">
//               <span>Rejected Leaves:</span>
//               <span>${rejectedLeaves}</span>
//             </div>
//             <div class="summary-item">
//               <span>Total Leave Balance:</span>
//               <span>${employee.leaves?.balance || 0}</span>
//             </div>
//           </div>
//         </div>

//         <div class="summary-box">
//           <div class="summary-title">Leave Types</div>
//           <div class="summary-grid">
//             ${Object.entries(leaveTypeCount).map(([type, count]) => `
//               <div class="summary-item">
//                 <span>${type}:</span>
//                 <span>${count}</span>
//               </div>
//             `).join('')}
//           </div>
//         </div>

//         <h3>Leave Details</h3>
//         <table>
//           <thead>
//             <tr>
//               <th>Leave Type</th>
//               <th>Start Date</th>
//               <th>End Date</th>
//               <th>Days</th>
//               <th>Reason</th>
//               <th>Status</th>
//             </tr>
//           </thead>
//           <tbody>
//             ${leaveRecords.map(record => {
//               const startDate = format(new Date(record.startDate), 'dd MMM yyyy');
//               const endDate = format(new Date(record.endDate), 'dd MMM yyyy');
//               const statusClass = `status-${record.status}`;

//               return `
//                 <tr>
//                   <td>${record.leaveType}</td>
//                   <td>${startDate}</td>
//                   <td>${endDate}</td>
//                   <td>${record.totalDays}</td>
//                   <td>${record.reason}</td>
//                   <td class="${statusClass}">${record.status}</td>
//                 </tr>
//               `;
//             }).join('')}
//           </tbody>
//         </table>

//         <div class="footer">
//           <p>Generated on ${format(new Date(), 'dd MMM yyyy, hh:mm a')}</p>
//           <p>This is a system-generated report.</p>
//         </div>
//       </body>
//       </html>
//     `;

//     // Generate PDF from HTML using Puppeteer
//     return await generatePDFFromHTML(htmlContent);
//   } catch (error) {
//     console.error('Error in generateLeaveReport:', error);
//     throw error;
//   }
// }

// // Helper function to calculate working days between two dates (excluding weekends)
// function getWorkingDaysBetweenDates(startDate, endDate) {
//   let count = 0;
//   const currentDate = new Date(startDate);

//   while (currentDate <= endDate) {
//     // 0 is Sunday, 6 is Saturday
//     const dayOfWeek = currentDate.getDay();
//     const isWeekday = dayOfWeek !== 0 && dayOfWeek !== 6;

//     if (isWeekday) {
//       count++;
//     }

//     // Move to the next day
//     currentDate.setDate(currentDate.getDate() + 1);
//   }

//   return count;
// }

// // Helper function to generate PDF from HTML using Puppeteer
// async function generatePDFFromHTML(htmlContent) {
//   let browser = null;
//   try {
//     // Enhanced Puppeteer launch options
//     browser = await puppeteer.launch({
//       headless: 'new',
//       // args: [
//       //   '--no-sandbox',
//       //   '--disable-setuid-sandbox',
//       //   '--disable-dev-shm-usage',
//       //   '--disable-accelerated-2d-canvas',
//       //   '--disable-gpu',
//       //   '--window-size=1920x1080',
//       // ]
//       args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
//       timeout: 60000
//     });

//     const page = await browser.newPage();

//     // Set viewport for better rendering
//     await page.setViewport({
//       width: 1920,
//       height: 1080,
//       deviceScaleFactor: 1,
//     });

//     // Wait for network idle to ensure all content is loaded
//     await page.setContent(htmlContent, { 
//       waitUntil: ['domcontentloaded', 'networkidle0'] 
//     });

//     // Generate PDF with enhanced options
//     const pdfBuffer = await page.pdf({
//       format: 'A4',
//       printBackground: true,
//       margin: {
//         top: '20px',
//         right: '20px',
//         bottom: '20px',
//         left: '20px',
//       },
//       preferCSSPageSize: true,
//       timeout: 60000, // Increase timeout to 60 seconds
//     });

//     return pdfBuffer;
//   } catch (error) {
//     console.error('Error generating PDF:', error);
//     throw error;
//   } finally {
//     if (browser) {
//       await browser.close();
//     }
//   }
// }





const generateTempPassword = () => {
  const adjectives = ['Happy', 'Bright', 'Swift', 'Clever', 'Brave'];
  const nouns = ['Tiger', 'Eagle', 'Lion', 'Dolphin', 'Wolf'];
  const numbers = Math.floor(1000 + Math.random() * 9000);

  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];

  return `${adjective}${noun}${numbers}`;
};



const createEmployee = asyncHandler(async (req, res) => {
  // 1. store the data from the request body
  const data = req.body;
  const { firstName, lastName, dob, email, phoneNumber, gender, mainAddress, city, state, pincode, hireDate, department, jobTitle, salary, workLocation, accountNumber, bankName, ifscCode, emergencyContactName, emergencyContactPhone, emergencyContactRelation } = data;
  // const data = parsedData(req.body)
  // console.log('employeeid', employeeId)

  // 3. check if any item with same name already exists
  // const existingEmployee = await Employee.findOne({ employeeId });

  // // 4. return the error message if the item already exists
  // if (existingEmployee) {
  //   throw new ApiError(409, 'Employee with same employee ID already exists')
  // }

  const documentStorageService = new DocumentStorageService('local');
  let uploadedDocuments = [];
  let uploadedProfilePicture = null;
  if (req.files && req.files['documents'] && req.files['documents'].length > 0) {
    try {
      uploadedDocuments = await Promise.all(
        req.files['documents'].map(file => documentStorageService.save(file))
      );
    } catch (uploadError) {
      return res.status(500).json({
        message: 'Document upload failed',
        error: uploadError.message
      });
    }
  }


  // Check if a file is present under 'profileImage' field
  if (req.files && req.files['profilePicture'] && req.files['profilePicture'].length > 0) {
    try {
      uploadedProfilePicture = await documentStorageService.save(req.files['profilePicture'][0]); // Only one profile image expected
    } catch (uploadError) {
      return res.status(500).json({
        message: 'Profile image upload failed',
        error: uploadError.message
      });
    }
  }

  // console.log('uploadedDocuments', uploadedDocuments)
  // console.log('uploadedProfilePicture', uploadedProfilePicture)

  // // 5. store the user ID to the item data (from the authenticated user)
  // itemData.createdBy = req.user._id || 'Unknown'
  let documents;
  let profilePicture;
  if (uploadedDocuments.length > 0) {
    documents = uploadedDocuments.map(item => ({
      documentType: item.originalName,
      documentUrl: item.path
    }));
  }
  if (uploadedProfilePicture) {
    documents = uploadedDocuments.map(item => ({
      documentType: item.originalName,
      documentUrl: item.path
    }));
  }


  // // 5. Create a new item using the Item model
  const employee = new Employee({
    // employeeId,
    basicInfo: { firstName, lastName, dob, email, phoneNumber, gender },
    address: { mainAddress, city, state, pincode },
    workDetails: { hireDate, department, jobTitle, salary, workLocation },
    bankDetails: {
      accountNumber, bankName, ifscCode
    },
    leaves: { total: 12, balance: 12 },
    emergencyContact: {
      name: emergencyContactName,
      phoneNumber: emergencyContactPhone,
      relation: emergencyContactRelation
    },
    documents,
    profilePicture: uploadedProfilePicture?.path || '',
    password: generateTempPassword()
  });
  // // 6. Save item to the database 
  await employee.save();
  // // Convert the dates into a readable format
  // const responseData = {
  //   ...item.toObject(),
  //   createdBy: req.user.fullName // Send the user name along with the response
  // };

  // responseData.createdAt = formatDate(responseData.createdAt);
  // responseData.updatedAt = formatDate(responseData.updatedAt);

  // // 7. Return the created item with response
  return res.status(201).json(
    new ApiResponse(200, employee, "Employee created successfully", "Success")
  )
});



const getAllEmployees = asyncHandler(async (req, res) => {
  // console.log('get all purchases');
  const employees = await Employee.find()
    .sort({ createdAt: -1 })
    .exec();

  console.log('employees', employees);

  // 2. If no items are found, return a 404 Not Found response
  if (!employees || employees.length === 0) {
    return res.status(404).json(
      new ApiResponse(404, {}, "No Employee found")
    );
  }


  // 3. Convert createdAt and updatedAt fields into readable format for each item
  const responseData = employees.map(entry => ({
    ...entry.toObject(),
    basicInfo: { ...entry.basicInfo.toObject(), dob: formatDate(entry.basicInfo.dob) },
    createdAt: formatDate(entry.createdAt),  // Format createdAt
    updatedAt: formatDate(entry.updatedAt),  // Format updatedAt
    createdBy: entry.createdBy ? entry.createdBy.fullName : 'Unknown'  // Send the user's fullName as createdBy
  }));

  // console.log('responseData',responseData)

  // Format the response to include the item name and other fields from PurchaseEntry
  // const formattedEntries = purchaseEntries.map(entry => ({
  //     _id: entry._id,
  //     name: entry.itemId?.name || '-',   // Extract item name
  //     invoiceNo: entry.invoiceNo,
  //     unitPrice: entry.unitPrice,
  //     taxableAmount: entry.taxableAmount,
  //     taxAmount: entry.taxAmount,
  //     totalAmount: entry.totalAmount,
  //     quantity: entry.quantity,
  //     unit: entry.unit,
  //     clientVendor: entry.clientVendor,
  //     biltyNumber: entry.biltyNumber,
  //     createdAt: new Date(entry.createdAt).toLocaleDateString(),
  //     updatedAt: new Date(entry.updatedAt).toLocaleDateString(),
  //     documents: entry.documents
  // }));
  // console.log('purchaseEntries', formattedEntries)
  res.status(200).json(new ApiResponse(200, responseData || [], 'Employees fetched successfully!', 'Success'))
}
)


// delete an item from the database
const deleteEmployee = asyncHandler(async (req, res) => {
  console.log('employee')
  const { id } = req.params;  // Extract the purchase ID from the URL parameters
  // Check if the item exists in the database
  const employee = await Employee.findById(id);

  if (!employee) {
    // If the item doesn't exist, return a 404 error
    return res.status(404).json({ message: 'No employee found' });
  }


  // 3. Remove associated files
  if (employee.documents && employee.documents.length > 0) {
    await Promise.all(
      employee.documents.map(async (doc) => {
        try {
          fs.unlink(path.join(process.cwd(), doc.documentUrl));
        } catch (unlinkError) {
          console.warn(`Could not delete file: ${doc.documentUrl}`, unlinkError);
        }
      })
    );
  }

  console.log('yeess 2')
  // Delete the item from the database
  await Employee.findByIdAndDelete(id);
  // Return a success response
  return res.status(200).json(
    new ApiResponse(200, { id }, "Deleted successfully", "Success")
  );

});


const updateEmployeeEntry = asyncHandler(async (req, res) => {

  const employeeId = req.params.id;
  const updatedData = req.body;
  const existingEmployee = await Employee.findById(employeeId);
  console.log('updateddata', updatedData)
  if (!existingEmployee) {
    return res.status(404).json({ message: 'Employee not found' });
  }

  // Initialize the update object
  const updates = {};

  // Compare and update basic info
  if (existingEmployee.basicInfo) {
    const basicInfoUpdates = {};
    const fields = ['firstName', 'lastName', 'dob', 'email', 'phoneNumber', 'gender'];

    fields.forEach(field => {
      const newValue = updatedData[field];
      let existingValue = existingEmployee.basicInfo[field];
      if (typeof existingValue === 'object') {
        existingValue = new Date(existingValue).toISOString().split('T')[0];
      }
      // console.log('check 1', typeof existingValue, typeof newValue);
      if (newValue !== undefined && newValue !== existingValue) {
        basicInfoUpdates[field] = newValue;
      }
    });

    if (Object.keys(basicInfoUpdates).length > 0) {
      updates['basicInfo'] = {
        ...existingEmployee.basicInfo.toObject(),
        ...basicInfoUpdates
      };
    }
  }

  // Compare and update address
  if (existingEmployee.address) {
    const addressUpdates = {};
    const addressFields = ['mainAddress', 'city', 'state', 'pincode'];

    addressFields.forEach(field => {
      if (updatedData[field] !== undefined &&
        updatedData[field] !== existingEmployee.address[field]) {
        addressUpdates[field] = updatedData[field];
      }
    });

    if (Object.keys(addressUpdates).length > 0) {
      updates['address'] = {
        ...existingEmployee.address.toObject(),
        ...addressUpdates
      };
    }
  }

  // Compare and update bank details
  if (existingEmployee.bankDetails) {
    const bankUpdates = {};
    const bankFields = ['accountNumber', 'bankName', 'ifscCode'];

    bankFields.forEach(field => {
      if (updatedData[field] !== undefined &&
        updatedData[field] !== existingEmployee.bankDetails[field]) {
        bankUpdates[field] = updatedData[field];
      }
    });

    if (Object.keys(bankUpdates).length > 0) {
      updates['bankDetails'] = {
        ...existingEmployee.bankDetails.toObject(),
        ...bankUpdates
      };
    }
  }

  // Compare and update emergency contact
  if (existingEmployee.emergencyContact) {
    const emergencyUpdates = {};
    const emergencyFields = ['emergencyContactName', 'emergencyContactPhone', 'emergencyContactRelation'];

    emergencyFields.forEach(field => {
      if (updatedData[field] !== undefined &&
        updatedData[field] !== existingEmployee.emergencyContact[field]) {
        emergencyUpdates[field] = updatedData[field];
      }
    });

    if (Object.keys(emergencyUpdates).length > 0) {
      updates['emergencyContact'] = {
        ...existingEmployee.emergencyContact.toObject(),
        ...emergencyUpdates
      };
    }
  }

  // Update other direct fields
  const directFields = ['employeeId', 'hireDate', 'department', 'jobTitle', 'status', 'salary', 'workLocation'];
  directFields.forEach(field => {
    let existingValue = existingEmployee[field];
    let newValue;
    if (field === 'salary') {
      newValue = Number(updatedData[field]);
    } else {
      newValue = updatedData[field];
    }
    if (typeof existingValue === 'object') {
      existingValue = new Date(existingValue).toISOString().split('T')[0];
    }
    if (newValue !== undefined && newValue !== existingValue) {
      updates[field] = newValue;
    }
  });

  // console.log('updates', updates)

  // Handle profile picture update
  // if (req.files && req.files.profilePicture) {
  //     const newProfilePicture = req.files.profilePicture;

  //     // Delete existing profile picture if it exists
  //     if (existingEmployee.profilePicture) {
  //         try {
  //             await fs.unlink(existingEmployee.profilePicture);
  //         } catch (error) {
  //             console.error('Error deleting old profile picture:', error);
  //         }
  //     }

  //     // Save new profile picture
  //     const uploadPath = path.join(__dirname, '../uploads/profile-pictures', 
  //         `${employeeId}-${Date.now()}-${newProfilePicture.name}`);
  //     await newProfilePicture.mv(uploadPath);
  //     updates.profilePicture = uploadPath;
  // }

  // Handle documents update
  // if (req.files && req.files.documents) {
  //     const newDocuments = Array.isArray(req.files.documents) ? 
  //         req.files.documents : [req.files.documents];

  //     // Handle deleted documents
  //     const deletedDocIds = updatedData.deletedDocuments || [];
  //     for (const docId of deletedDocIds) {
  //         const docToDelete = existingEmployee.documents.find(doc => doc._id.toString() === docId);
  //         if (docToDelete) {
  //             try {
  //                 await fs.unlink(docToDelete.path);
  //                 existingEmployee.documents = existingEmployee.documents.filter(
  //                     doc => doc._id.toString() !== docId
  //                 );
  //             } catch (error) {
  //                 console.error('Error deleting document:', error);
  //             }
  //         }
  //     }

  // Add new documents
  //     const uploadedDocs = [];
  //     for (const doc of newDocuments) {
  //         const uploadPath = path.join(__dirname, '../uploads/documents', 
  //             `${employeeId}-${Date.now()}-${doc.name}`);
  //         await doc.mv(uploadPath);
  //         uploadedDocs.push({
  //             name: doc.name,
  //             path: uploadPath,
  //             uploadDate: new Date()
  //         });
  //     }

  //     updates.documents = [...existingEmployee.documents, ...uploadedDocs];
  // }

  // Only update if there are changes
  if (Object.keys(updates).length > 0) {
    const updatedEmployee = await Employee.findByIdAndUpdate(
      employeeId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    // return res.status(200).json({
    //     message: 'Employee updated successfully',
    //     data: updatedEmployee
    // });
    console.log('doneee');
    return res.status(200).json(
      new ApiResponse(200, updatedEmployee, "Updated successfully", "Success")
    );
  }


  return res.status(200).json({
    message: 'No changes detected',
    data: existingEmployee
  });


});


// get all leaves
const getAllLeaves = asyncHandler(async (req, res) => {

  const { status, startDate, endDate } = req.query;

  // Build query conditions
  const queryConditions = {};

  if (status) {
    queryConditions.status = status;
  }

  if (startDate && endDate) {
    queryConditions.startDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  // Get leaves with populate
  const leaveList = await Leave.find(queryConditions)
    .populate({
      path: 'employeeId',
      model: Employee,
      select: 'basicInfo.firstName basicInfo.lastName workDetails.department',
      // Using localField and foreignField since we're matching on employeeId string
      localField: 'employeeId',
      foreignField: 'employeeId'
    })
    .lean()
    .sort({ createdAt: -1 })
    .select('-__v');

  if (leaveList.length === 0) {
    return res.status(200).json(
      new ApiResponse(200, [], "No leaves found")
    );
  }
  // Transform the populated data to match the desired format
  const responseData = leaveList.map(leave => ({
    _id: leave._id,
    leaveType: leave.leaveType,
    startDate: formatDate(leave.startDate),
    endDate: formatDate(leave.endDate),
    totalDays: leave.totalDays,
    reason: leave.reason,
    status: leave.status,
    createdAt: formatDate(leave.createdAt),
    updatedAt: formatDate(leave.updatedAt),
    employeeName: leave.employeeId ?
      `${leave.employeeId.basicInfo.firstName} ${leave.employeeId.basicInfo.lastName || ''}`.trim() :
      'Unknown Employee',
    department: leave.employeeId?.workDetails.department || 'Unknown Department'
  }));


  return res.status(200).json(
    new ApiResponse(
      200,
      responseData,
      "Leave list fetched successfully"
    )
  );

})

const updateLeaveStatus = asyncHandler(async (req, res) => {
  console.log('yesss')
  const _id = req.params.leaveId;
  const { status, comment } = req.body;
  console.log('status', status)
  const leave = await Leave.findById(_id);
  if (!leave) {
    throw new ApiError(404, 'No leave record found')
  }
  leave.status = status;
  if (comment) {
    leave.comment = comment;
  }

  await leave.save()

  const updatedLeave = await Leave.findById(_id)
    .populate({
      path: 'employeeId',
      model: Employee,
      select: 'basicInfo.firstName basicInfo.lastName workDetails.department',
      // Using localField and foreignField since we're matching on employeeId string
      localField: 'employeeId',
      foreignField: 'employeeId'
    })
    .lean()
    .sort({ createdAt: -1 })
    .select('-__v');

  const responseData = {
    ...updatedLeave,
    // startDate: formatDate(updatedLeave.startDate),
    // endDate: formatDate(updatedLeave.endDate),
    // createdAt: formatDate(updatedLeave.createdAt),
    // updatedAt: formatDate(updatedLeave.updatedAt),
    employeeName: updatedLeave.employeeId ?
      `${updatedLeave.employeeId.basicInfo.firstName} ${updatedLeave.employeeId.basicInfo.lastName || ''}`.trim() :
      'Unknown Employee',
    department: updatedLeave.employeeId?.workDetails.department || 'Unknown Department'
  };

  console.log('responseData', responseData)


  return res.status(200).json(
    new ApiResponse(200, responseData, "Updated successfully", "Success")
  );

})


// ============================== get all attendance ====================================
const getAttendanceList = asyncHandler(async (req, res) => {

  // Destructure the query params sent by frontend
  const { employeeId, status, dateRange } = req.query;
  // console.log('employeeId', employeeId)
  // console.log('status', status)
  // console.log('dateRange', dateRange)
  // Build the query filter object
  const filter = {};

  // Filter by employeeId if provided
  if (employeeId) {
    filter.employeeId = employeeId;
  }

  // Filter by status if provided
  if (status && status.length > 0) {
    filter.status = { $in: status }; // Using $in operator to filter multiple statuses
  }

  // Filter by date range if provided
  if (dateRange && dateRange.start && dateRange.end) {
    const { start, end } = dateRange;

    // Make sure the date range is valid
    const startDate = new Date(start);
    const endDate = new Date(end);

    // Add date range filter to the query
    if (!isNaN(startDate) && !isNaN(endDate)) {
      // Adjust date range to cover the full day for start and end dates
      const adjustedStartDate = new Date(startDate.setHours(0, 0, 0, 0)); // Start of the day
      const adjustedEndDate = new Date(endDate.setHours(23, 59, 59, 999)); // End of the day

      filter.date = { $gte: adjustedStartDate, $lte: adjustedEndDate };
    } else {
      return res.status(400).json(new ApiResponse(400, [], "Invalid date range"));
    }
  }
  console.log('filter', filter)

  // Fetch attendance data with the applied filters
  const attendanceList = await Attendance.find(filter).sort({ date: -1 });
  console.log('attendanceList', attendanceList.length)

  if (attendanceList.length === 0) {
    return res.status(200).json(
      new ApiResponse(200, [], "No attendance found")
    );
  }
  // Transform the populated data to match the desired format
  const responseData = attendanceList.map(attendance => ({
    _id: attendance._id,
    employeeId: attendance.employeeId,
    date: formatDate(attendance.date),
    status: attendance.status,
    sessions: attendance.sessions.map(session => {
      return {
        // ...session,
        _id: session._id,
        workingHours: session.workingHours,
        logInTime: formatDate(session.logInTime, 'time'),
        logOutTime: formatDate(session.logOutTime, 'time'),
      }
    }),
    // logInTime: formatDate(attendance.logInTime, 'time'),
    // logOutTime: formatDate(attendance.logOutTime, 'time'),
    // workingHours: attendance.workingHours,
    createdAt: formatDate(attendance.createdAt),
    updatedAt: formatDate(attendance.updatedAt),
    // employeeName: attendance.employeeId ?
    //   `${attendance.employeeId.basicInfo.firstName} ${attendance.employeeId.basicInfo.lastName || ''}`.trim() :
    //   'Unknown Employee',
    // department: attendance.employeeId?.workDetails.department || 'Unknown Department'
  }));


  return res.status(200).json(
    new ApiResponse(
      200,
      attendanceList,
      "Attendance list fetched successfully"
    )
  );

})

// ==================== update the employee's log out time by HR ======================= //
const updateEmpLogOutTime = asyncHandler(async (req, res) => {

  //1 . extract the data from the request
  const _id = req.params.id;
  const { sessionId, updatedLogoutTime, date } = req.body;

  // 2. find the attendance
  const attendance = await Attendance.findById(_id)

  // 3. return error if no attendance foung
  if (!attendance) {
    throw new ApiError(404, 'Attendance not found')
  }

  // 4. Find the particluar session within the 'sessions' array by sessionId
  const sessionIndex = attendance.sessions.findIndex(session => session._id.toString() === sessionId);

  // 5. return error if no session found
  if (sessionIndex === -1) {
    throw new ApiError(404, 'log in Session not found')
  }

  // 6. Split 'updatedLogoutTime' to get hour and minute
  const [hour, minute] = updatedLogoutTime.split(':');

  // 7. Create a date object by combining the date and time (defaulting to midnight for date)
  const logOutTime = new Date(attendance.date);
  logOutTime.setHours(hour);
  logOutTime.setMinutes(minute);
  logOutTime.setSeconds(0);  // Set seconds to 0 if you don't need them

  // 8. get the log in time of the user
  const logInTime = attendance.sessions[sessionIndex].logInTime

  if (logInTime > logOutTime) {
    console.log('errorrrrrr', logInTime, logOutTime)
    throw new ApiError(400, 'Log out time should be greater than log in time')
  }

  // 9. Update the logOutTime and working hours of the employee of the found session
  attendance.sessions[sessionIndex].logOutTime = logOutTime;
  attendance.sessions[sessionIndex].workingHours = calculateTotalHours(logInTime, logOutTime);
  if (attendance.sessions[sessionIndex].logoutUpdateRequest.isRequested && attendance.sessions[sessionIndex].logoutUpdateRequest.status === 'Pending') {
    attendance.sessions[sessionIndex].logoutUpdateRequest.status = 'Approved'
  }
  // Save the updated attendance document
  const updatedAttendance = await attendance.save();

  const responseData = {
    ...updatedAttendance.toObject(),
    date: formatDate(updatedAttendance, 'date'),
    sessions: updatedAttendance.sessions.map(session => (
      {
        ...session.toObject(),
        logInTime: formatDate(session.logInTime, 'time'),
        logOutTime: formatDate(session.logInTime, 'time')
      }
    )),
  }

  return res.status(200).json(
    new ApiResponse(200, responseData, "Updated successfully", "Success")
  );

})


const getLogoutRequestList = asyncHandler(async (req, res) => {
  const attendanceRecords = await Attendance.find({ "sessions.logoutUpdateRequest.isRequested": true })
    // .populate('employeeId')
    .populate({
      path: 'employeeId',
      model: Employee,
      select: 'basicInfo.firstName basicInfo.lastName workDetails.department',
      // Using localField and foreignField since we're matching on employeeId string
      localField: 'employeeId',
      foreignField: 'employeeId'
    })
    .lean()
    .sort({ createdAt: -1 })
    .select('-__v');

  if (attendanceRecords.length === 0) {
    return res.status(200).json(
      new ApiResponse(200, [], "No Requests found")
    );
  }


  // Transform the populated data to match the desired format
  const responseData = attendanceRecords.map(attendance => ({
    _id: attendance._id,
    date: formatDate(attendance.date, 'date'),
    status: attendance.status,
    sessions: attendance.sessions.map(session => (
      {
        ...session,
        workingHours: session.workingHours,
        logInTime: formatDate(session.logInTime, 'time'),
        logOutTime: formatDate(session.logOutTime, 'time'),
        logoutUpdateRequest: {
          ...session.logoutUpdateRequest,
          requestedLogoutTime: formatDate(session.logoutUpdateRequest.requestedLogoutTime, 'time')
        }
      }
    )),
    employeeName: attendance.employeeId ?
      `${attendance.employeeId.basicInfo.firstName} ${attendance.employeeId.basicInfo.lastName || ''}`.trim() :
      'Unknown Employee',
    department: attendance.employeeId?.workDetails.department || 'Unknown Department'
  }));

  console.log('responseData', responseData)
  return res.status(200).json(
    new ApiResponse(
      200,
      responseData,
      "Logout Request list fetched successfully"
    )
  );
})

const handleAttendanceVerification = asyncHandler(async (req, res) => {
  const { attendanceId, status } = req.body;

  const attendance = await Attendance.findById(attendanceId)

  if (!attendance) {
    throw new ApiError(404, 'No attendance record found')
  }

  if (status === 'approved') {
    attendance.isApproved = true
  } else {
    attendance.isApproved = false
  }

  const updatedAttendance = await attendance.save()
  console.log('status', status);

  return res.status(200).json(
    new ApiResponse(
      200,
      updatedAttendance,
      `Attendance marked ${status}`
    )
  );
})



// report generation API


// Factory function to get the appropriate report generator
const getReportGenerator = (reportType) => {
  const generators = {
    attendance: generateAttendanceReport,
    leave: generateLeaveReport,
    // Add more report generators here as needed
  };

  return generators[reportType] || null;
};

// Main controller function for generating reports
const generateReport = async (req, res) => {
  try {
    const { employeeId, startDate, endDate, reportType } = req.body;

    // Validate required fields
    if (!employeeId || !startDate || !endDate || !reportType) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Parse dates
    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    // Validate date range
    if (isNaN(parsedStartDate) || isNaN(parsedEndDate) || parsedEndDate < parsedStartDate) {
      return res.status(400).json({ success: false, message: 'Invalid date range' });
    }

    // Get the appropriate report generator
    const reportGenerator = getReportGenerator(reportType);
    if (!reportGenerator) {
      return res.status(400).json({ success: false, message: 'Unsupported report type' });
    }

    // Get employee information
    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Generate the report
    const pdfBuffer = await reportGenerator(employee, parsedStartDate, parsedEndDate);

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${reportType}_report_${employeeId}.pdf`);

    // Send the PDF buffer
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(Buffer.from(pdfBuffer, 'binary'));

  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ success: false, message: 'Failed to generate report', error: error.message });
  }
};



// ====================== Report generation ================================ //

// get all leaves
const getAllTickets = asyncHandler(async (req, res) => {

  const { status, startDate, endDate } = req.query;

  // Build query conditions
  const queryConditions = {};

  if (status) {
    queryConditions.status = status;
  }

  if (startDate && endDate) {
    queryConditions.startDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  // Get leaves with populate
  const ticketList = await Ticket.find(queryConditions)
    .populate({
      path: 'employeeId',
      model: Employee,
      select: 'basicInfo.firstName basicInfo.lastName workDetails.department',
      // Using localField and foreignField since we're matching on employeeId string
      localField: 'employeeId',
      foreignField: 'employeeId'
    })
    .lean()
    .sort({ createdAt: -1 })
    .select('-__v');

  if (ticketList.length === 0) {
    return res.status(200).json(
      new ApiResponse(200, [], "No leaves found")
    );
  }
  // Transform the populated data to match the desired format
  const responseData = ticketList.map(ticket => ({
    ...ticket,
    employeeId: ticket.employeeId.employeeId,
    employeeName: ticket.employeeId ?
      `${ticket.employeeId.basicInfo.firstName} ${ticket.employeeId.basicInfo.lastName || ''}`.trim() :
      'Unknown Employee',
    department: ticket.employeeId?.workDetails.department || 'Unknown Department'
  }));

  console.log('responsedata', responseData.length)

  return res.status(200).json(
    new ApiResponse(
      200,
      responseData,
      "Ticket list fetched successfully"
    )
  );

})

const updateTicketStatus = asyncHandler(async (req, res) => {
  console.log('yesss')
  const _id = req.params.ticketId;
  const { status, comment } = req.body;
  const ticket = await Ticket.findById(_id);
  if (!ticket) {
    throw new ApiError(404, 'No ticket record found')
  }
  ticket.status = status;
  if (status === 'Resolved') {
    ticket.resolvedAt = new Date()
  }else{
    ticket.resolvedAt = null
  }
  if (comment) {
    ticket.response = comment;
  }

  await ticket.save()

  const updatedTicket = await Ticket.findById(_id)
    .populate({
      path: 'employeeId',
      model: Employee,
      select: 'basicInfo.firstName basicInfo.lastName workDetails.department',
      // Using localField and foreignField since we're matching on employeeId string
      localField: 'employeeId',
      foreignField: 'employeeId'
    })
    .lean()
    .sort({ createdAt: -1 })
    .select('-__v');

  const responseData = {
    ...updatedTicket,
    employeeId: updatedTicket.employeeId.employeeId,
    employeeName: updatedTicket.employeeId ?
      `${updatedTicket.employeeId.basicInfo.firstName} ${updatedTicket.employeeId.basicInfo.lastName || ''}`.trim() :
      'Unknown Employee',
    department: updatedTicket.employeeId?.workDetails.department || 'Unknown Department'
  };

  console.log('responseData', responseData)


  return res.status(200).json(
    new ApiResponse(200, responseData, "Updated successfully", "Success")
  );

})


export {
  createEmployee,
  getAllEmployees,
  deleteEmployee,
  updateEmployeeEntry,
  getAllLeaves,
  updateLeaveStatus,
  getAttendanceList,
  updateEmpLogOutTime,
  getLogoutRequestList,
  handleAttendanceVerification,
  generateReport,
  getAllTickets,
  updateTicketStatus
}