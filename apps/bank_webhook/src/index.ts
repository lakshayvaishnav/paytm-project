import express from "express";
import db from "@repo/db/client";

const app = express();

app.post("/hdfcWebhook", (req, res) => {
  //TODO: Add zod validation here?
  // ! check if this request came from official bank only add a webhook secret here.
  
  const paymentInformation = {
    token: req.body.token,
    userId: req.body.user_identifier,
    amount: req.body.amount,
  };
  // Update balance in db, add txn
  db.balance.update({
    where: {
      userId: userId,
    },
    data: {
      amount: {
        increment: paymentInformation.amount,
      },
    },
  });
});
