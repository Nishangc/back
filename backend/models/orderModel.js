import mongoose from "mongoose";

const orderSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    address: {
      addressline1: {
        type: String,
        required: true,
      },
      town: {
        type: String,
        required: true,
      },
      postcode: {
        type: String,
        required: true,
      },
    },
    items: [
      {
        id: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: "Item",
        },
        quantity: {
          type: Number,
          required: true,
        },
      },
    ],
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["Not delivered", "Delivered", "Cancelled"],
      default: "Not delivered",
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;
