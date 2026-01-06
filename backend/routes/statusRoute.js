const express = require('express');
const statusController = require('../controllers/statusController');
const { authMiddleware } = require("../middleware/authMiddleware");
const { multerMiddleware } = require("../config/cloudinaryConfig");

const router = express.Router();

//protected routes
router.post('/create', authMiddleware, multerMiddleware, statusController.CreateStatus);
router.get('/getStatus', authMiddleware, statusController.getStatus);
router.put('/:statusId/view', authMiddleware, statusController.viewStatus);
router.delete('/:statusId', authMiddleware, statusController.deleteStatus);
module.exports = router;