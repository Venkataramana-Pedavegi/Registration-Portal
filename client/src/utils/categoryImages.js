export const CATEGORY_DEFAULT_IMAGES = {
  Cultural: '/category-images/cultural.png',
  Technical: '/category-images/technical.png',
  Sports: '/category-images/sports.png',
  Seminar: '/category-images/seminar.png',
  Workshop: '/category-images/workshop.png',
};

export const getEventImage = (event) => {
  if (event?.image && !event.image.includes('unsplash.com/photo-1501281668745')) {
    return event.image;
  }
  const categoryKey = event?.category
    ? Object.keys(CATEGORY_DEFAULT_IMAGES).find(
        (key) => key.toLowerCase() === event.category.trim().toLowerCase()
      )
    : null;

  return categoryKey ? CATEGORY_DEFAULT_IMAGES[categoryKey] : (event?.image || '/category-images/cultural.png');
};
