import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { Employee } from "../../models/HRMS/employee.model.js";
import { Performance } from "../../models/HRMS/performance.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";


const calculateRatings = (performance) => {
    // Initialize variables to store total ratings and count of reviews
    let totalRating = 0;
    let totalReviews = 0;
    let totalMaxRating = 0;


    // For each employee, go through all evaluators
    performance.forEach(evaluator => {
        evaluator.review.forEach(review => {
            // Add the rating to the totalRating
            totalRating += review.rating;
            totalMaxRating += 5; // Assume max rating is 5
            totalReviews += 1;
        });
    });


    // Calculate average rating
    const averageRating = totalReviews === 0 ? 0 : totalRating / totalReviews;

    // Calculate rating percentage
    const ratingPercentage = totalReviews === 0 ? 0 : (totalRating / totalMaxRating) * 100;

    return {
        averageRating: averageRating.toFixed(2),
        ratingPercentage: ratingPercentage.toFixed(2),
    };
};


const addPerformanceReview = asyncHandler(async (req, res) => {
    const payload = req.body;
    const { employeeId, month, performance } = payload;

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
        // check if the evaluator already added the rating for this employee
        existingReview.performance.forEach(review => {
            if (review.evaluator === performance.evaluator) {
                throw new ApiError(409, `You have already submitted a review for this Employee for ${month}`)
            }
        })

        // if not , add the new rating to the existing review
        existingReview.performance.push(performance);
        // console.log('existingReview performance',existingReview.performance)
        const { averageRating, ratingPercentage } = calculateRatings(existingReview.performance)
        existingReview.averageRating = averageRating
        existingReview.ratingPercentage = ratingPercentage
        await existingReview.save();
    } else {
        const { averageRating, ratingPercentage } = calculateRatings([performance])
        console.log('averagerating', averageRating)
        console.log('ratingPercentage', ratingPercentage)
        payload.averageRating = averageRating
        payload.ratingPercentage = ratingPercentage
        await Performance.create(payload)
    }


    // console.log('performanceReview', performanceReview)
    return res.status(200).json(
        new ApiResponse(200, {}, "Rating Added successfully", "Success")
    );
})

export {
    addPerformanceReview
}