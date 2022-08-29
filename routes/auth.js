import express from "express";
import {register, login, contact, currentUser, forgotPassword, cartData, cartPageData, productPayment, orderCompletionData} from "../controllers/auth";
import { requireSignin } from "../middlewares";

const router = express.Router();
router.post("/register", register);
router.post("/cartData", cartData);
router.post("/paypal-transaction-complete", orderCompletionData);
router.post("/payment", productPayment);
router.get("/cart-data/:_id", cartPageData);
router.post("/login", login);
router.post("/contact", contact);
router.get("/current-user", requireSignin, currentUser);
router.post("/forgot-password", forgotPassword);

module.exports = router;