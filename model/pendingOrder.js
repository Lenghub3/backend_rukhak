const mongoose = require("mongoose");
const { v4: uuid } = require("uuid");
const Schema = mongoose.Schema;
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

module.exports = PendingOrder; 
