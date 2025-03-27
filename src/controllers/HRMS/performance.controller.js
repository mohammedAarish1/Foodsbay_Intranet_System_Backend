import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { Employee } from "../../models/HRMS/employee.model.js";
import { Performance } from "../../models/HRMS/performance.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";


const addPerformanceReview = asyncHandler(async (req, res) => {
    const { employeeId, month, performance } = req.body;

    console.log('data', req.body);
    const employee = await Employee.findOne({ employeeId });

    if (!employee) {
        throw new ApiError(409, 'Employee not found')
    }

    if (employee.status !== 'Active') {
        throw new ApiError(409, 'Employee is not active')
    }

    // check if the performance review already exists for the employee and month
    const existingReview = await Performance.findOne({ employeeId, month });
    if (existingReview) {
        existingReview.performance.forEach(review => {
            if (review.evaluator === performance[0].evaluator) {
                throw new ApiError(409, `You have already submitted a review for this employee for ${month}`)
            }
        })
    }

    const performanceReview = await Performance.create(req.body)
    console.log('done')
    return res.status(200).json(
        new ApiResponse(200, performanceReview, "added successfully", "Success")
    );
})

export {
    addPerformanceReview
}