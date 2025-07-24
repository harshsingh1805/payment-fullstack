const express = require("express");
const cors = require("cors");
const app = express();
const rootRouter = require("./routes/index.js");

//middleware
app.use(cors());
app.use(express.json()); //body parser middleware
app.use('/api/v1',rootRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
