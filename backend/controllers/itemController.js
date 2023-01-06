// const mongoose = require("mongoose");
// const ObjectId = mongoose.Types.ObjectId;

import asyncHandler from "express-async-handler";
import Item from "../models/itemModel.js";
import Order from "../models/orderModel.js";
import UserRecommendation from "../models/userRecommendationModel.js";

//@desc GET all items
//@routes GET/api/items
//@access public

const getItems = asyncHandler(async (req, res) => {
  const items = await Item.find(
    {},
    {
      reviews: 0,
      details: 0,
      ingredients: 0,
      allergens: 0,
      countInStock: 0,
    }
  ).sort("-createdAt");
  res.json(items);
});
//@desc Add an Item
//@route POST/api/items
//@access Private/ Admin

const addItem = asyncHandler(async (req, res) => {
  const {
    image,
    name,
    type,
    category,
    price,
    numReviews,
    rating,
    countInStock,
    ingredients,
    allergens,
    details,
    feel,
  } = req.body;

  const item = await Item.create({
    image,
    name,
    type,
    category,
    price,
    numReviews,
    rating,
    countInStock,
    ingredients,
    allergens,
    details,
    feel,
  });

  const createdItem = await item.save();
  res.status(201).json(createdItem);
});

//@desc Fetch single item
//@route GET/api/items/:id
//@access Public

const getItemById = asyncHandler(async (req, res) => {
  const item = await Item.findById(req.params.id);

  if (item) {
    res.json(item);
  } else {
    res.status(404);
    throw new Error("item Not Found");
  }
});

//@desc DELETE item
//@route DELETE/api/items/:id
//@access Private/ Admin

const deleteItem = asyncHandler(async (req, res) => {
  const item = await Item.findById(req.params.id);
  if (item) {
    await item.remove();
    res.json({ message: "item removed successfully!!" });
  } else {
    res.status(404);
    throw new Error("item Not Found");
  }
});

//   if (!item) {
//     res.status(404);
//   } else {
//     await fs.unlink(`.${item.image}`, (err) => {
//       // if (err) {
//       //   throw console.error(err);
//       // }
//     });
//     await item.remove();
//   }
//   res.send(item);
//   res.json({ message: "Item removed successfully!!" });
// });
//@desc Update an item
//@route PUT/api/item/:id
//@access Private/ Admin

const updateItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    image,
    name,
    type,
    category,
    price,
    numReviews,
    rating,
    countInStock,
    ingredients,
    allergens,
    feel,
    details,
  } = req.body;
  const item = await Item.findById(id);

  if (item) {
    item.image = image;
    item.name = name;
    item.type = type;
    item.category = category;
    item.price = price;
    item.countInStock = countInStock || item.countInStock;
    item.rating = rating || item.rating;
    item.numReviews = numReviews || item.numReviews;
    item.ingredients = ingredients;
    item.allergens = allergens;
    item.details = details;
    item.feel = feel;

    const updatedItem = await item.save();
    res.json(updatedItem);
  } else {
    res.status(404);
    throw new Error("item not found");
  }
});

//@desc Get Top rated items
//@route GET/api/items/top
//@access Public

const getTopRatedItems = asyncHandler(async (req, res) => {
  const topItems = await Item.find({}).sort({ rating: -1 }).limit(4);
  res.json(topItems);
});

//@desc GET filtered Items
//@routes GET/api/items/filteredItems
//@access public

const getFilteredItems = asyncHandler(async (req, res) => {
  const allergy = req.query.allergy.split(",");
  try {
    const result = await Item.find({ allergens: { $nin: [...allergy] } });
    res.json(result);
  } catch (err) {
    res.status(404);
    console.log(err.message);
  }
});

const addReview = asyncHandler(async (req, res) => {
  try {
    const { name, _id } = req.user;
    const { rating, comment, itemId } = req.body;

    const item = await Item.findById(itemId);

    if (item) {
      const date = new Date().toISOString();
      const totalRating =
        (item.rating * item.numReviews + rating) / (item.numReviews + 1);
      const review = { name, rating, comment, date, user: _id };
      item.reviews = [...item.reviews, review];
      item.numReviews = item.numReviews + 1;
      item.rating = totalRating;
    }
    const result = await item.save();

    res.json(result);
  } catch (err) {
    res.status(404);
    console.log(err.message);
  }
});

const getByWeather = asyncHandler(async (req, res) => {
  const { feel } = req.query;

  const result = await Item.find({ feel: feel }).sort({ rating: -1 }).limit(8);

  res.status(201).json(result);
});

const getSimilar = asyncHandler(async (req, res) => {
  const { category, id } = req.query;

  const result = await Item.find({ _id: { $ne: id }, category: category })
    .sort({ rating: -1 })
    .limit(4);

  res.status(201).json(result);
});

const getByRating = asyncHandler(async (req, res) => {
  const { _id } = req.user;

  const reviews = await Item.find({
    reviews: { $elemMatch: { user: _id } },
  });

  if (!reviews || reviews.length === 0) {
    res.status(201).json([]);
  }

  var latestDate = Number.MIN_SAFE_INTEGER;
  var latestReview;

  for (const entry of reviews) {
    const tempReview = entry.reviews.find(
      (i) => i.user.toString() === _id.toString()
    );
    const dateInNumber = new Date(tempReview.date).getTime();

    if (dateInNumber > latestDate) {
      latestDate = dateInNumber;
      latestReview = { rating: tempReview.rating, item: entry };
    }
  }

  const rating = latestReview.rating;
  const item = latestReview.item;

  var result;
  if (rating >= 3) {
    result = await Item.aggregate([
      {
        $match: {
          _id: { $ne: item._id },
          type: item.type,
        },
      },
      { $sample: { size: 4 } },
      {
        $project: {
          name: 1,
          numReviews: 1,
          rating: 1,
          image: 1,
          price: 1,
        },
      },
    ]);
  } else {
    result = await Item.aggregate([
      {
        $match: {
          _id: { $ne: item._id },
          type: { $ne: item.type },
        },
      },
      { $sample: { size: 4 } },
      {
        $project: {
          name: 1,
          numReviews: 1,
          rating: 1,
          image: 1,
          price: 1,
        },
      },
    ]);
  }

  res.status(201).json(result);
});

/*
  We calculate score for all the items excluding the last order item
  and recommend the best 4 items based on the score
*/

const getRecommendation = asyncHandler(async (req, res) => {
  const { _id } = req.user;

  // State of user for giving recommendation
  const userRecommendationState = await UserRecommendation.findOne({
    user: _id,
  });

  // Skip last ordered items in recommendation
  const lastOrderItem = await Order.find({ user: _id })
    .sort({ createdAt: -1 })
    .limit(1);

  // if no any order found return empty
  if (lastOrderItem.length === 0) {
    res.status(201).json([]);
  }

  // Getting ids of last ordered items
  const lastOrderId = [];
  for (const i of lastOrderItem[0].items) {
    lastOrderId.push(i.id);
  }

  const categoryWeight = 7; //weight for category i.e 7 is weight per category
  const typeWeight = 4; //weight for type i.e 7 is weight per type
  const allItemsScore = [];

  // Current state of various parameters
  var ingredientState = userRecommendationState.ingredient.sort(
    (a, b) => b.score - a.score
  );
  var typeState = userRecommendationState.type.sort(
    (a, b) => b.count - a.count
  );
  var categoryState = userRecommendationState.category.sort(
    (a, b) => b.count - a.count
  );

  // Getting all items in database other than last ordered items
  const allItems = await Item.find(
    { _id: { $nin: lastOrderId } },
    {
      ingredients: 1,
      type: 1,
      category: 1,
      name: 1,
      numReviews: 1,
      rating: 1,
      image: 1,
      price: 1,
    }
  );

  for (const item of allItems) {
    var ingredientScore = 0; //for the selected item
    var typeScore = 0; //for the selected item
    var categoryScore = 0; //for the selected item

    //checks if the ingredient is available in the user state and adds to ingredient score if available
    for (const i of ingredientState) {
      if (
        item.ingredients.find(
          (entry) => entry.toLowerCase() === i.name.toLowerCase()
        )
      ) {
        ingredientScore += i.score;
      }
    }

    // checks if the type of current item is available in the item state
    // if available then adds the index * weight * count of type to the score
    const typeIndex = typeState.findIndex((entry) => entry.name === item.type);
    if (typeIndex !== -1) {
      const tempType = typeState[typeIndex];
      typeScore += (typeIndex + 1) * typeWeight * tempType.count;
    }

    // checks if the category of current item is available in the item state
    // if available then adds the index * weight * count of category to the score
    const categoryIndex = categoryState.findIndex(
      (entry) => entry.name === item.category
    );
    if (categoryIndex !== -1) {
      const tempCategory = categoryState[categoryIndex];
      categoryScore +=
        (categoryIndex + 1 + categoryWeight) * tempCategory.count;
    }

    // Total score for the current item
    const total = ingredientScore;
    // const total = ingredientScore + typeScore + categoryScore;
    console.log("ingredientScore=",ingredientScore);
    // console.log("typeScore=",typeScore);
    // console.log("categoryScore=",categoryScore);
    // console.log("total=",total);

    allItemsScore.push({
      _id: item._id,
      name: item.name,
      rating: item.rating,
      numReviews: item.numReviews,
      image: item.image,
      price: item.price,
      score: total,
    });
  }

  // Getting the top 4 items based on score
  const resData = allItemsScore.sort((a, b) => b.score - a.score).slice(0, 4);

  res.status(201).json(resData);
});

export {
  getItems,
  addItem,
  getItemById,
  updateItem,
  deleteItem,
  getTopRatedItems,
  getFilteredItems,
  addReview,
  getByWeather,
  getSimilar,
  getByRating,
  getRecommendation,
};
