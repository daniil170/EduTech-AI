export const getMonthsUntilENT = () => {
  const currentDate = new Date();
  const entDate = new Date("2027-06-01");

  const diffTime = entDate - currentDate;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 0;

  return Math.ceil(diffDays / 30);
};

export const calculateEntPrice = (monthlyPrice, monthsLeft) => {
  const rawPrice = monthlyPrice * monthsLeft;

  let discount = 0;
  if (monthsLeft >= 6) discount = 0.25;
  else if (monthsLeft >= 3) discount = 0.15;

  const priceWithDiscount = rawPrice * (1 - discount);
  const rounded = Math.round(priceWithDiscount / 1000) * 1000 - 100;

  return Math.max(rounded, monthlyPrice);
};
