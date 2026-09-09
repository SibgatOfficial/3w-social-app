const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },

    name: {
      type: String,
      default: "",
    },

    avatar: {
      type: String,
      default: "",
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

        name: {
          type: String,
          default: "",
        },

        avatar: {
          type: String,
          default: "",
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

            name: {
              type: String,
              default: "",
            },

            avatar: {
              type: String,
              default: "",
            },

            text: {
              type: String,
              required: true,
            },

            replyTo: {
              type: String,
              required: true,
            },

            parentId: {
              type: String,
              default: null,
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

    poll: {
      question: { type: String, default: "" },
      options: [
        {
          text: { type: String, required: true },
          votes: [{ type: String }],
        },
      ],
      endsAt: { type: Date },
    },

    reports: [{ type: String }],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Post", postSchema);
