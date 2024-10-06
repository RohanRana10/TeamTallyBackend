const express = require('express');
const router = express.Router();
const userModel = require('../models/User');
const groupModel = require('../models/Group');
const fetchUser = require('../middleware/fetchUser');

router.get('/dashboard', fetchUser, async (req, res) => {
    try {
        let dataToSend = {
            groups: []
        };
        let user = await userModel.findById(req.user.id);
        if (!user) {
            return res.status(200).json({
                status: {
                    statusCode: -1,
                    statusMessage: "Invalid user credentials!"
                },
                data: null
            });
        }

        dataToSend.userImage = user.image;

        await Promise.all(user.groups.map(async (groupId) => {
            const group = await groupModel.findById(groupId).populate({
                path: 'members',
                select: '-password -__v -groups'
            }).populate({
                path: 'payments',
                select: '-__v -group',
                populate: {
                    path: 'payer',
                    select: '-password -__v -groups -Date'
                }
            });

            let settlements = [];

            // Initialize settlements for each member except the current user
            group.members.forEach((member) => {
                if (member._id.toString() !== req.user.id.toString()) {
                    settlements.push({
                        id: member._id,
                        name: member.name,
                        amount: 0 // Initial amount owed
                    });
                }
            });

            // Process payments to calculate the settlements
            await Promise.all(group.payments.map(async (payment) => {
                const share = (payment.amount / payment.participants.length).toFixed(2);

                // If the user is the payer
                if (payment.payer._id.toString() === req.user.id.toString()) {
                    settlements.forEach((settlement) => {
                        if (payment.participants.includes(settlement.id.toString())) {
                            settlement.amount += parseFloat(share); // Others owe the payer
                        }
                    });
                }
                // If the user is a participant
                else if (payment.participants.includes(req.user.id.toString())) {
                    let payerSettlement = settlements.find(settlement => settlement.id.toString() === payment.payer._id.toString());
                    if (payerSettlement) {
                        payerSettlement.amount -= parseFloat(share); // The payer owes the participant
                    }
                }
            }));

            // Calculate totalSpends based on the settlements
            let totalSpends = 0;
            settlements.forEach((settlement) => {
                totalSpends += settlement.amount;  // Aggregate total amounts
            });

            dataToSend.groups.push({
                groupDetails: group,
                settlements,
                totalSpends
            });
        }));

        dataToSend.groups.sort((a, b) => new Date(a.groupDetails.Date) - new Date(b.groupDetails.Date));

        // res.status(200).json({ message: "dashboard data", data: dataToSend });
        res.status(200).json({
            status: {
                statusCode: 1,
                statusMessage: "dashboard fetch successful"
            },
            data: dataToSend
        });
    } catch (error) {
        console.log("Error fetching dashboard info");
        res.status(500).json({ message: "Internal server error!" })
    }
})

router.get('/profile', fetchUser, async (req, res) => {
    try {
        let user = await userModel.findById(req.user.id).select('-password -__v');
        if (!user) {
            return res.status(200).json({
                status: {
                    statusCode: -1,
                    statusMessage: "Invalid user credentials!"
                },
                data: null
            });
        }
        res.status(200).json({
            status: {
                statusCode: 1,
                statusMessage: "profile fetch successful"
            },
            data: user
        })
    } catch (error) {
        console.log("Error fetching profile info");
        res.status(500).json({ message: "Internal server error!" })
    }
})

module.exports = router;