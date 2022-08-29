import User from "../models/user";
import Order from "../models/order";
import {hashPassword, comparePassword} from "../helpers/auth";
import jwt from "jsonwebtoken";
import mg from "nodemailer-mailgun-transport";
import nodemailer from "nodemailer";
import Cart from "../models/cart";
import { v4 as uuidv4 } from 'uuid';
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//         user: process.env.USER,
//         pass: process.env.PASS
//     }
// })
const auth = {
    auth: {
      api_key: process.env.API_KEY,
      domain: process.env.DOMAIN
    }
}

const nodemailerMailgun = nodemailer.createTransport(mg(auth));

export const register = async (req, res) => {
    // console.log("Data coming", req.body);
    const {name, email, password, security} = req.body;
    if (!name) {
        return res.json({
            error: "Name is required"
        })
    }
    if (!email) {
        return res.json({
            error: "Email is required"
        })
    }
    if ( !password || password.length < 6 ) {
        return res.json({
            error: "Password is required and should be 6 characters long"
        })
    }
    if (!security) {
        return res.json({
            error: "Security is required"
        })
    }
    const exist = await User.findOne({email});
    if (exist) {
        return res.json({
            error: "Email already taken"
        })
    }
    const hashedPassword = await hashPassword(password);
    const user = new User({name, email, password: hashedPassword, security});
    try {
        await user.save();
        return res.json({
            ok: true
        })
    } catch (err){
        return res.status(400).send("Error. Try Again");
    }
}

export const login = async (req, res) => {
    try{
        const {email, password} = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.json({
                error: "User not found"
            })
        }
        const psw = await comparePassword(password, user.password);
        if(!psw) {
            return res.json({
                error: "Password does not match"
            })
        }
        const token = jwt.sign({_id: user._id}, process.env.JWT_SECRET, {
            expiresIn: "7d",
        });
        user.password = undefined;
        user.security = undefined;
        res.json({
            token,
            user
        });
    } catch (err) {
        return res.status(400).send("Error. Try Again");
    }
}
export const currentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        res.json({
            ok: true
        });
    } catch (error) {
        // console.log(error);
        res.sendStatus(400);
    }
}
export const forgotPassword = async (req, res) => {
    const {email, newPassword, security} = req.body;
    if (!newPassword || newPassword < 6) {
        return res.json({
            error: "New Password is required and should be atleast 6 characters long"
        })
    }
    if (!security) {
        return res.json({
            error: "Security Question is required"
        })
    }
    const user = await User.findOne({email, security});
    if (!user) {
        return res.json({
            error: "User could not be verified"
        })
    }
    try {
        const hashed = await hashPassword(newPassword);
        await User.findByIdAndUpdate(user._id, {password: hashed});
        return res.json({
            success: "Password Updated Successfully. You can login Now"
        })
    } catch (error) {
        console.log(error);
        return res.json({
            error: "Something went wrong try again!!!"
        })
    }
}
export const contact = async(req, res) => {
    const {event, enquiry, name, phone, eID, message} = req.body;
    const htmlTemp = `<div>
    <p>Name: ${name}<p>
    <p>Enquiry Type: ${enquiry}<p>
    <p>Event: ${event}<p>
    <p>Email: ${eID}<p>
    <p>Phone: ${phone}<p>
    </div>
    <div>Message: ${message}</div>`;

    var mailOptions = {
        from: eID,
        to : process.env.USER,
        subject : enquiry,
        html: htmlTemp
    };
    try {
        await nodemailerMailgun.sendMail(mailOptions, (err, data) => {
            if (err) {
                return res.json({
                    error: err
                })
            } else {
                return res.json({
                    success: "Email sent successfully"
                })
            }
        })
    } catch (err){
        return res.json({
            error: "Error occured during contact"
        });
    }
}
export const cartData = async (req, res) => {
    const {events, name, gender, nationality, residence, phone, price, email} = req.body;
    const cart = new Cart({events, name, gender, nationality, residence, phone, price, email});
    try {
        const response = await cart.save();
        return res.json({
            _id: response._id
        });
    } catch (error) {
        return res.json({
            error: "Error adding data to Cart"
        });
    }
}

export const cartPageData = async (req, res) => {
    try {
        const data = await Cart.findById(req.params._id);
        return res.json(data);
    } catch (err) {
        console.log(err);
        return res.json({
            error: err
        });
    }
}
export const productPayment = async (req, res) => {
    const { price, events, token } = req.body;
  
    const idempotencyKey = uuidv4(); // to be unique
  
    //! token is something automatically generated from the client side and sent to here
  
    let customer;
    try {
      customer = await stripe.customers.create({
        email: token.email,
        source: token.id,
      });
    } catch (error) {
        return res.json({
            error: 'Error Creating Customer: ' + error
        })
    //   console.log('Error coming from creating customer: ' + error);
    }
  
    let chargesResult;
    try {
      chargesResult = await stripe.charges.create(
        {
          amount: parseInt(price) * 100, // bcoz we are gonna send the price in cents
          currency: 'usd', // i can read the docs for other currencies
          customer: customer.id,
          receipt_email: token.email, //? optional property
          description: `You have Purchased Ticket of ${events}`, //? optional property
        },
        { idempotencyKey } //? name of the key must be idempotencyKey
      );
    } catch (error) {
        return res.json({
            error: 'Error Creating Charges: ' + error
        })
    //   console.log('Error coming from creating charges: ' + error);
    }
    return res.json({
        success: chargesResult
    })
    // res.status(200).json();
}
export const orderCompletionData = async (req, res) => {
    const {id, status, payer, purchase_units} = req.body;
    const order_id = id;
    const order = new Order({order_id, status, payer, purchase_units});
    try {
        const response = await order.save();
        return res.json({
            success: "Data Added Successfully"
        });
    } catch (error) {
        return res.json({
            error: "Error adding data to database"
        });
    }
}