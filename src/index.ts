import express from "express";
import { PORT } from "./utils/env";
import cors from "cors";
import db from "./utils/database";
import bodyParser from "body-parser";
import router from "./routes/api";
import errorMiddleware from "./middlewares/error.middleware";

const app = express();

app.use(cors());

app.use(bodyParser.json());

app.use("/api", router);

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Hello from back-end-acara!",
    data: null,
  });
});

// docs(app);

app.use(errorMiddleware.serverRoute());
app.use(errorMiddleware.serverError());

async function init() {
  try {
    const result = await db();
    console.log("database status", result);

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.log(error);
  }
}

init();
export default app;
