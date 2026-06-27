import { Router } from "express";
import { 
    getBookingController, 
    createBookingController, 
    getAllBookingsController, 
    updateBookingController, 
    deleteBookingController 
} from "../controllers/booking.controller";
import { validate } from "../middlewares/validate.middleware";
import { createBookingSchema, updateBookingSchema } from "../validations/booking.schema";

const router = Router();

router.get("/", getAllBookingsController);
router.get("/:id", getBookingController);
router.post("/", validate(createBookingSchema), createBookingController);
router.put("/:id", validate(updateBookingSchema), updateBookingController);
router.delete("/:id", deleteBookingController);

export default router;
