import type {ServiceDTO} from "../dto/ServiceDTO.js";
import type {Service} from "../../shared/types.js";

export function toServiceDTO(s: Service): ServiceDTO {
    return {
        id: s.id,
        name: s.name,
        durationMinutes: s.durationMinutes,
        description: s.description,
        price: s.price
    };
}