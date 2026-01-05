import type {AppointmentRepository} from "../../../ports/repositories/AppointmentRepository.js";

export class MarkOverdueAsNoShow {
    constructor(private readonly repo: AppointmentRepository) {}

    async execute(): Promise<number> {
        const threshold = new Date(Date.now() - 30 * 60 * 1000);
        const overdueApts = await this.repo.findOverdueScheduled(threshold);
        
        for (const apt of overdueApts) {
            apt.markNoShow(new Date());
            await this.repo.save(apt);
        }

        return overdueApts.length;
    }
}