import User from "../models/user.model.js"
import Message from "../models/message.model.js"
import cloudinary from "../utils/cloudinary.js"
import { getReceiverSocketId,io } from "../utils/socket.js"

export const getUsersForSidebar = async (req,res) => {
   
    try {
        const loggedInUserId = req.user._id
        const filteredUsers = await User.find({_id:{$ne : loggedInUserId}}).select("-password")

        res.status(200).json(filteredUsers)
        
    } catch (error) {
        console.log("error in getUsersForSidebar",error.message)
        res.status(500).json({error: "internal server error"})
        
    }

}

export const sendMessage = async (req,res) => {
  try {
    const {text,image} = req.body;
    const{id:receiverId} = req.params;
    const senderId = req.user._id;
    let imageUrl;
    if(image){
        const uploadResponse = await cloudinary.uploader.upload(image);
        imageUrl = uploadResponse.secure_url;
    }
    const newMessage = new Message({
        senderId,
        receiverId,
        text,
        image:imageUrl 
    })
    await newMessage.save();
     const receiverSocketId = getReceiverSocketId(receiverId)
     if(receiverSocketId){
      io.to(receiverSocketId).emit("newMessage",newMessage) //io.emit broadcasts so instead we have to use .to to send it to a particular person

     }
     res.status(201).json(newMessage)
  } catch (error) {
    console.log("error in sendMessage controller",error.message)
    res.status(500).json({error: "internal server error"})
  }
}


export const getMessages = async (req,res) => {
  try {
    const {id:userToChatId} =  req.params
    const myId = req.user._id

    const messages = await Message.find({
        $or: [
            {senderId:myId,receiverId:userToChatId},
            {senderId:userToChatId,receiverId:myId}
        ]
    })
    res.status(200).json(messages)
    
  } catch (error) {

    console.log("error in getMessages",error.message)
    res.status(500).json({error: "internal server error"})
    
  }
}


export const unsendMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const senderId = req.user._id;

    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Check if the user is the sender
    if (message.senderId.toString() !== senderId.toString()) {
      return res.status(403).json({ error: "You can only unsend your own messages" });
    }
    await Message.findByIdAndDelete(id);

    // Emit event to update UI in real time
    io.emit("messageUnsent", id);

    res.status(200).json({ success: true, message: "Message unsent successfully" });
  } catch (error) {
    console.log("Error in unsendMessage controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const editMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const senderId = req.user._id;

    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    if (message.senderId.toString() !== senderId.toString()) {
      return res.status(403).json({ error: "You can only edit your own messages" });
    }

    message.text = text;
    await message.save();

    io.emit("messageEdited", { id, text });

    res.status(200).json({ success: true, message: "Message edited successfully", updatedMessage: message });
  } catch (error) {
    console.log("Error in editMessage controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

