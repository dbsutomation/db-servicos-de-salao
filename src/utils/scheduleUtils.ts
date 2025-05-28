
// Re-export das funções para manter compatibilidade
export {
  isPastTimeSlot,
  getAppointmentsForSlot,
  isFirstSlotOfAppointment,
  isPastAppointment,
  generateWorkingHours,
  generateMainHours
} from './scheduleCalculations';

export {
  isValidTimeString as validateTimeData,
  sanitizeTimeString as safeTimeExtraction,
  isValidAppointmentData,
  isValidDateString
} from './scheduleValidation';
