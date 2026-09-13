import { useEffect, useState } from "react";
import api from "../../services/api";
import { getPhotoBlob } from "../../services/photoService";

const PhotoManager = ({ eventId }) => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/photos/${eventId}`);

      const photoData = await Promise.all(
        response.data.photos.map(async (photo) => {
          const imageUrl = await getPhotoBlob(
            eventId,
            photo._id
          );

          return {
            ...photo,
            imageUrl,
          };
        })
      );

      setPhotos(photoData);
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          "Failed to load photos"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, [eventId]);

  const toggleSelection = async (
    photoId,
    currentStatus
  ) => {
    try {
      await api.patch(
        `/photos/${eventId}/${photoId}/select`,
        {
          selected: !currentStatus,
        }
      );

      fetchPhotos();
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Failed to update photo"
      );
    }
  };

  if (loading) {
    return (
      <section>
        <h2 className="text-xl font-semibold text-gray-900">
          Photos
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          Loading photos...
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <h2 className="text-xl font-semibold text-gray-900">
          Photos
        </h2>

        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">
            {error}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-gray-900">
          Photos
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Review uploaded photos and select the ones
          to include in the customer gallery.
        </p>
      </div>

      {photos.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
          <p className="text-gray-500">
            No photos uploaded yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {photos.map((photo) => (
            <div
              key={photo._id}
              className={`overflow-hidden rounded-xl border bg-white shadow-sm transition ${
                photo.selected
                  ? "border-2 border-green-500 shadow-md"
                  : "border-gray-200"
              }`}
            >
              <div className="aspect-square overflow-hidden bg-gray-100">
                <img
                  src={photo.imageUrl}
                  alt={photo.filename}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="p-4">
                <p
                  className="truncate font-medium text-gray-900"
                  title={photo.filename}
                >
                  {photo.filename}
                </p>

                <div className="mt-2">
                  {photo.selected ? (
                    <span className="inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                      Selected
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                      Not Selected
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    toggleSelection(
                      photo._id,
                      photo.selected
                    )
                  }
                  className={`mt-4 w-full rounded-lg px-4 py-2 text-sm font-medium transition ${
                    photo.selected
                      ? "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                      : "bg-gray-900 text-white hover:bg-gray-800"
                  }`}
                >
                  {photo.selected
                    ? "Unselect Photo"
                    : "Select Photo"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default PhotoManager;