const DialogflowService = require("../service/DialogflowService");
const fs = require("fs/promises");
const uuid = require("uuid").v4; 
const config = require("../config/keys");

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

const dialogflowService = new DialogflowService(
  config.googleProjectID,
  config.dialogFlowSessionID,
  config.dialogFlowSessionLanguageCode
);

module.exports = {
  handleTextQuery: async (req, res) => {
    const { text } = req.body;
    try {
      const result = await dialogflowService.processTextQuery(text, order, pendingOrder, products);
      res.send(result);
    } catch (error) {
      console.error("Error processing text query:", error);
      res.status(500).send("Internal Server Error");
    }
  },
};
