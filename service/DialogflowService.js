const dialogflow = require("dialogflow");

class DialogflowService {
  constructor(projectId, sessionId, languageCode) {
    // Create a SessionsClient and set up the session path and language code.
    this.sessionClient = new dialogflow.SessionsClient();
    this.sessionPath = this.sessionClient.sessionPath(projectId, sessionId);
    this.languageCode = languageCode;
  }

  async detectTextIntent(text) {
    // Create a request object for detecting intent.
    const request = {
      session: this.sessionPath,
      queryInput: {
        text: {
          text,
          languageCode: this.languageCode,
        },
      },
    };

    try {
      // Use the sessionClient to detect the intent and return the query result.
      const [response] = await this.sessionClient.detectIntent(request);
      return response.queryResult;
    } catch (error) {
      console.error("Error detecting text intent:", error);
      throw error;
    }
  }

  // Method to process a text query, update the order, and handle various intents.
  async processTextQuery(text, order, pendingOrder, products) {
    const result = await this.detectTextIntent(text);

    if (result.intent.displayName === "new.order") {
      order = true;
    }

    // Check if the intent is "add_order" and there is an active order.
    if (result.intent.displayName === "add_order" && order) {

      const productItems = result.parameters.fields.product.listValue.values;
      const numbers = result.parameters.fields.number.listValue.values;

      if (productItems.length !== numbers.length) {
        result.fulfillmentText = "Please provide both product and quantity for each item.";
      } else {
        // Add products and quantities to the pending order.
        productItems.forEach((item, index) => {
          pendingOrder.products.push(item.stringValue);
          pendingOrder.quantities.push(numbers[index].numberValue);
        });
      }
    } else if (result.intent.displayName === "add_order" && !order) {
      result.fulfillmentText = "You cannot add items to the order until a new order is created.";
    }

    if (result.intent.displayName === "order.remove" && order) {
  
      const removeItems = result.parameters.fields.product.listValue.values;
      const removeNumbers = result.parameters.fields.number.listValue.values;

      removeItems.forEach((item, index) => {
        const itemIndex = pendingOrder.products.indexOf(item.stringValue);

        if (itemIndex !== -1) {
          const indexToRemove = itemIndex;

          if (removeNumbers.length > index) {
            const quantityToRemove = removeNumbers[index].numberValue;

            if (quantityToRemove < pendingOrder.quantities[indexToRemove]) {
              pendingOrder.quantities[indexToRemove] -= quantityToRemove;
            } else {
              pendingOrder.products.splice(indexToRemove, 1);
              pendingOrder.quantities.splice(indexToRemove, 1);
            }
          } else {
            pendingOrder.products.splice(indexToRemove, 1);
            pendingOrder.quantities.splice(indexToRemove, 1);
          }
        }
      });
    }
    if (result.intent.displayName === "remove.order" && order) {
      // Extract items to remove from the intent.
      const removeItems = result.parameters.fields.product.listValue.values;

      removeItems.forEach((item) => {
        const itemIndex = pendingOrder.products.indexOf(item.stringValue);

        if (itemIndex !== -1) {
          const indexToRemove = itemIndex;
          pendingOrder.products.splice(indexToRemove, 1);
          pendingOrder.quantities.splice(indexToRemove, 1);
        }
      });
    }

    // Check if the intent is "show.product" and there are products available.
    if (result.intent.displayName === "show.product") {
      if (products.length > 0) {
        const productList = products.join("\n");
        result.fulfillmentText = `Here are all available products:\n${productList}`;
      } else {
        result.fulfillmentText = "No products are available at the moment.";
      }
    }

    // Check if the intent is "order.completed" and there are items in the pending order.
    if (result.intent.displayName === "order.completed" && pendingOrder.products.length > 0) {
    
      const combinedOrder = {};

      pendingOrder.products.forEach((product, index) => {
        combinedOrder[product] = (combinedOrder[product] || 0) + pendingOrder.quantities[index];
      });

      pendingOrder.products = Object.keys(combinedOrder);
      pendingOrder.quantities = Object.values(combinedOrder);

      // Create a text representation of the order details.
      const productQuantities = pendingOrder.products.map((product, index) => `${product}: ${pendingOrder.quantities[index]}`);
      const orderDetails = productQuantities.join(", ");

      // Set the fulfillment text and store the order.
      result.fulfillmentText = `You have ordered\n(${orderDetails}) Do you want to checkout ?`;

      await storeOrder(pendingOrder);

      // Reset the pending order and order flag.
      pendingOrder = {
        orderId: uuid(),
        products: [],
        quantities: [],
        timestamp: new Date().toISOString(),
      };
      order = false;
    } else if (result.intent.displayName === "order.completed" && pendingOrder.products.length === 0) {
      result.fulfillmentText = "Bro why are you not order something before checkout";
    }

    return result;
  }
}

module.exports = DialogflowService;
