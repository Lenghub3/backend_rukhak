const express = require("express");
const router = express.Router();
const dialogflow = require("dialogflow");
const uuid = require("uuid");
const fs = require("fs");

const config = require("../config/keys");

const projectId = config.googleProjectID;
const sessionId = config.dialogFlowSessionID;
const languageCode = config.dialogFlowSessionLanguageCode;

const sessionClient = new dialogflow.SessionsClient();
const sessionPath = sessionClient.sessionPath(projectId, sessionId);
let order = false;
let pendingOrder = {
  orderId: uuid.v4(),
  products: [],
  quantities: [],
  timestamp: new Date().toISOString(),
}; 

let products = ["Cacao tree","cotton","sun flowers","happy leaf","soybeans","mango tree"]; 


try {
  const data = fs.readFileSync("/path/to/products.json");
  products = JSON.parse(data);
} catch (error) {
}

function generateOrderID() {
  return uuid.v4();
}

function storeOrder(order) {
  let orders = [];

  try {
    const data = fs.readFileSync("/Users/anbschool0015/backend_rukhak/orders.json");
    orders = JSON.parse(data);
  } catch (error) {}

  orders.push(order);

  fs.writeFileSync(
    "/Users/anbschool0015/backend_rukhak/orders.json",
    JSON.stringify(orders, null, 2)
  );

  console.log("Order stored successfully.");
}

router.post("/textQuery", async (req, res) => {
  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: req.body.text,
        languageCode: languageCode,
      },
    },
  };

  const responses = await sessionClient.detectIntent(request);
  console.log("Detected intent");
  const result = responses[0].queryResult;
  console.log(`  Query: ${result.queryText}`);
  console.log(`  Response: ${result.fulfillmentText}`);

  if (result.intent.displayName === "new.order") {
    order = true;
  }

  if (result.intent.displayName === "add_order" && order) {
    const productItems = result.parameters.fields.product.listValue.values;
    const numbers = result.parameters.fields.number.listValue.values;

    if (productItems.length !== numbers.length) {
      result.fulfillmentText = "Please provide both product and quantity for each item.";
    } else {
      productItems.forEach((item) => pendingOrder.products.push(item.stringValue));
      numbers.forEach((item) => pendingOrder.quantities.push(item.numberValue));
    }
  } else if (result.intent.displayName === "add_order" && !order) {
    result.fulfillmentText = "You cannot add items to the order until a new order is created.";
  }
  if (result.intent.displayName === "show.product") {
    if (products.length > 0) {
      const productList = products.join("\n"); // Modify the join function to use newline character
      result.fulfillmentText = `Here are all available products:\n${productList}`;
    } else {
      result.fulfillmentText = "No products are available at the moment.";
    }
  }
  
  if (result.intent.displayName === "order.completed" && pendingOrder.products.length > 0) {
    storeOrder(pendingOrder);
    pendingOrder = {
      orderId: uuid.v4(),
      products: [],
      quantities: [],
      timestamp: new Date().toISOString(),
    }; 
    result.fulfillmentText = "Order completed. Your order has been saved.";
    order = false;
  }

  res.send(result);
});

router.post("/eventQuery", async (req, res) => {
  const request = {
    session: sessionPath,
    queryInput: {
      event: {
        name: req.body.event,
        languageCode: languageCode,
      },
    },
  };

  const responses = await sessionClient.detectIntent(request);
  console.log("Detected intent");
  const result = responses[0].queryResult;
  console.log(`  Query: ${result.queryText}`);
  console.log(`  Response: ${result.fulfillmentText}`);
  res.send(result);
});

module.exports = router;
