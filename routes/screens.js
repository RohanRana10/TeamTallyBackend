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
            let totalSpends = 0;

            group.members.forEach((member) => {
                if (member._id.toString() !== req.user.id.toString()) {
                    settlements.push({
                        id: member._id,
                        name: member.name,
                        amount: 0
                    })
                }
            })

            await Promise.all(group.payments.map(async (payment) => {
                if (payment.payer.toString() === req.user.id.toString()) {

                    console.log("user is the payer");

                    settlements.forEach(object => {
                        if (payment.participants.includes(object.id)) {
                            console.log(`${object.name} is a participant`)
                            const share = (payment.amount / payment.participants.length).toFixed(2);
                            object.amount += parseFloat(share);
                        }

                    });

                    //TODO add a check if payer is not in participants list
                }
                else if (payment.participants.includes(req.user.id)) {
                    console.log("user is the participant");

                    const share = (payment.amount / payment.participants.length).toFixed(2);
                    let user = await userModel.findById(payment.payer);
                    let temp = settlements.find(object => object.id.toString() === user._id.toString());
                    console.log('Before subtraction:', temp);
                    // settlements[user.name] -= parseFloat(share);

                    if (temp) {
                        temp.amount -= parseFloat(share);
                    }

                    console.log('After subtraction:', temp);
                }
                else {
                    console.log("did nothing");
                }
            }));

            settlements.map((settlement) => {
                totalSpends += settlement.amount;
            })

            dataToSend.groups.push({
                groupDetails: group,
                settlements,
                totalSpends
            });
        }));

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