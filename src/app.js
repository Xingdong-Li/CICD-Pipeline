const express = require('express');
const app = express();
const itemsRouter = require('./routes/items');

app.use(express.json());
app.use('/items', itemsRouter);

const port = process.env.PORT || 8080;
const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = server; // Export the server instance
