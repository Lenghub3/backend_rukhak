const DialogflowService = require("../service/DialogflowService");

const config = require("../config/keys");

let order = false;
const dialogflowService = new DialogflowService(
  config.googleProjectID,
  config.dialogFlowSessionID,
  config.dialogFlowSessionLanguageCode
);

module.exports = {
  handleTextQuery: async (req, res) => {
    const { text } = req.body;

    try {
      const result = await dialogflowService.detectTextIntent(text);

      // Use the helper functions from DialogflowService to process the result
      if (result.intent.displayName === "new.order") {
        dialogflowService.processNewOrder(result);
      }

      if (
        result.intent.displayName === "add_order" &&
        dialogflowService.order
      ) {
        dialogflowService.processAddOrder(result);
      }

      if (
        result.intent.displayName === "order.remove" &&
        dialogflowService.order
      ) {
        dialogflowService.processRemoveOrder(result);
      }

      if (result.intent.displayName === "show.product") {
        dialogflowService.processShowProducts(result);
      }

      if (
        result.intent.displayName === "order.completed" &&
        dialogflowService.pendingOrder.products.length > 0
      ) {
        dialogflowService.processOrderCompleted(result);
        const io = req.app.locals.io;
        io.emit("orderStored", { message: "You have ordered producted" });
      } else if (
        result.intent.displayName === "order.completed" &&
        dialogflowService.pendingOrder.products.length === 0
      ) {
        result.fulfillmentText =
          "Bro why are you not ordering something before checkout";
      }

      res.send(result);
    } catch (error) {
      console.error("Error processing text query:", error);
      res.status(500).send("Internal Server Error");
    }
  },
};
