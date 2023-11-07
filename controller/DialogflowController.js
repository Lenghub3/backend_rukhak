const DialogflowService = require("../service/DialogflowService");
const config = require("../config/keys");

const dialogflowService = new DialogflowService(
  config.googleProjectID,
  config.dialogFlowSessionID,
  config.dialogFlowSessionLanguageCode
);

module.exports = {
  handleTextQuery: async (req, res) => {
    const { text } = req.body;

    try {
      // Use async/await to make the code more readable
      const result = await dialogflowService.detectTextIntent(text);
      const intentName = result.intent.displayName;

      switch (intentName) {
        case "new.order":
          dialogflowService.processNewOrder(result);
          break;
        case "add_order":
          if (dialogflowService.order) {
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
            const io = req.app.locals.io;
            io.emit("orderStored", { message: "You have ordered products." });
          } else {
            result.fulfillmentText = "Bro, why are you not ordering something before checkout?";
          }
          break;
        default:
      }

      res.send(result);
    } catch (error) {
      console.error("Error processing text query:", error);
      // Use appropriate HTTP status codes for error responses
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
};
