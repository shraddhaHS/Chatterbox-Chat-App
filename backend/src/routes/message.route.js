import {Router} from "express"
import { protectRoute } from "../middleware/auth.middleware.js"
import { getUsersForSidebar ,getMessages,sendMessage, unsendMessage,editMessage} from "../controllers/message.controller.js"

const router = Router()

router.get("/users",protectRoute,getUsersForSidebar)

router.get("/:id",protectRoute,getMessages)

router.post("/send/:id",protectRoute,sendMessage)

router.delete("/unsend/:id", protectRoute,unsendMessage)

router.put("/edit/:id", protectRoute, editMessage)





export default router