import { Router } from "express";
import { 
    getServiceController, 
    createServiceController, 
    getAllServicesController, 
    updateServiceController, 
    deleteServiceController 
} from "../controllers/service.controller";
import { validate } from "../middlewares/validate.middleware";
import { createServiceSchema, updateServiceSchema } from "../validations/service.schema";

const router = Router();

router.get("/", getAllServicesController);
router.get("/:id", getServiceController);
router.post("/", validate(createServiceSchema), createServiceController);
router.put("/:id", validate(updateServiceSchema), updateServiceController);
router.delete("/:id", deleteServiceController);

export default router;
