import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import invoicesRouter from "./invoices";
import clientsRouter from "./clients";
import dashboardRouter from "./dashboard";
import settingsRouter from "./settings";
import subscriptionsRouter from "./subscriptions";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(invoicesRouter);
router.use(clientsRouter);
router.use(dashboardRouter);
router.use(settingsRouter);
router.use(subscriptionsRouter);

export default router;
