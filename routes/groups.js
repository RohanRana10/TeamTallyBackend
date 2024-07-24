const express = require('express');
const router = express.Router();
const userModel = require('../models/User');
const groupModel = require('../models/Group');
const fetchUser = require('../middleware/fetchUser');

//POST route to create a new group
router.post('/create', fetchUser, async (req, res) => {
    try {
        let { name, image, members } = req.body;
        const group = await groupModel.create({
            name, image, members, creator: req.user.id
        })
        const user = await userModel.findById(req.user.id);
        // user.groups.push(group._id);
        // await user.save();
        members.forEach(async (memberId) => {
            const user = await userModel.findById(memberId);
            user.groups.push(group._id);
            await user.save();
        });
        res.status(201).json({ message: "group created", group });
    } catch (error) {
        console.error("error creating group: ", error);
        res.status(500).json({ error: "Internal server srror!" });
    }
})

//GET route for getting group details
router.get('/get-details', fetchUser, async (req, res) => {
    try {
        let { groupId } = req.body;
        const group = await groupModel.findById(groupId).populate('members');
        if (!group) {
            return res.status(400).json({ message: "Group not found" })
        }
        res.status(200).json({ data: group });
    } catch (error) {
        console.error("error creating group: ", error);
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