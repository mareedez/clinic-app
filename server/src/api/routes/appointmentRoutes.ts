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
import type { RequestContext } from "../../shared/types.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { GetPhysicianDashboard } from "../../application/services/appointments/queries/GetPhysicianDashboard.js";
import { GetPatientDashboard } from "../../application/services/appointments/queries/GetPatientDashboard.js";
import { AppointmentMapper } from "../../application/services/appointments/AppointmentMapper.js";
import type { UserRepository } from "../../ports/repositories/UserRepository.js";
import { SearchPatients } from "../../application/services/appointments/queries/SearchPatients.js";
import { RegisterWalkIn } from "../../application/services/appointments/RegisterWalkIn.js";
import { GetDailyReport } from "../../application/services/appointments/queries/GetDailyReport.js";
import {CLINIC_CONFIG} from "../../config/clinicConfig.js";

export function createAppointmentRouter(repo: AppointmentRepository, userRepo: UserRepository) {
    const router = Router();
    const mapper = new AppointmentMapper(userRepo);

    // Services
    const scheduleService = new CreateScheduledAppointment(repo, mapper);
    const cancelService = new CancelScheduledAppointment(repo, mapper);
    const checkInService = new CheckInAppointment(repo, mapper);
    const startService = new StartAppointment(repo, mapper);
    const completeService = new CompleteAppointment(repo, mapper);
    const noShowService = new MarkNoShow(repo, mapper);
    const dashboardService = new GetPhysicianDashboard(repo, mapper);
    const patientDashboardService = new GetPatientDashboard(repo, mapper);
    const slotsService = new GetAvailableSlots(repo, userRepo);
    const listService = new ListAppointments(repo, mapper);
    const getByIdService = new GetAppointmentById(repo, mapper);
    const searchPatientsService = new SearchPatients(userRepo);
    const registerWalkInService = new RegisterWalkIn(repo, userRepo, mapper);
    const reportService = new GetDailyReport(repo, mapper);

    // Helpers
    const getCtx = (req: any): RequestContext => {
        if (!req.context) throw new Error("Request context is missing. Check auth middleware.");
        return req.context;
    };

    const notifyUpdates = (req: any, physicianId?: string) => {
        const io = req.app.get("io");
        if (!io) return;

        io.to("front-desk").emit("dashboard-update");
        if (physicianId) {
            io.to(`physician-${physicianId}`).emit("appointment-update");
        } else {
            io.to("physicians").emit("appointment-update");
        }
    };

    router.get("/config", async (_req, res) => {
        res.json(CLINIC_CONFIG);
    });

    router.get("/dashboard/patient", async (req, res, next) => {
        try {
            const result = await patientDashboardService.execute(getCtx(req));
            res.json(result);
        } catch (error) { next(error); }
    });

    router.get("/dashboard/physician", async (req, res, next) => {
        try {
            const result = await dashboardService.execute(getCtx(req));
            res.json(result);
        } catch (error) { next(error); }
    });

    router.get("/patients/search", async (req, res, next) => {
        try {
            const result = await searchPatientsService.execute(req.query.q as string);
            res.json(result);
        } catch (error) { next(error); }
    });

    router.get("/slots", async (req, res, next) => {
        try {
            const result = await slotsService.execute(req.query);
            res.json(result);
        } catch (error) { next(error); }
    });

    router.get("/reports/daily", async (req, res, next) => {
        try {
            const date = req.query.date ? new Date(req.query.date as string) : new Date();
            const result = await reportService.execute(date);
            res.json(result);
        } catch (error) { next(error); }
    });

    router.get("/:id", async (req, res, next) => {
        try {
            const result = await getByIdService.execute(req.params.id as any, getCtx(req));
            res.json(result);
        } catch (error) { next(error); }
    });

    router.get("/", async (req: AuthenticatedRequest, res, next) => {
        try {
            const result = await listService.execute(req.query, getCtx(req));
            res.json(result);
        } catch (error) { next(error); }
    });


    router.post("/", async (req, res, next) => {
        try {
            const result = await scheduleService.execute(req.body, getCtx(req));
            notifyUpdates(req, result.physician?.id);
            res.status(201).json(result);
        } catch (error) { next(error); }
    });

    router.post("/walk-in", async (req, res, next) => {
        try {
            const result = await registerWalkInService.execute(req.body, getCtx(req));
            notifyUpdates(req, result.physician?.id);
            res.status(201).json(result);
        } catch (error) { next(error); }
    });

    router.post("/:id/cancel", async (req, res, next) => {
        try {
            const result = await cancelService.execute({ ...req.body, appointmentId: req.params.id }, getCtx(req));
            notifyUpdates(req, result.physician?.id);
            res.json(result);
        } catch (error) { next(error); }
    });

    router.post("/:id/check-in", async (req, res, next) => {
        try {
            const result = await checkInService.execute({ ...req.body, appointmentId: req.params.id }, getCtx(req));
            notifyUpdates(req, result.physician?.id);
            res.json(result);
        } catch (error) { next(error); }
    });

    router.post("/:id/start", async (req, res, next) => {
        try {
            const result = await startService.execute({ ...req.body, appointmentId: req.params.id }, getCtx(req));
            notifyUpdates(req, result.physician?.id);
            res.json(result);
        } catch (error) { next(error); }
    });

    router.post("/:id/complete", async (req, res, next) => {
        try {
            const result = await completeService.execute({ ...req.body, appointmentId: req.params.id }, getCtx(req));
            notifyUpdates(req, result.physician?.id);
            res.json(result);
        } catch (error) { next(error); }
    });

    router.post("/:id/no-show", async (req, res, next) => {
        try {
            const result = await noShowService.execute({ ...req.body, appointmentId: req.params.id }, getCtx(req));
            notifyUpdates(req, result.physician?.id);
            res.json(result);
        } catch (error) { next(error); }
    });

    return router;
}