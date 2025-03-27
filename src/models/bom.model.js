import mongoose, { Schema } from "mongoose";


// const bomSchema = new Schema({
//     name: { type: String, required: true }, // Item name (e.g., "Steel Cut Oats", "Honey", etc.)
//     category: { type: String, required: true }, // Category/type of item (e.g., "Oats", "Honey", "Pickle")
//     rm: { type: Schema.Types.Mixed, required: true } // Dynamic field to store the item's details
// }, {
//   timestamps: true, // Automatically adds createdAt and updatedAt
// });


const bomSchema = new Schema(
    {
        name: { type: String, required: true }, // Item name (e.g., "Steel Cut Oats", "Honey", etc.)
        category: { type: String, required: true }, // Category/type of item (e.g., "Oats", "Honey", "Pickle")
        rawMaterial: [
            {
                rm: { type: Schema.Types.ObjectId, ref: 'Item', required: true }, // Reference to RawMaterial collection
                quantity: { type: Number, required: true } // Quantity of the raw material used
            }
        ]
    },
    {
        timestamps: true // Automatically adds createdAt and updatedAt
    }
);

export const BOM = mongoose.model('Bom', bomSchema)
