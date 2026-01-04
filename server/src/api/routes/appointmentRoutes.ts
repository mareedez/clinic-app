import { Router } from "express";
import type { AppointmentRepository } from "../../ports/repositories/AppointmentRepository.js";
import { CreateScheduledAppointment } from "../../application/services/appointments/ScheduleAppointment.js";
import { CancelScheduledAppointment } from "../../application/services/appointments/CancelAppointment.js";
import { CheckInAppointment } from "../../application/services/appointments/CheckInAppointment.js";
import { StartAppointment } from "../../application/services/appointments/StartAppointment.js";
import { CompleteAppointment } from "../../application/services/appointments/CompleteAppointment.js";
import { MarkNoShow } from "../../application/services/appointments/MarkNoShow.js";
import { GetAvailableSlots } from "../../application/services/appointments/queries/GetAvailableSlots.js";
import { ListAppointments } from "../../application/services/appointments/queries/listAppointments.js";
import { GetAppointmentById } from "../../application/services/appointments/queries/getAppointmentById.js";
import type {RequestContext} from "../../shared/types.js";
import type {AuthenticatedRequest} from "../middleware/auth.js";

export function createAppointmentRouter(repo: AppointmentRepository) {
    const router = Router();

    const scheduleService = new CreateScheduledAppointment(repo);
    const cancelService = new CancelScheduledAppointment(repo);
    const checkInService = new CheckInAppointment(repo);
    const startService = new StartAppointment(repo);
    const completeService = new CompleteAppointment(repo);
    const noShowService = new MarkNoShow(repo);

    const slotsService = new GetAvailableSlots(repo);
    const listService = new ListAppointments(repo);
    const getByIdService = new GetAppointmentById(repo);

    const getCtx = (req: any): RequestContext => {
        if (!req.context) throw new Error("Request context is missing. Check auth middleware.");
        return req.context;
    };


    router.get("/", async (req: AuthenticatedRequest, res, next) => {
        try {
            const result = await listService.execute(req.query, getCtx(req));
            res.json(result);
        } catch (error) { next(error); }
    });

    router.get("/slots", async (req, res, next) => {
        try {
            const result = await slotsService.execute(req.query);
            res.json(result);
        } catch (error) { next(error); }
    });

    router.get("/:id", async (req, res, next) => {
        try {
            const result = await getByIdService.execute(req.params.id as any, getCtx(req));
            res.json(result);
        } catch (error) { next(error); }
    });


    router.post("/", async (req, res, next) => {
        try {
            const result = await scheduleService.execute(req.body, getCtx(req));
            res.status(201).json(result);
        } catch (error) { next(error); }
    });

    router.post("/:id/cancel", async (req, res, next) => {
        try {
            const input = { ...req.body, appointmentId: req.params.id };
            const result = await cancelService.execute(input, getCtx(req));
            res.json(result);
        } catch (error) { next(error); }
    });

    router.post("/:id/check-in", async (req, res, next) => {
        try {
            const input = { ...req.body, appointmentId: req.params.id };
            const result = await checkInService.execute(input, getCtx(req));
            res.json(result);
        } catch (error) { next(error); }
    });

    router.post("/:id/start", async (req, res, next) => {
        try {
            const input = { ...req.body, appointmentId: req.params.id };
            const result = await startService.execute(input, getCtx(req));
            res.json(result);
        } catch (error) { next(error); }
    });

    router.post("/:id/complete", async (req, res, next) => {
        try {
            const input = { ...req.body, appointmentId: req.params.id };
            const result = await completeService.execute(input, getCtx(req));
            res.json(result);
        } catch (error) { next(error); }
    });

    router.post("/:id/no-show", async (req, res, next) => {
        try {
            const input = { ...req.body, appointmentId: req.params.id };
            const result = await noShowService.execute(input, getCtx(req));
            res.json(result);
        } catch (error) { next(error); }
    });

    return router;
}