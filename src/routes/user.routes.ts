import { Router } from "express";
import { 
    getUserController, 
    createUserController, 
    getAllUserController, 
    updateUserController, 
    deleteUserController 
} from "../controllers/user.controller";
import { validate } from "../middlewares/validate.middleware";
import { createUserSchema, updateUserSchema } from "../validations/user.schema";

const router = Router();

router.get("/", getAllUserController);
router.get("/:id", getUserController);
router.post("/", validate(createUserSchema), createUserController);
router.put("/:id", validate(updateUserSchema), updateUserController);
router.delete("/:id", deleteUserController);

export default router;
