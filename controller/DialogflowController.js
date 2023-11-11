import DialogflowService from "../service/DialogflowService.js";
import Notification from "../model/notification.js";
import mongoose from "mongoose";

const dialogflowService = new DialogflowService(
  process.env.googleProjectID,
  process.env.dialogFlowSessionID,
  process.env.dialogFlowSessionLanguageCode
);

export default async function handleTextQuery(req, res) {
  const { text } = req.body;

  try {
    const result = await dialogflowService.detectTextIntent(text);
    const intentName = result.intent.displayName;
    console.log(intentName);

    switch (intentName) {
      case "new.order":
        dialogflowService.processNewOrder(result);
        break;
      case "add_order":
        if (!dialogflowService.order) {
          result.fulfillmentText = "Please make a new order. 🤓";
        } else {
          dialogflowService.processAddOrder(result);
        }
        break;
      case "order.remove":
        if (dialogflowService.order) {
          dialogflowService.processRemoveOrder(result);
        }
        break;
      case "order.completed":
        if (dialogflowService.pendingOrder.products.length > 0) {
          const buyer = new mongoose.Types.ObjectId();
          const admin = new mongoose.Types.ObjectId();
          const seller = new mongoose.Types.ObjectId();
          const entityId = new mongoose.Types.ObjectId();
          const content1 = "You have ordered products";
          const content2 = "You have received a new order.";
          
          // req.io.emit("buyerNotification", { message: content1 });
          // req.io.emit("sellerNotification", { message: content2 });

          dialogflowService.processOrderCompleted(result);

          const notification = await Notification.insertNotification(
            buyer,
            admin,
            "Making order",
            content1,
            "Order",
            entityId
          );

          await notification.save();
          const sellerNotification = await Notification.insertNotification(
            seller,
            admin,
            "Product Order",
            content2,
            "new order",
            entityId
          );
          await sellerNotification.save();
        }
        break;
      default:
    }

    res.send(result);
  } catch (error) {
    console.error("Error processing text query:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
