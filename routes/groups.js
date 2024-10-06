const express = require('express');
const router = express.Router();
const userModel = require('../models/User');
const groupModel = require('../models/Group');
const fetchUser = require('../middleware/fetchUser');

const generateGroupCode = () => {
    const randomNumber = Math.floor(Math.random() * 1000000);
    const formattedCode = randomNumber.toString().padStart(6, '0');
    return formattedCode;
}

//POST route to create a new group
router.post('/create', fetchUser, async (req, res) => {
    try {
        let { name, image, type } = req.body;

        let code = generateGroupCode();
        const groupFound = await groupModel.findOne({ code: code });

        while (groupFound) {
            code = generateGroupCode();
            groupFound = await groupModel.findOne({ code: code });
        }

        const group = await groupModel.create({
            name, image, creator: req.user.id, type, code
        })

        const user = await userModel.findById(req.user.id);
        group.members.push(user._id);
        await group.save();
        user.groups.push(group._id);
        await user.save();
        // user.groups.push(group._id);
        // await user.save();

        // members.forEach(async (memberId) => {
        //     //TODO check if the member is a user or not
        //     const user = await userModel.findById(memberId);
        //     user.groups.push(group._id);
        //     await user.save();
        // });
        // res.status(201).json({ message: "group created", group });
        res.status(201).json({
            status: {
                statusCode: 1,
                statusMessage: "Group created!"
            },
            data: group
        });
    } catch (error) {
        console.error("error creating group: ", error);
        res.status(500).json({ error: "Internal server error!" });
    }
})

//POST route for getting group details
// router.post('/get-details', fetchUser, async (req, res) => {
//     try {
//         let { groupId } = req.body;
//         console.log("body", req.body);
//         const group = await groupModel.findById(groupId).populate({
//             path: 'members',
//             select: '-password -__v -groups'
//         }).populate({
//             path: 'payments',
//             select: '-__v -group',
//             populate: {
//                 path: 'payer',
//                 select: '-password -__v -groups -Date'
//             }
//         });

//         if (!group) {
//             console.log("group not found!", groupId)
//             return res.status(200).json({
//                 status: {
//                     statusCode: -1,
//                     statusMessage: "Error fetching group details!"
//                 },
//                 data: null
//             })
//         }
//         let settlements = [];
//         let totalSpends = 0;

//         group.members.forEach((member) => {
//             if (member._id.toString() !== req.user.id.toString()) {
//                 settlements.push({
//                     id: member._id,
//                     name: member.name,
//                     amount: 0
//                 })
//             }
//         })

//         await Promise.all(group.payments.map(async (payment) => {
//             if (payment.payer.toString() === req.user.id.toString()) {

//                 console.log("user is the payer");

//                 settlements.forEach(object => {
//                     if (payment.participants.includes(object.id)) {
//                         console.log(`${object.name} is a participant`)
//                         const share = (payment.amount / payment.participants.length).toFixed(2);
//                         object.amount += parseFloat(share);
//                     }

//                 });

//             }
//             else if (payment.participants.includes(req.user.id)) {
//                 console.log("user is the participant");

//                 const share = (payment.amount / payment.participants.length).toFixed(2);
//                 let user = await userModel.findById(payment.payer);
//                 let temp = settlements.find(object => object.id.toString() === user._id.toString());
//                 console.log('Before subtraction:', temp);
//                 // settlements[user.name] -= parseFloat(share);

//                 if (temp) {
//                     temp.amount -= parseFloat(share);
//                 }

//                 console.log('After subtraction:', temp);
//             }
//             else {
//                 console.log("did nothing");
//             }
//         }));

//         settlements.map((settlement) => {
//             totalSpends += settlement.amount;
//         })

//         // res.status(200).json({ data: group, settlements });
//         res.status(200).json({
//             status: {
//                 statusCode: 1,
//                 statusMessage: "group details fetch success!"
//             },
//             data: {
//                 group,
//                 settlements,
//                 totalSpends
//             }
//         });
//     } catch (error) {
//         console.error("error creating group: ", error);
//         res.status(500).json({ error: "Internal server srror!" });
//     }
// })

router.post('/add-member', fetchUser, async (req, res) => {
    try {
        let { code } = req.body;
        const group = await groupModel.findOne({ code: code });
        if (!group) {
            return res.status(200).json({
                status: {
                    statusCode: -1,
                    statusMessage: "Invalid group code!"
                },
                data: null
            });
        }
        if (group.members.includes(req.user.id)) {
            return res.status(200).json({
                status: {
                    statusCode: -1,
                    statusMessage: "You are already a member of this group!"
                },
                data: null
            });
        }
        else {
            group.members.push(req.user.id);
            await group.save();
            const user = await userModel.findById(req.user.id);
            user.groups.push(group._id);
            await user.save();
            res.status(200).json({
                status: {
                    statusCode: 1,
                    statusMessage: `You were added to "${group.name}"!`
                }, data: null
            });
        }

        // const user = await userModel.findById(memberId);
        //     user.groups.push(group._id);
        //     await user.save();

    } catch (error) {
        console.error("error adding member: ", error);
        res.status(500).json({ error: "Internal server srror!" });
    }
})

//POST route for updating group details
router.post('/update-group', fetchUser, async (req, res) => {
    try {
        let { name, image, type, groupId } = req.body;
        let group = await groupModel.findById(groupId);
        if (!group) {
            return res.status(200).json({
                status: {
                    statusCode: -1,
                    statusMessage: "Group not found!"
                },
                data: null
            })
        }

        let newGroup = {};
        if (name) {
            newGroup.name = name;
        }
        if (image) {
            newGroup.image = image;
        }
        if (type) {
            newGroup.type = type;
        }

        group = await groupModel.findByIdAndUpdate(groupId, { $set: newGroup }, { new: true })
        res.status(200).json({
            status: {
                statusCode: 1,
                statusMessage: "Group details updated!"
            },
            data: {
                group
            }
        });
    } catch (error) {
        console.error("error updating group: ", error);
        res.status(500).json({ error: "Internal server srror!" });
    }
})

//DELETE route for deleting a group
router.delete('/delete-group', fetchUser, async (req, res) => {
    try {
        let { groupId } = req.body;
        let group = await groupModel.findById(groupId);
        if (!group) {
            return res.status(400).json({ message: "Group not found!" })
        }
        if (group.creator.toString() !== req.user.id) {
            return res.json(401).json({ message: "unauthorized request" })
        }

        group.members.forEach(async (memberId) => {
            let user = await userModel.findById(memberId);
            let newgroups = user.groups.filter((groupId) => {
                return groupId.toString() !== group._id.toString();
            })
            user.groups = newgroups;
            await user.save();
        })

        group = await groupModel.findByIdAndDelete(groupId);
        res.status(200).json({ message: 'group deleted', data: group });
    } catch (error) {
        console.error("error deleting group: ", error);
        res.status(500).json({ error: "Internal server srror!" });
    }
})


//POST route for getting group details
router.post('/get-details', fetchUser, async (req, res) => {
    try {
        let { groupId } = req.body;
        console.log("body", req.body);

        // Fetch the group details and populate necessary fields
        const group = await groupModel.findById(groupId).populate({
            path: 'creator'
            , select: '-password -__v -groups -email -Date -image'
        })
            .populate({
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

        // Check if group exists
        if (!group) {
            console.log("group not found!", groupId);
            return res.status(200).json({
                status: {
                    statusCode: -1,
                    statusMessage: "Error fetching group details!"
                },
                data: null
            });
        }

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

        // Send the response with group details, settlements, and totalSpends
        res.status(200).json({
            status: {
                statusCode: 1,
                statusMessage: "Group details fetched successfully!"
            },
            data: {
                group,
                settlements,
                totalSpends
            }
        });
    } catch (error) {
        console.error("error fetching group details: ", error);
        res.status(500).json({ error: "Internal server error!" });
    }
});




module.exports = router;