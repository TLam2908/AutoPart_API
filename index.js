const express = require("express");
const bodyParser = require("body-parser");
const manufacturerRouter = require("./routes/autopart_manufacturer");
const categoryRouter = require("./routes/autopart_category");
const vehicalModelRouter = require("./routes/autopart_vehical_model");
const autopartRouter = require("./routes/autopart");

const app = express();
const port = 3000;

app.use(bodyParser.json()); // Để parse JSON bodies
app.use(bodyParser.urlencoded({ extended: true })); // Để parse URL-encoded bodies

app.use("/api", manufacturerRouter);
app.use("/api", categoryRouter);
app.use("/api", vehicalModelRouter);
app.use("/api", autopartRouter);

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});


