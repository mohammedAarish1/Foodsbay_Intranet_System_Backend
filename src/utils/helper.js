import { User } from "../models/user.model.js";
import { ApiError } from "./ApiError.js"
import jwt from 'jsonwebtoken';

// const generateTokens=async(userId)=>{
//     try {
//         const user= await User.findById(userId);
//         if(!user) {
//             throw new ApiError(404, "User not found");
//         }

//         const accessToken=user.generateAccessToken();
//         const refreshToken=user.generateRefreshToken();

//         user.refreshToken=refreshToken
//         await user.save({validateBeforeSave:false});

//         return {accessToken,refreshToken};

//     } catch (error) {
//         throw new ApiError(500,error.message || 'Error generating tokens');

//     }
// }


const generateTokens = (userId) => {
  const accessToken = jwt.sign({ _id: userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: '1h',
  });

  const refreshToken = jwt.sign({ _id: userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: '7d',
  });


  return { accessToken, refreshToken };
};


// function to convert string (actual numbers) into numbers
const parsedData = (data) => {
  const convertedData = {};
  Object.keys(data).forEach((key) => {
    const value = data[key];
    // Check if the value is an empty string
    if (value === "") {
      convertedData[key] = value; // Keep the empty string as is
    } else {
      convertedData[key] = !isNaN(value) ? parseFloat(value) : value; // Convert only if it's a valid number
    }
  });

  return convertedData;
}

// convert the date into readbale format
function formatDate(date, format='') {
  if (!date) return null;

  switch (format) {
    case 'date':
      return new Date(date).toLocaleDateString();
    case 'time':
      return new Date(date).toLocaleTimeString();
    case 'datetime':
      return new Date(date).toLocaleString();
    default:
      return new Date(date).toLocaleDateString();
  }
}


// helper function to calculate the total hours worked by an employee
const calculateTotalHours = (inTime, outTime) => {
  const logInTime = new Date(inTime);
  const logOutTime = new Date(outTime);
  const workingHours = (logOutTime - logInTime) / (1000 * 60 * 60);
  // attendance.workingHours = Math.round(workingHours * 100) / 100; // Round to 2 decimal places
  return parseFloat(workingHours.toFixed(2));; // Round to 2 decimal places
}

export {
  generateTokens,
  parsedData,
  formatDate,
  calculateTotalHours
}