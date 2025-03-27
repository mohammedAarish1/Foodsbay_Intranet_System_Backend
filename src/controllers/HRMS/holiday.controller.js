import { Holiday } from "../../models/HRMS/holiday.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const addHoliday = asyncHandler(async (req, res) => {
  // 1. store the data from the request body
  const data = req.body;
  // const { name, date, type, status, description, notes } = req.body;


  // 3. check if any holiday with same name already exists
  // const existingHoliday = await Holiday.findOne({ date: data.date });

  // // 4. return the error message if the item already exists
  // if (existingHoliday) {
  //   throw new ApiError(409, 'Holiday for this date already exists');
  // }

  // 5. Create a new holiday using the Item model
  const holiday = new Holiday(data);
  // // 6. Save item to the database 
  await holiday.save();

  // // 7. Return the created item with response
  return res.status(201).json(
    new ApiResponse(200, holiday || {}, "Holiday Added successfully", "Success")
  )
});


const getHolidayList = asyncHandler(async (req, res) => {
  const holidayList = await Holiday.find().sort({ date: -1 });
  return res.status(201).json(
    new ApiResponse(200, holidayList.length > 0 ? holidayList : [], "Holiday Added successfully", "Success")
  )

})



// delete an item from the database
const deleteHoliday = asyncHandler(async (req, res) => {
  const { id } = req.params;  // Extract the purchase ID from the URL parameters
  // Check if the item exists in the database
  const holiday = await Holiday.findById(id);

  if (!holiday) {
    // If the holiday doesn't exist, return a 404 error
    throw new ApiError(404, 'Holiday not found');
  }

  // Delete the item from the database
  await Holiday.findByIdAndDelete(id);
  // Return a success response
  return res.status(200).json(
    new ApiResponse(200, { id }, "Deleted successfully", "Success")
  );

});

export {
  addHoliday,
  getHolidayList,
  deleteHoliday
}