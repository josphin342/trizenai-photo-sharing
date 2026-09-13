import api from "./api";

export const getPhotoBlob = async (eventId, photoId) => {
  const response = await api.get(
    `/photos/${eventId}/${photoId}`
  );

  return response.data.url;
};