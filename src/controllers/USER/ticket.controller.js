import { Ticket } from "../../models/USER/ticket.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js"

const createTicket = asyncHandler(async (req, res) => {
    const data = req.body.formData;

    const ticket = await Ticket.create(data);

    return res.status(200).json(
        new ApiResponse(200, ticket || {}, "Ticket created successfully", "Success")
    );
})

const getUserTicketList = asyncHandler(async (req, res) => {
    const { id } = req.params
    const ticketList = await Ticket.find({ employeeId: id }).sort({ createdAt: -1 })

    console.log('tickellist', ticketList.length)

    return res.status(200).json(
        new ApiResponse(200, ticketList || [], "Ticket list fetched successfully", "Success")
    );
})

export {
    createTicket,
    getUserTicketList
}