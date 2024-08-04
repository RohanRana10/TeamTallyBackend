const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const userModel = require('../models/User');
const jwt = require('jsonwebtoken');
const fetchUser = require('../middleware/fetchUser');
const upload = require('../middleware/multer');
const cloudinary = require('../utils/cloudinary');
const jwtSecret = process.env.JWT_SECRET;

//POST route to create a new user
router.post('/create', async (req, res) => {
    try {
        let { name, email, password, cpassword, image } = req.body;
        if (!name) {
            return res.status(400).json({ error: "Please provide a name" });
        }
        if (!email) {
            return res.status(400).json({ error: "Please provide an email" });
        }
        if (!password) {
            return res.status(400).json({ error: "Please provide a password" });
        }
        if (!cpassword) {
            return res.status(400).json({ error: "Please provide a password confirmation" });
        }
        if (password != cpassword) {
            return res.status(400).json({ error: "Passwords do not match" });
        }
        if (password.length < 5) {
            return res.status(400).json({ error: "Please provide a password of length greater than 5 characters" });
        }

        // Check if the email already exists
        let user = await userModel.findOne({ email });
        if (user) {
            return res.status(400).json({ error: "Email already exists!" });
        }

        const salt = await bcrypt.genSalt(10);
        let securePassword = await bcrypt.hash(password, salt);

        user = await userModel.create({
            name, email, image, password: securePassword
        })

        // Generate JWT token
        let data = {
            user: {
                id: user._id
            }
        }
        const authtoken = jwt.sign(data, jwtSecret);

        res.status(201).json({ message: "Signup Successful!", authtoken });
    } catch (error) {
        console.error("error creating user: ", error);
        res.status(500).json({ error: "Internal erver error!" });
    }
})

router.post('/update-user', fetchUser, async (req, res) => {
    try {
        let { name, image } = req.body;
        if (!name) {
            return res.status(400).json({ error: "Please provide a name" });
        }

        let user = await userModel.findById(req.user.id);
        if (!user) {
            return res.status(400).json({ message: "user not found" })
        }

        let newUser = {};
        if (name) {
            newUser.name = name;
        }
        if (image) {
            newUser.image = image;
        }

        user = await userModel.findByIdAndUpdate(req.user.id, { $set: newUser }, { new: true });
        res.status(200).json({ message: "user details updated", data: user });
    } catch (error) {
        console.error("error updating user: ", error);
        res.status(500).json({ error: "Internal erver error!" });
    }
})

//POST route for login
router.post('/login', async (req, res) => {
    try {
        let { email, password } = req.body;
        //Input Validation
        if (!email) {
            return res.status(400).json({ error: "Please provide an email!" });
        }
        if (!password) {
            return res.status(400).json({ error: "Please provide a password!" });
        }

        //Check if user exists for the given email
        let user = await userModel.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: "Please provide valid credentials!" });
        }

        const passwordCompare = await bcrypt.compare(password, user.password);
        if (!passwordCompare) {
            return res.status(400).json({ error: "Please provide valid credentials!" });
        }

        // Generate JWT token
        let data = {
            user: {
                id: user._id
            }
        }
        const authtoken = jwt.sign(data, jwtSecret);
        res.status(200).json({ message: "Login successful!", authtoken });
    } catch (error) {
        console.error("error logging in user: ", error);
        res.status(500).json({ error: "Internal server srror!" });
    }
})

//GET route for user details
router.get('/user-details', fetchUser, async (req, res) => {
    try {
        let user = await userModel.findById(req.user.id).select("-password");
        res.status(200).json({ user });
    } catch (error) {
        console.error("error logging in user: ", error);
        res.status(500).json({ error: "Internal server srror!" });
    }
})

//POST route for uploading image
router.post('/get-image-url', upload.single('image'), (req, res) => {
    cloudinary.uploader.upload(req.file.path, (error, result) => {
        if (error) {
            console.error("error saving user image: ", error);
            return res.status(500).json({ error: "Internal server srror!" });
        }
        res.status(200).json({ message: "image save successful!", url: result.url })
    })
})

module.exports = router;