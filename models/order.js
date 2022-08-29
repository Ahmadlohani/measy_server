import mongoose from "mongoose";
const orderSchema = new mongoose.Schema(
    {
        order_id: {
            type: String,
            required: true
        },
        status: {
            type: String,
            required: true
        },
        payer: {
            type:{},
            required: true
        },
        purchase_units: {
            type:[],
            required: true
        },
    },{timestamps: true}
)
export default mongoose.model("Order", orderSchema);
