const getMonthDateRange = (month, year) => {
  if (
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12 ||
    !Number.isInteger(year) ||
    year < 1000 ||
    year > 9999
  ) {
    return null;
  }

  return {
    start: new Date(Date.UTC(year, month - 1, 1)),
    end: new Date(Date.UTC(year, month, 1)),
  };
};

module.exports = getMonthDateRange;