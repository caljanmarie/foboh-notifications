import express from "express";
import bodyParser from "body-parser";
import router from "./routes";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger";


const app = express();
app.use(bodyParser.json());
app.use("/api", router);


// Swagger docs
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const port = 3000;
app.listen(port, () => {
  console.log(`🚀 Notification service running on http://localhost:${port}`);  
});
