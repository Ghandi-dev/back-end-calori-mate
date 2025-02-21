import { ACTIVITY_LEVELS } from "./enum";

export const tdeeCalculate = (bmr: number, activity: string) => {
  if (activity === ACTIVITY_LEVELS.SEDENTARY) {
    return bmr * 1.2;
  }
  if (activity === ACTIVITY_LEVELS.LIGHTLY_ACTIVE) {
    return bmr * 1.375;
  }
  if (activity === ACTIVITY_LEVELS.MODERATELY_ACTIVE) {
    return bmr * 1.55;
  }
  if (activity === ACTIVITY_LEVELS.VERY_ACTIVE) {
    return bmr * 1.725;
  }
  if (activity === ACTIVITY_LEVELS.SUPER_ACTIVE) {
    return bmr * 1.9;
  }
};
