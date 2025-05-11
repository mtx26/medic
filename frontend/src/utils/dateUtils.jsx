// dateUtils.js
import { format, parse, startOfISOWeek } from "date-fns";

export const formatWeekString = (date) => format(date, "RRRR-'W'II");
export const getMondayFromWeek = (weekStr) =>
  startOfISOWeek(parse(weekStr, "RRRR-'W'II", new Date()));
