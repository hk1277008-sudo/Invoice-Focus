import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import invoicesRouter from "./invoices";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(invoicesRouter);

export default router;
