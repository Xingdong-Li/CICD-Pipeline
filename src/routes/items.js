const express = require("express");
const router = express.Router();

let items = [];

router.get("/", (req, res) => {
  res.status(200).json(items);
});

router.post("/", (req, res) => {
  const item = req.body;
  items.push(item);
  res.status(201).json(item);
});

router.put("/:id", (req, res) => {
  const id = req.params.id;
  const updatedItem = req.body;
  items = items.map((item) => (item.id === id ? updatedItem : item));
  res.status(200).json(updatedItem);
});

router.delete("/:id", (req, res) => {
  const id = req.params.id;
  items = items.filter((item) => item.id !== id);
  res.status(200).send();
});

module.exports = router;
