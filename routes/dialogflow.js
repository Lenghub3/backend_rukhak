const express = require("express");
const router = express.Router();
const dialogflow = require("dialogflow");
const { v4: uuid } = require("uuid");
const fs = require("fs/promises");

const config = require("../config/keys");
const projectId = config.googleProjectID;
const sessionId = config.dialogFlowSessionID;
const languageCode = config.dialogFlowSessionLanguageCode;

const sessionClient = new dialogflow.SessionsClient();
const sessionPath = sessionClient.sessionPath(projectId, sessionId);

let order = false;
let pendingOrder = {
  orderId: uuid(),
  products: [],
  quantities: [],
  timestamp: new Date().toISOString(),
};

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
  "grape"
];

async function readProductsFromFile() {
  try {
    const data = await fs.readFile("/path/to/products.json");
    products = JSON.parse(data);
  } catch (error) {
    console.error("Error reading products file:", error);
  }
}

async function storeOrder(order) {
  try {
    const data = await fs.readFile("/Users/anbschool0015/backend_rukhak/orders.json");
    const orders = JSON.parse(data);
    orders.push(order);
    await fs.writeFile("/Users/anbschool0015/backend_rukhak/orders.json", JSON.stringify(orders, null, 2));
    console.log("Order stored successfully.");
  } catch (error) {
    console.error("Error storing order:", error);
  }
}

router.post("/textQuery", async (req, res) => {
  const { text } = req.body;

  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text,
        languageCode,
      },
    },
  };

  try {
    const [response] = await sessionClient.detectIntent(request);
    const result = response.queryResult;

    console.log("Detected intent");
    console.log(`Query: ${result.queryText}`);
    console.log(`Response: ${result.fulfillmentText}`);

    if (result.intent.displayName === "new.order") {
      order = true;
    }

    if (result.intent.displayName === "add_order" && order) {
      const productItems = result.parameters.fields.product.listValue.values;
      const numbers = result.parameters.fields.number.listValue.values;

      if (productItems.length !== numbers.length) {
        result.fulfillmentText = "Please provide both product and quantity for each item.";
      } else {
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

      console.log("removeItems:", removeItems);
      console.log("removeNumbers:", removeNumbers);

      removeItems.forEach((item, index) => {
        const itemIndex = pendingOrder.products.indexOf(item.stringValue);
        console.log("itemIndex:", itemIndex);

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

      console.log("pendingOrder:", pendingOrder);
    }

    if (result.intent.displayName === "remove.order" && order) {
      const removeItems = result.parameters.fields.product.listValue.values;
      console.log("removeItems:", removeItems);

      removeItems.forEach((item) => {
        const itemIndex = pendingOrder.products.indexOf(item.stringValue);
        console.log("itemIndex:", itemIndex);

        if (itemIndex !== -1) {
          const indexToRemove = itemIndex;
          pendingOrder.products.splice(indexToRemove, 1);
          pendingOrder.quantities.splice(indexToRemove, 1);
        }
      });

      console.log("pendingOrder:", pendingOrder);
    }

    console.log(pendingOrder);

    if (result.intent.displayName === "show.product") {
      if (products.length > 0) {
        const productList = products.join("\n");
        result.fulfillmentText = `Here are all available products:\n${productList}`;
      } else {
        result.fulfillmentText = "No products are available at the moment.";
      }
    }

    if (result.intent.displayName === "order.completed" && pendingOrder.products.length > 0) {
      const combinedOrder = {};

      pendingOrder.products.forEach((product, index) => {
        combinedOrder[product] = (combinedOrder[product] || 0) + pendingOrder.quantities[index];
      });

      pendingOrder.products = Object.keys(combinedOrder);
      pendingOrder.quantities = Object.values(combinedOrder);

      const productQuantities = pendingOrder.products.map((product, index) => `${product}: ${pendingOrder.quantities[index]}`);
      const orderDetails = productQuantities.join(", ");

      result.fulfillmentText = `You have ordered\n(${orderDetails}) Do you want to checkout ?`;

      await storeOrder(pendingOrder);
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

    res.send(result);
  } catch (error) {
    console.error("Error processing text query:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/eventQuery", async (req, res) => {
  const { event } = req.body;

  const request = {
    session: sessionPath,
    queryInput: {
      event: {
        name: event,
        languageCode,
      },
    },
  };

  try {
    const [response] = await sessionClient.detectIntent(request);
    const result = response.queryResult;

    console.log("Detected intent");
    console.log(`Query: ${result.queryText}`);
    console.log(`Response: ${result.fulfillmentText}`);

    res.send(result);
  } catch (error) {
    console.error("Error processing event query:", error);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
