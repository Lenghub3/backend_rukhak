const dialogflow = require("dialogflow");
const fs = require("fs/promises");
const { v4: uuid } = require("uuid");

let products = [
  "Cacao tree",
  "cotton",
  "sun flowers",
  "happy leaf",
  "soybeans",
  "mango tree",
  "Oak tree",
  "Apple",
  "banana",
  "kiwi",
  "melon",
  "mango",
  "grape",
];

class DialogflowService {
  constructor(projectId, sessionId, languageCode) {
    this.sessionClient = new dialogflow.SessionsClient();
    this.sessionPath = this.sessionClient.sessionPath(projectId, sessionId);
    this.languageCode = languageCode;
    this.order = false; 
    this.pendingOrder = {
      orderId: uuid(), 
      products: [],
      quantities: [],
      timestamp: new Date().toISOString(),
    };
  }

  async detectTextIntent(text) {
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
      const [response] = await this.sessionClient.detectIntent(request);
      return response.queryResult;
    } catch (error) {
      console.error("Error detecting text intent:", error);
      throw error;
    }
  }

  processNewOrder(result) {
    // Logic for processing a new order
    this.order = true; // Set the order flag to true
  }

  processAddOrder(result) {
    // Logic for adding items to an order
    const productItems = result.parameters.fields.product.listValue.values;
    const numbers = result.parameters.fields.number.listValue.values;

    if (productItems.length !== numbers.length) {
      result.fulfillmentText = "Please provide both product and quantity for each item.";
    } else {
      productItems.forEach((item, index) => {
        this.pendingOrder.products.push(item.stringValue);
        this.pendingOrder.quantities.push(numbers[index].numberValue);
      });
    }
  }

  processRemoveOrder(result) {
    // Logic for removing items from an order
    const removeItems = result.parameters.fields.product.listValue.values;
    const removeNumbers = result.parameters.fields.number.listValue.values;

    removeItems.forEach((item, index) => {
      const itemIndex = this.pendingOrder.products.indexOf(item.stringValue);

      if (itemIndex !== -1) {
        const indexToRemove = itemIndex;

        if (removeNumbers.length > index) {
          const quantityToRemove = removeNumbers[index].numberValue;

          if (quantityToRemove < this.pendingOrder.quantities[indexToRemove]) {
            this.pendingOrder.quantities[indexToRemove] -= quantityToRemove;
          } else {
            this.pendingOrder.products.splice(indexToRemove, 1);
            this.pendingOrder.quantities.splice(indexToRemove, 1);
          }
        } else {
          this.pendingOrder.products.splice(indexToRemove, 1);
          this.pendingOrder.quantities.splice(indexToRemove, 1);
        }
      }
    });
  }

  processShowProducts(result) {
    // Logic for showing available products
    if (products.length > 0) {
      const productList = products.join("\n");
      result.fulfillmentText = `Here are all available products:\n${productList}`;
    } else {
      result.fulfillmentText = "No products are available at the moment.";
    }
  }

  async storeOrder(order) {
    try {
      const filePath = "/Users/anbschool0015/backend_rukhak/orders.json";
      let orders = [];

      try {
        const data = await fs.readFile(filePath, "utf8"); // Read file as UTF-8
        orders = JSON.parse(data);
      } catch (readError) {
        console.error("Error reading orders file:", readError);
      }

      orders.push(order);

      await fs.writeFile(filePath, JSON.stringify(orders, null, 2), "utf8"); // Write file as UTF-8
      console.log("Order stored successfully.");
    } catch (error) {
      console.error("Error storing order:", error);
    }
  }

  processOrderCompleted(result) {
    // Logic for handling an order completion
    if (this.pendingOrder.products.length > 0) {
      const combinedOrder = {};

      this.pendingOrder.products.forEach((product, index) => {
        combinedOrder[product] = (combinedOrder[product] || 0) + this.pendingOrder.quantities[index];
      });

      this.pendingOrder.products = Object.keys(combinedOrder);
      this.pendingOrder.quantities = Object.values(combinedOrder);

      const productQuantities = this.pendingOrder.products.map(
        (product, index) => `${product}: ${this.pendingOrder.quantities[index]}`
      );
      const orderDetails = productQuantities.join(", ");

      result.fulfillmentText = `You have ordered\n(${orderDetails}) Do you want to checkout ?`;

      // Call the storeOrder function
      this.storeOrder(this.pendingOrder);
      
      this.pendingOrder = {
        orderId: uuid(), // Add a unique identifier
        products: [],
        quantities: [],
        timestamp: new Date().toISOString(),
      };
      
      this.order = false; // Set the order flag to false
    } else {
      result.fulfillmentText = "Bro, why are you not ordering something before checkout?";
    }
  }
}

module.exports = DialogflowService;
