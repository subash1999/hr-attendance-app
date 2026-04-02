import type { Holiday, Region } from "@willdesign-hr/types";

export interface HolidayRepository {
  findByRegionAndYear(region: Region, year: number): Promise<readonly Holiday[]>;
  save(holiday: Holiday): Promise<Holiday>;
  delete(region: Region, date: string): Promise<void>;
}
