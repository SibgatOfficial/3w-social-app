const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },

    text: {
      type: String,
      default: "",
    },

    image: {
      type: String,
      default: "",
    },

    likes: [
      {
        type: String,
      },
    ],

    comments: [
      {
        username: {
          type: String,
          required: true,
        },

        text: {
          type: String,
          required: true,
        },

        replies: [
          {
            username: {
              type: String,
              required: true,
            },

            text: {
              type: String,
              required: true,
            },

            replyTo: {
              type: String,
              required: true,
            },

            createdAt: {
              type: Date,
              default: Date.now,
            },
          },
        ],

        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Post", postSchema);
