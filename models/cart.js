import mongoose from "mongoose";
const cartSchema = new mongoose.Schema(
    {
        events: {
            type:{},
            required: true
        },
        name: {
            type: String,
            required: true
        },
        gender: {
            type:{},
            required: true
        },
        nationality: {
            type:{},
            required: true
        },
        residence: {
            type:{},
            required: true
        },
        email: {
            type: String,
            required: true
        },
        phone: {
            type:{},
            required: true
        },
        price: {
            type: {},
            required: true
        }
    },{timestamps: true}
)
export default mongoose.model("Cart", cartSchema);
