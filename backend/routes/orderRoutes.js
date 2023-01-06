import express from "express";

import { admin, protect } from "../middleware/authMiddleware.js";

import {
  create,
  update,
  viewAll,
  viewByUser,
  viewOne,
} from "../controllers/orderController.js";

const router = express.Router();

router.post("/create", protect, create);

router.put("/update/:id", protect, update);

router.get("/all", protect, admin, viewAll);

router.get("/byUser", protect, viewByUser);

router.get("/single/:id", protect, viewOne);

export default router;
