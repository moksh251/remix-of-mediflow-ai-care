/** Shared read-only view of the Mediflow demo dataset for MCP tools.

 * Delegates the query logic to `@/lib/mediflow/queries` (the single shared
 * layer) and binds it to the deterministic seeded snapshot, so external MCP
 * callers get stable SSR-safe data while the in-app assistant reads the same
 * logic against the live store.
 */
import { DOCTORS, HOSPITALS, seedQueue } from "@/lib/mediflow/data";
import * as Q from "@/lib/mediflow/queries";
import type { Doctor } from "@/lib/mediflow/types";

export const DISCLAIMER = Q.DISCLAIMER;

export function entries() {
  return seedQueue();
}

export function hospitals() {
  return HOSPITALS;
}

export function doctorsFor(hospitalId?: string) {
  return hospitalId ? DOCTORS.filter((d) => d.hospitalId === hospitalId) : DOCTORS;
}

export function doctorSnapshot(doctor: Doctor) {
  return Q.doctorSnapshot(doctor, seedQueue());
}

export function hospitalLoad(hospitalId: string) {
  return Q.hospitalLoad(seedQueue(), DOCTORS, hospitalId);
}
