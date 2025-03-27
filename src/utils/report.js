import puppeteer from 'puppeteer';
import { format } from 'date-fns';
import { Attendance } from '../models/USER/attendance.model.js';
import { Leave } from '../models/USER/leave.model.js';


// Common CSS styles for all reports
const commonStyles = `
  body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
    color: #333;
  }
  .header {
    text-align: center;
    margin-bottom: 20px;
    border-bottom: 1px solid #ddd;
    padding-bottom: 10px;
  }
  .company-name {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 5px;
  }
  .report-title {
    font-size: 18px;
    color: #666;
  }
  .info-section {
    margin-bottom: 20px;
  }
  .info-row {
    display: flex;
    margin-bottom: 5px;
  }
  .info-label {
    font-weight: bold;
    width: 150px;
  }
  .summary-box {
    border: 1px solid #ddd;
    border-radius: 5px;
    padding: 15px;
    margin-bottom: 20px;
    background-color: #f9f9f9;
  }
  .summary-title {
    font-weight: bold;
    margin-bottom: 10px;
    border-bottom: 1px solid #eee;
    padding-bottom: 5px;
  }
  .summary-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .summary-item {
    display: flex;
    justify-content: space-between;
  }
  table {
    width: 100%;
    border-collapse: collapse;
  }
  th, td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
  }
  th {
    background-color: #f2f2f2;
  }
  tr:nth-child(even) {
    background-color: #f9f9f9;
  }
  .footer {
    margin-top: 30px;
    border-top: 1px solid #ddd;
    padding-top: 10px;
    font-size: 12px;
    text-align: center;
    color: #666;
  }
  .status-approved {
    color: green;
    font-weight: bold;
  }
  .status-pending {
    color: orange;
    font-weight: bold;
  }
  .status-rejected {
    color: red;
    font-weight: bold;
  }
`;


// Basic HTML template for all reports
const createReportTemplate = ({ title, employeeInfo, content }) => {
  const { employee, startDate, endDate } = employeeInfo;
  const formattedStartDate = format(startDate, 'dd MMM yyyy');
  const formattedEndDate = format(endDate, 'dd MMM yyyy');
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        ${commonStyles}
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-name">Your HRMS</div>
        <div class="report-title">${title}</div>
      </div>
      
      <div class="info-section">
        <div class="info-row">
          <span class="info-label">Employee ID:</span>
          <span>${employee.employeeId}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Employee Name:</span>
          <span>${employee.basicInfo.firstName} ${employee.basicInfo.lastName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Department:</span>
          <span>${employee.workDetails.department}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Job Title:</span>
          <span>${employee.workDetails.jobTitle}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Period:</span>
          <span>${formattedStartDate} to ${formattedEndDate}</span>
        </div>
      </div>
      
      ${content}
      
      <div class="footer">
        <p>Generated on ${format(new Date(), 'dd MMM yyyy, hh:mm a')}</p>
        <p>This is a system-generated report.</p>
      </div>
    </body>
    </html>
  `;
};


// Create a summary box component
const summaryBox = (title, items) => {
  return `
    <div class="summary-box">
      <div class="summary-title">${title}</div>
      <div class="summary-grid">
        ${items.map(item => `
          <div class="summary-item">
            <span>${item.label}:</span>
            <span>${item.value}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
};



// Helper function to calculate working days between two dates (excluding weekends)
function getWorkingDaysBetweenDates(startDate, endDate) {
  let count = 0;
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    // 0 is Sunday, 6 is Saturday
    const dayOfWeek = currentDate.getDay();
    const isWeekday = dayOfWeek !== 0 && dayOfWeek !== 6;
    
    if (isWeekday) {
      count++;
    }
    
    // Move to the next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return count;
}

// Helper function to generate PDF from HTML using Puppeteer
async function generatePDFFromHTML(htmlContent) {
  let browser = null;
  try {
    // Enhanced Puppeteer launch options
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
      timeout: 60000
    });
    
    const page = await browser.newPage();
    
    // Set viewport for better rendering
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    });
    
    // Wait for network idle to ensure all content is loaded
    await page.setContent(htmlContent, { 
      waitUntil: ['domcontentloaded', 'networkidle0'] 
    });
    
    // Generate PDF with enhanced options
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px',
      },
      preferCSSPageSize: true,
      timeout: 60000, // Increase timeout to 60 seconds
    });
    
    return pdfBuffer;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Attendance report generator
async function generateAttendanceReport(employee, startDate, endDate) {
  try {
    // Fetch attendance records for the date range
    const attendanceRecords = await Attendance.find({
      employeeId: employee.employeeId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });
    
    // Calculate statistics
    const totalWorkDays = getWorkingDaysBetweenDates(startDate, endDate);
    const presentDays = attendanceRecords.filter(record => record.status === 'Present').length;
    const absentDays = attendanceRecords.filter(record => record.status === 'Absent').length;
    const leaveDays = attendanceRecords.filter(record => record.status === 'Leave').length;
    const attendanceRate = totalWorkDays > 0 ? (presentDays / totalWorkDays) * 100 : 0;
    
    // Calculate total working hours
    let totalWorkingHours = 0;
    attendanceRecords.forEach(record => {
      if (record.sessions && record.sessions.length > 0) {
        record.sessions.forEach(session => {
          if (session.workingHours) {
            totalWorkingHours += session.workingHours;
          }
        });
      }
    });
    
    // Create summary box content
    const summaryItems = [
      { label: 'Working Days', value: totalWorkDays },
      { label: 'Present Days', value: presentDays },
      { label: 'Absent Days', value: absentDays },
      { label: 'Leave Days', value: leaveDays },
      { label: 'Attendance Rate', value: `${attendanceRate.toFixed(2)}%` },
      { label: 'Total Working Hours', value: totalWorkingHours }
    ];
    
    // Create attendance table
    const attendanceTable = `
      <h3>Attendance Details</h3>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Status</th>
            <th>Check In</th>
            <th>Check Out</th>
            <th>Working Hours</th>
          </tr>
        </thead>
        <tbody>
          ${attendanceRecords.map(record => {
            const date = format(new Date(record.date), 'dd MMM yyyy');
            let checkIn = '-';
            let checkOut = '-';
            let workingHours = '-';
            
            if (record.sessions && record.sessions.length > 0) {
              const session = record.sessions[0];
              if (session.logInTime) {
                checkIn = format(new Date(session.logInTime), 'hh:mm a');
              }
              if (session.logOutTime) {
                checkOut = format(new Date(session.logOutTime), 'hh:mm a');
              }
              if (session.workingHours) {
                workingHours = `${session.workingHours} hrs`;
              }
            }
            
            return `
              <tr>
                <td>${date}</td>
                <td>${record.status}</td>
                <td>${checkIn}</td>
                <td>${checkOut}</td>
                <td>${workingHours}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
    
    // Combine all content sections
    const content = `
      ${summaryBox('Attendance Summary', summaryItems)}
      ${attendanceTable}
    `;
    
    // Generate HTML using the template
    const htmlContent = createReportTemplate({
      title: 'Attendance Report',
      employeeInfo: { employee, startDate, endDate },
      content
    });
    
    // Generate PDF from HTML using Puppeteer
    return await generatePDFFromHTML(htmlContent);
  } catch (error) {
    console.error('Error in generateAttendanceReport:', error);
    throw error;
  }
}

// Leave report generator
async function generateLeaveReport(employee, startDate, endDate) {
  try {
    // Fetch leave records for the date range
    const leaveRecords = await Leave.find({
      employeeId: employee.employeeId,
      $or: [
        // Leave starts within the range
        { startDate: { $gte: startDate, $lte: endDate } },
        // Leave ends within the range
        { endDate: { $gte: startDate, $lte: endDate } },
        // Leave spans the entire range
        { startDate: { $lte: startDate }, endDate: { $gte: endDate } }
      ]
    }).sort({ startDate: 1 });
    
    // Calculate leave statistics
    const totalLeaves = leaveRecords.reduce((sum, record) => sum + record.totalDays, 0);
    const approvedLeaves = leaveRecords.filter(record => record.status === 'approved').reduce((sum, record) => sum + record.totalDays, 0);
    const pendingLeaves = leaveRecords.filter(record => record.status === 'pending').reduce((sum, record) => sum + record.totalDays, 0);
    const rejectedLeaves = leaveRecords.filter(record => record.status === 'rejected').reduce((sum, record) => sum + record.totalDays, 0);
    
    // Count leave types
    const leaveTypeCount = leaveRecords.reduce((acc, record) => {
      acc[record.leaveType] = (acc[record.leaveType] || 0) + record.totalDays;
      return acc;
    }, {});
    
    // Create summary box items
    const summaryItems = [
      { label: 'Total Leaves', value: totalLeaves },
      { label: 'Approved Leaves', value: approvedLeaves },
      { label: 'Pending Leaves', value: pendingLeaves },
      { label: 'Rejected Leaves', value: rejectedLeaves },
      { label: 'Total Leave Balance', value: employee.leaves?.balance || 0 }
    ];
    
    // Create leave types summary items
    const leaveTypeItems = Object.entries(leaveTypeCount).map(([type, count]) => ({
      label: type,
      value: count
    }));
    
    // Create leave details table
    const leaveTable = `
      <h3>Leave Details</h3>
      <table>
        <thead>
          <tr>
            <th>Leave Type</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Days</th>
            <th>Reason</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${leaveRecords.map(record => {
            const startDate = format(new Date(record.startDate), 'dd MMM yyyy');
            const endDate = format(new Date(record.endDate), 'dd MMM yyyy');
            const statusClass = `status-${record.status}`;
            
            return `
              <tr>
                <td>${record.leaveType}</td>
                <td>${startDate}</td>
                <td>${endDate}</td>
                <td>${record.totalDays}</td>
                <td>${record.reason}</td>
                <td class="${statusClass}">${record.status}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
    
    // Combine all content sections
    const content = `
      ${summaryBox('Leave Summary', summaryItems)}
      ${summaryBox('Leave Types', leaveTypeItems)}
      ${leaveTable}
    `;
    
    // Generate HTML using the template
    const htmlContent = createReportTemplate({
      title: 'Leave Report',
      employeeInfo: { employee, startDate, endDate },
      content
    });
    
    // Generate PDF from HTML using Puppeteer
    return await generatePDFFromHTML(htmlContent);
  } catch (error) {
    console.error('Error in generateLeaveReport:', error);
    throw error;
  }
}

// Example of how to create a new report type
async function generatePerformanceReport(employee, startDate, endDate) {
  try {
    // Fetch performance records
    const performanceRecords = await Performance.find({
      employeeId: employee.employeeId,
      evaluationDate: { $gte: startDate, $lte: endDate }
    }).sort({ evaluationDate: 1 });
    
    // Calculate performance metrics
    const averageRating = performanceRecords.reduce((sum, record) => 
      sum + record.overallRating, 0) / (performanceRecords.length || 1);
    
    // Create summary items
    const summaryItems = [
      { label: 'Evaluations', value: performanceRecords.length },
      { label: 'Average Rating', value: averageRating.toFixed(2) },
      // Add more performance metrics as needed
    ];
    
    // Create performance table
    const performanceTable = `
      <h3>Performance Evaluations</h3>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Evaluator</th>
            <th>Rating</th>
            <th>Comments</th>
          </tr>
        </thead>
        <tbody>
          ${performanceRecords.map(record => {
            const date = format(new Date(record.evaluationDate), 'dd MMM yyyy');
            
            return `
              <tr>
                <td>${date}</td>
                <td>${record.evaluatorName}</td>
                <td>${record.overallRating}</td>
                <td>${record.comments}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
    
    // Combine all content sections
    const content = `
      ${createSummaryBox('Performance Summary', summaryItems)}
      ${performanceTable}
    `;
    
    // Generate HTML using the template
    const htmlContent = createReportTemplate({
      title: 'Performance Report',
      employeeInfo: { employee, startDate, endDate },
      content
    });
    
    // Generate PDF from HTML
    return await generatePDFFromHTML(htmlContent);
  } catch (error) {
    console.error('Error in generatePerformanceReport:', error);
    throw error;
  }
}

export {
    createReportTemplate,
    summaryBox,
    generateAttendanceReport,
    generateLeaveReport,
    generatePerformanceReport
}