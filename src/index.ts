import express from "express";
import bodyParser from "body-parser";
import router from "./routes";


const app = express();
app.use(bodyParser.json());
app.use("/api", router);

const port = 3000;
app.listen(port, () => {
  console.log(`🚀 Notification service running on http://localhost:${port}`);  
});
