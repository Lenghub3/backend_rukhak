import mongoose from "mongoose";
import { v4 as uuid } from "uuid";
const { Schema } = mongoose;

const pendingOrderSchema = new Schema({
  orderId: {
    type: String,
    default: uuid,
  },
  products: [String],
  quantities: [Number],
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const PendingOrder = mongoose.model("PendingOrder", pendingOrderSchema);

export default PendingOrder;
