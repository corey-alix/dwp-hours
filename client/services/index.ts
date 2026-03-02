/**
 * Service layer — barrel export.
 *
 * Usage:
 *   import { getServices } from "../services/index.js";
 *   const { pto, employees } = getServices();
 */
export {
  ServiceContainer,
  getServices,
  setServices,
} from "./service-container.js";
export type {
  IAuthApiService,
  IPtoService,
  IAcknowledgementService,
  IHoursService,
  IAdminService,
  IEmployeeService,
  INotificationService,
  IImportService,
  IHealthService,
} from "./interfaces.js";
