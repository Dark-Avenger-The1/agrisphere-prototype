export const flattenUniqueCrops = (predictions) => {
  const cropSet = new Set();
  predictions.forEach(monthEntry => {
    monthEntry.suggestedCrops.forEach(crop => cropSet.add(crop));
  });
  return Array.from(cropSet);
};

export default flattenUniqueCrops;