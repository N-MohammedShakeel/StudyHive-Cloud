// backend/controllers/userController.js
const bcrypt = require("bcrypt");
const User = require("../models/User");
const Group = require("../models/Group");
const Course = require("../models/Course");
const Event = require("../models/Event");
const Message = require("../models/Chat");
const File = require("../models/File");
const Meeting = require("../models/Meeting");
const { drive } = require("../config/googleDrive");

const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select(
      "name email interests googleId password"
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      interests: user.interests,
      googleId: user.googleId,
      hasPassword: !!user.password,
    };
    res.json(userData);
  } catch (error) {
    console.error("Get User Profile Error:", error);
    res
      .status(500)
      .json({ message: "Error fetching user profile", error: error.message });
  }
};

const updateProfile = async (req, res) => {
  const { name, email, interests } = req.body;
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name) user.name = name;
    if (email) user.email = email;
    if (interests) user.interests = interests;

    await user.save();
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      interests: user.interests,
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res
      .status(500)
      .json({ message: "Error updating profile", error: error.message });
  }
};

const addPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    console.log("addPassword received:", {
      newPassword,
      type: typeof newPassword,
    });

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (
      !newPassword ||
      typeof newPassword !== "string" ||
      newPassword.trim() === ""
    ) {
      return res
        .status(400)
        .json({ message: "New password must be a non-empty string" });
    }
    if (newPassword.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters long" });
    }

    user.password = newPassword; // Set plain password
    await user.save();
    const savedUser = await User.findById(req.user.id);
    console.log("Saved user password hash:", savedUser.password); // Log hash
    return res.status(200).json({ message: "Password added successfully" });
  } catch (error) {
    console.error("Add password error:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    console.log("changePassword received:", {
      currentPassword,
      newPassword,
      currentPasswordLength: currentPassword?.length,
    });

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Current and new passwords are required" });
    }
    if (!user.password) {
      return res
        .status(400)
        .json({ message: "No password set, use add password instead" });
    }
    const isMatch = await user.comparePassword(currentPassword);
    console.log("comparePassword result:", isMatch);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }
    if (typeof newPassword !== "string" || newPassword.trim() === "") {
      return res
        .status(400)
        .json({ message: "New password must be a non-empty string" });
    }
    if (newPassword.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters long" });
    }
    user.password = newPassword;
    await user.save();
    const savedUser = await User.findById(req.user.id);
    console.log("Saved user password hash:", savedUser.password); // Log hash
    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find and delete groups where the user is the host
    const hostedGroups = await Group.find({ host: userId });
    for (const group of hostedGroups) {
      // Delete associated messages, files, and meetings for the group
      await Message.deleteMany({ groupId: group._id });
      const files = await File.find({ groupId: group._id });
      for (const file of files) {
        await drive.files.delete({ fileId: file.driveFileId }).catch((err) => {
          console.warn(
            `Failed to delete file ${file.driveFileId} from Drive:`,
            err
          );
        });
        await File.deleteOne({ _id: file._id });
      }
      await Meeting.deleteMany({ groupId: group._id });
      // Delete the group itself
      await Group.deleteOne({ _id: group._id });
    }

    // Remove user from other groups where they are a member
    await Group.updateMany(
      { "members.userId": userId },
      { $pull: { members: { userId } } }
    );

    // Delete courses created by the user
    await Course.deleteMany({ author: userId });

    // Delete events created by the user
    await Event.deleteMany({ userId });

    // Delete messages created by the user in other groups
    await Message.deleteMany({ userId });

    // Remove reactions by the user from messages
    await Message.updateMany(
      { "reactions.userId": userId },
      { $pull: { reactions: { userId } } }
    );

    // Delete files uploaded by the user in other groups
    const files = await File.find({ userId });
    for (const file of files) {
      await drive.files.delete({ fileId: file.driveFileId }).catch((err) => {
        console.warn(
          `Failed to delete file ${file.driveFileId} from Drive:`,
          err
        );
      });
      await File.deleteOne({ _id: file._id });
    }

    // Delete meetings created by the user in other groups
    await Meeting.deleteMany({ createdBy: userId });

    // Delete the user
    const user = await User.findByIdAndDelete(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Delete Account Error:", error);
    res
      .status(500)
      .json({ message: "Error deleting account", error: error.message });
  }
};

module.exports = {
  getUserProfile,
  updateProfile,
  addPassword,
  changePassword,
  deleteAccount,
};
