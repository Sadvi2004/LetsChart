const router = require("express").Router();
const { chatAI } = require("../controllers/aiController");

router.post("/chat", chatAI);

module.exports = router;