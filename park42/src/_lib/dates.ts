export const normalizeDate = (dt: Date): Date => {
  dt.setUTCHours(0, 0, 0, 0);
  return dt;
};

export const addMonthsSafely = (date: Date, months: number) => {
  const result = new Date(date);
  const originalDay = result.getDate();

  result.setDate(1);
  result.setMonth(result.getMonth() + months);

  const lastDayOfMonth = new Date(
    result.getFullYear(),
    result.getMonth() + 1,
    0,
  ).getDate();

  result.setDate(Math.min(originalDay, lastDayOfMonth));

  return result;
}
