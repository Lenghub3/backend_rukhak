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
      case "show.product":
        dialogflowService.processShowProducts(result);
        break;
      case "order.completed":
        if (dialogflowService.pendingOrder.products.length > 0) {
          dialogflowService.processOrderCompleted(result);

          const userId = new mongoose.Types.ObjectId();
          const senderUserId = new mongoose.Types.ObjectId();
          const entityId = new mongoose.Types.ObjectId();

          const notification = await Notification.insertNotification(
            userId,
            senderUserId,
            "Order",
            entityId
          );
          await notification.save();

          // Emit the event within the context of a connected socket
          req.io.emit("orderStored", { message: "You have ordered products." });
        } else {
          result.fulfillmentText =
            "Bro, why are you not ordering something before checkout?";
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
