const express = require('express');
const router = express.Router();
const userModel = require('../models/User');
const groupModel = require('../models/Group');
const paymentModel = require('../models/Payment');
const fetchUser = require('../middleware/fetchUser');

//POST route for creating a payment
router.post('/create', fetchUser, async (req, res) => {
    try {
        let { payerId, groupId, amount, description, mode, participants } = req.body;
        let group = await groupModel.findById(groupId);
        if (!group) {
            return res.status(400).json({ message: "Group not found" })
        }
        const payment = await paymentModel.create({
            payer: payerId,
            description,
            mode,
            amount,
            group: groupId,
            participants
        })

        group.payments.push(payment._id);
        await group.save();
        res.status(201).json({ message: "payment created", payment });
    } catch (error) {
        console.error("error creating payment: ", error);
        res.status(500).json({ error: "Internal server srror!" });
    }
})

//POST route for deleting a payment
router.post('/update', fetchUser, async (req, res) => {
    try {
        let { payerId, paymentId, groupId, amount, description, mode, participants } = req.body;
        let group = await groupModel.findById(groupId);
        if (!group) {
            return res.status(400).json({ message: "group not found" });
        }
        let payment = await paymentModel.findById(paymentId);
        if (!group) {
            return res.status(400).json({ message: "payment not found" });
        }

        let updatedPayment = {};
        if (payerId) {
            updatedPayment.payerId = payerId;
        }
        if (amount) {
            updatedPayment.amount = amount;
        }
        if (description) {
            updatedPayment.description = description;
        }
        if (mode) {
            updatedPayment.mode = mode;
        }
        if (participants) {
            updatedPayment.participants = participants;
        }
        
        payment = await paymentModel.findByIdAndUpdate(paymentId, { $set: updatedPayment }, { new: true });
        res.status(200).json({message: "payment details updated", data: payment});
    } catch (error) {
        console.error("error deleting group: ", error);
        res.status(500).json({ error: "Internal server srror!" });
    }
})

//DELETE route for deleting a payment
router.delete('/delete', fetchUser, async (req, res) => {
    try {
        let { groupId, paymentId } = req.body;
        let group = await groupModel.findById(groupId);
        if (!group) {
            return res.status(400).json({ message: "group not found" });
        }
        let payment = await paymentModel.findById(paymentId);
        if (!payment) {
            return res.status(400).json({ message: "payment not found" });
        }
        let updatedPayments = group.payments.filter(paymentId => {
            return payment._id.toString() !== paymentId.toString();
        })
        group.payments = updatedPayments;
        group.save();

        payment = await paymentModel.findByIdAndDelete(paymentId);
        res.status(200).json({ message: 'Payement deleted', data: payment })
    } catch (error) {
        console.error("error deleting payment: ", error);
        res.status(500).json({ error: "Internal server srror!" });
    }
})
module.exports = router;