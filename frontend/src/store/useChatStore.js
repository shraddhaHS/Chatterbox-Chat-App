import {create} from "zustand"
import toast from "react-hot-toast"
import { axiosInstance } from "../lib/axios"
import {useAuthStore} from "./useAuthStore"

export const useChatStore = create((set,get)=> ({

    messages:[],
    users : [],
    selectedUser:null,
    isUsersLoading:false,
    isMessagesLoading:false,

    setSelectedUser : (selectedUser) => set({selectedUser}),

    getUsers: async () => {
        set( {isUsersLoading:true})
        try {
            const res = await axiosInstance.get("/messages/users")
            set({users:res.data})
        } catch (error) {
            toast.error(error.response.data.message)
        }finally{
            set({isUsersLoading:false})
        }
    },
    getMessages: async (userId) => {
        set( {isMessagesLoading:true})
        try {
            const res = await axiosInstance.get(`/messages/${userId}`)
            set({messages:res.data})
        } catch (error) {
            toast.error(error.response.data.message)
        }finally{
            set({isMessagesLoading:false})
        }
    },
    sendMessage : async (messageData) => {
       const {selectedUser,messages} =get()
       try {
        const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`,messageData)
        set({messages:[...messages,res.data]})
       } catch (error) {
        toast.error(error.response.data.message)
       }
    },
    unsendMessage: async (messageId) => {
        const { messages } = get();
        set({
            messages: messages.filter((msg) => msg._id !== messageId),
        });
    
        try {
            await axiosInstance.delete(`/messages/unsend/${messageId}`);
            toast.success("Message unsent successfully");
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to unsend message");
            set({ messages });
        }
    },
    editingMessageId: null, 
    editedMessageText: '',
    editMessage: async (messageId, newText) => {
        const { messages } = get();
        
        const updatedMessages = messages.map((msg) =>
          msg._id === messageId ? { ...msg, text: newText } : msg
        );
        set({ messages: updatedMessages, editingMessageId: null, editedMessageText: '' });
    
        try {
          await axiosInstance.put(`/messages/edit/${messageId}`, { text: newText });
          toast.success('Message edited successfully');
        } catch (error) {
          toast.error(error.response?.data?.error || 'Failed to edit message');
        }
      },
     
    
    
    subscribeToMessages: () =>{
        const {selectedUser} = get()
        if(!selectedUser) return
       
        const socket = useAuthStore.getState().socket
        socket.on("newMessage", (newMessage)=> {
          const isMessageSentFromSelectedUser =   newMessage.senderId == selectedUser._id
          if(!isMessageSentFromSelectedUser) return; 
            set({
                messages: [...get().messages, newMessage]
            })
        })
        socket.on("messageUnsent", (messageId) => {
            set({
              messages: get().messages.filter((msg) => msg._id !== messageId),
            });
          });

          socket.on('messageEdited', ({ id, text }) => {
            set({
              messages: get().messages.map((msg) =>
                msg._id === id ? { ...msg, text } : msg
              ),
            });
          });
        
    },
    unsubscribeFromMessages: () => {
        const socket = useAuthStore.getState().socket
        socket.off("newMessage")
    }

    

}))