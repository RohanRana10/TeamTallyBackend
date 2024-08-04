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

        while(groupFound){
            code = generateGroupCode();
            groupFound = await groupModel.findOne({ code: code });
        }

        const group = await groupModel.create({
            name, image, creator: req.user.id, type, code
        })
        const user = await userModel.findById(req.user.id);
        // user.groups.push(group._id);
        // await user.save();

        // members.forEach(async (memberId) => {
        //     //TODO check if the member is a user or not
        //     const user = await userModel.findById(memberId);
        //     user.groups.push(group._id);
        //     await user.save();
        // });
        res.status(201).json({ message: "group created", group });
    } catch (error) {
        console.error("error creating group: ", error);
        res.status(500).json({ error: "Internal server error!" });
    }
})

//GET route for getting group details
router.get('/get-details', fetchUser, async (req, res) => {
    try {
        let { groupId } = req.body;
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

        if (!group) {
            return res.status(400).json({ message: "Group not found" })
        }
        let settlements = [];
        // let settlements = {};
        // group.members.forEach((member) => {
        //     if (member._id.toString() !== req.user.id.toString()) {
        //         settlements[member.name] = 0;
        //     }
        // })
        group.members.forEach((member) => {
            if (member._id.toString() !== req.user.id.toString()) {
                settlements.push({
                    id: member._id,
                    name: member.name,
                    amount: 0
                })
            }
        })

        // group.payments.forEach(async (payment) => {
        //     if (payment.payer.toString() === req.user.id.toString()) {
        //         console.log("user is the payer");
        //         Object.keys(settlements).forEach(participant => {
        //             const share = (payment.amount / payment.participants.length).toFixed(2);
        //             settlements[participant] += parseFloat(share);
        //         })
        //         // //TODO add a check if payer is not in participants list
        //     }
        //     else if(payment.participants.includes(req.user.id)){
        //         console.log("user is the participant");
        //         const share = (payment.amount / payment.participants.length).toFixed(2);
        //         let user = await userModel.findById(payment.payer);
        //         console.log('Before subtraction:', settlements[user.name]);
        //         settlements[user.name] -= parseFloat(share);
        //         console.log('After subtraction:', settlements[user.name]);
        //     }
        //     else{
        //         console.log("did nothing");
        //     }
        // })

        // res.status(200).json({ data: group, settlements });

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

        res.status(200).json({ data: group, settlements });
    } catch (error) {
        console.error("error creating group: ", error);
        res.status(500).json({ error: "Internal server srror!" });
    }
})

router.post('/add-member', fetchUser, async (req, res) => {
    try {
        let {code} = req.body;
        const group = await groupModel.findOne({code: code});
        if(!group){
            return res.status(400).json({error: "Group not found"});
        }
        group.members.push(req.user.id);
        await group.save();

        const user = await userModel.findById(req.user.id);
        user.groups.push(group._id);
        await user.save();

        // const user = await userModel.findById(memberId);
        //     user.groups.push(group._id);
        //     await user.save();
        res.status(200).json({message: "Member added to group successfully"});
        
    } catch (error) {
        console.error("error adding member: ", error);
        res.status(500).json({ error: "Internal server srror!" });
    }
})

//POST route for updating group details
router.post('/update-group', fetchUser, async (req, res) => {
    try {
        let { name, image, members, groupId } = req.body;
        let group = await groupModel.findById(groupId);
        if (!group) {
            return res.status(400).json({ message: "Group not found" })
        }

        let newGroup = {};
        if (name) {
            newGroup.name = name;
        }
        if (image) {
            newGroup.image = image;
        }
        if (members) {
            newGroup.members = members;
        }

        group = await groupModel.findByIdAndUpdate(groupId, { $set: newGroup }, { new: true })
        res.status(200).json({ message: "group details updated", data: group });
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


module.exports = router;