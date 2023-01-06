import mongoose from "mongoose";

const userRecommendationSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  ingredient: [
    {
      name: {
        type: String,
      },
      score: {
        type: Number,
      },
    },
  ],
  type: [
    {
      name: {
        type: String,
      },
      count: {
        type: Number,
      },
    },
  ],
  category: [
    {
      name: {
        type: String,
      },
      count: {
        type: Number,
      },
    },
  ],
});

const UserRecommendation = mongoose.model(
  "UserRecommendation",
  userRecommendationSchema
);

export default UserRecommendation;
