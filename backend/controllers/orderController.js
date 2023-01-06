import asyncHandler from "express-async-handler";
import Order from "../models/orderModel.js";
import User from "../models/userModel.js";
import Item from "../models/itemModel.js";
import UserRecommendation from "../models/userRecommendationModel.js";

/*
  we have a state for every user which gets created when user registers in our system
  The state is a matrix of the form 
  
  ingredient || score     category || count     type || count
  Ing1          10        veg         2         spicy   1
  ...............           ............     ................
  _ _ _                       _ _ _                _ _ _
  
  (initially matrix is empty i.e when user first registers)

  When the user creates an order what we basically do is update the matrix
  The ingredient is updated based on the past review given by the user for
   the ordered items i.e if review is 2 then we increment score by 2 for that
    item/dish. In case of no review we increment by maximum i.e 5
  Category and type count are increment by 1 for each item's 
  category/type in the order
*/
const create = asyncHandler(async (req, res) => {
  try {
    const { _id } = req.user;

    const { addressLine1, town, postCode, amount, items } = req.body;

    const address = { addressline1: addressLine1, town, postcode: postCode };

    const userRecommendationState = await UserRecommendation.findOne({
      user: _id,
    });

    var ingredientState = userRecommendationState.ingredient;
    var typeState = userRecommendationState.type;
    var categoryState = userRecommendationState.category;

    for (const entry of items) {
      const currentItem = await Item.findById(entry.id, {
        type: 1,
        category: 1,
        ingredients: 1,
        reviews: 1,
      });

      const isTypeAvailable = typeState.find(
        (i) => i.name === currentItem.type
      );
      const isCategoryAvailable = categoryState.find(
        (i) => i.name === currentItem.category
      );

      if (isTypeAvailable) {
        const tempType = typeState.map((i) =>
          i.name === currentItem.type
            ? { _id: i._id, name: i.name, count: i.count + 1 }
            : i
        );
        typeState = tempType;
      } else {
        const tempType = [...typeState, { name: currentItem.type, count: 1 }];
        typeState = tempType;
      }

      if (isCategoryAvailable) {
        const tempCategory = categoryState.map((i) =>
          i.name === currentItem.category
            ? { _id: i._id, name: i.name, count: i.count + 1 }
            : i
        );
        categoryState = tempCategory;
      } else {
        const tempCategory = [
          ...categoryState,
          { name: currentItem.category, count: 1 },
        ];
        categoryState = tempCategory;
      }

      const hasUserGivenReview = currentItem.reviews.find(
        (i) => i.user.toString() === _id.toString()
      );

      var rating = hasUserGivenReview ? parseInt(hasUserGivenReview.rating) : 5;

      for (const ingredient of currentItem.ingredients) {
        const isIngredientAvailable = ingredientState.find(
          (i) => i.name.toLowerCase() === ingredient.toLowerCase()
        );
        if (isIngredientAvailable) {
          const tempIngredient = ingredientState.map((i) =>
            i.name.toLowerCase() === ingredient.toLowerCase()
              ? { _id: i._id, name: i.name, score: i.score + rating }
              : i
          );
          ingredientState = tempIngredient;
        } else {
          const tempIngredient = [
            ...ingredientState,
            { name: ingredient, score: rating },
          ];
          ingredientState = tempIngredient;
        }
      }
    }

    userRecommendationState.ingredient = ingredientState;
    userRecommendationState.type = typeState;
    userRecommendationState.category = categoryState;

    await userRecommendationState.save();

    const order = await Order.create({
      user: _id,
      address,
      items,
      amount,
    });

    res.status(201).json(order);
  } catch (err) {
    res.status(404);
    console.log(err.message);
  }
});

const update = asyncHandler(async (req, res) => {
  try {
    const id = req.params.id;
    const { addressLine1, town, postCode, amount, items, status } = req.body;

    const order = await Order.findById(id);

    if (order) {
      order.address.addressLine1 = addressLine1 || order.address.addressLine1;
      order.address.town = town || order.address.town;
      order.address.postcode = postCode || order.address.postcode;
      order.amount = amount || order.amount;
      order.items = items || order.items;
      order.status = status || order.status;
    }
    const result = await order.save();

    res.status(201).json(result);
  } catch (err) {
    res.status(404);
    console.log(err.message);
  }
});

const viewAll = asyncHandler(async (req, res) => {
  try {
    const result = await Order.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $unwind: "$userDetails",
      },
      {
        $project: {
          "userDetails.name": 1,
          address: 1,
          status: 1,
          createdAt: 1,
        },
      },
    ]).sort({ createdAt: -1 });

    res.status(201).json(result);
  } catch (err) {
    res.status(404);
    console.log(err.message);
  }
});

const viewOne = asyncHandler(async (req, res) => {
  try {
    const id = req.params.id;
    const result = await Order.findById(id);
    const user = await User.findById(result.user, { name: 1, email: 1 });
    const items = [];

    for (const item of result.items) {
      const tempData = await Item.findById(item.id, { name: 1, price: 1 });
      items.push({
        name: tempData.name,
        price: tempData.price,
        quantity: item.quantity,
      });
    }

    const data = {
      address: result.address,
      name: user.name,
      email: user.email,
      date: result.createdAt,
      amount: result.amount,
      items: items,
      status: result.status,
    };

    res.status(201).json(data);
  } catch (err) {
    res.status(404);
    console.log(err.message);
  }
});

const viewByUser = asyncHandler(async (req, res) => {
  try {
    const { _id } = req.user;

    const result = await Order.find(
      { user: _id },
      { createdAt: 1, items: 1, amount: 1, status: 1 }
    ).sort({ createdAt: -1 });

    res.status(201).json(result);
  } catch (err) {
    res.status(404);
    console.log(err.message);
  }
});

export { create, update, viewAll, viewOne, viewByUser };
