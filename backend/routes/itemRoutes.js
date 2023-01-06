import express from "express";
import {
  addItem,
  deleteItem,
  getItemById,
  getItems,
  updateItem,
  getTopRatedItems,
  getFilteredItems,
  addReview,
  getByWeather,
  getSimilar,
  getByRating,
  getRecommendation,
} from "../controllers/itemController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/").get(getItems).post(addItem);
router.post("/addReview", protect, addReview);
router.get("/top", getTopRatedItems);
router.get("/filteredItems", getFilteredItems);
router.get("/weather", getByWeather);
router.get("/similar", getSimilar);
router.get("/rating", protect, getByRating);
router.get("/recommendation", protect, getRecommendation);
router.route("/:id").get(getItemById).delete(deleteItem).put(updateItem);

export default router;
