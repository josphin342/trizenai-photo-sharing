import { useEffect, useState } from "react";
import api from "../../services/api";

const GalleryManager = ({ eventId }) => {
  const [photos, setPhotos] = useState([]);
  const [pin, setPin] = useState("");
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [gallery, setGallery] = useState(null);

  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [loadingGallery, setLoadingGallery] = useState(true);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingPhotos(true);
        setLoadingGallery(true);
        setError("");

        const photoResponse = await api.get(
          `/photos/${eventId}`
        );

        const eventPhotos =
          photoResponse.data.photos || [];

        setPhotos(eventPhotos);

        const galleryResponse = await api.get(
          `/galleries/${eventId}`
        );

        const existingGallery =
          galleryResponse.data.gallery;

        setGallery(existingGallery);

        // For an existing gallery, use the gallery's
        // actual selectedPhotos list.
        if (existingGallery) {
          setSelectedPhotos(
            (existingGallery.selectedPhotos || []).map(
              (photoId) => photoId.toString()
            )
          );
        } else {
          // No gallery yet: start with photos that the
          // Admin has marked as selected.
          const adminSelectedPhotos =
            eventPhotos
              .filter(
                (photo) => photo.selected === true
              )
              .map((photo) => photo._id);

          setSelectedPhotos(
            adminSelectedPhotos
          );
        }
      } catch (error) {
        // A 404 simply means this event does not
        // have a gallery yet.
        if (error.response?.status === 404) {
          setGallery(null);

          const adminSelectedPhotos =
            photos
              .filter(
                (photo) => photo.selected === true
              )
              .map((photo) => photo._id);

          setSelectedPhotos(
            adminSelectedPhotos
          );
        } else {
          console.error(
            "Failed to load gallery data:",
            error
          );

          setError(
            error.response?.data?.message ||
              "Failed to load gallery"
          );
        }
      } finally {
        setLoadingPhotos(false);
        setLoadingGallery(false);
      }
    };

    loadData();
  }, [eventId]);

  const togglePhoto = (photoId) => {
    setSelectedPhotos((previous) => {
      if (previous.includes(photoId)) {
        return previous.filter(
          (id) => id !== photoId
        );
      }

      return [...previous, photoId];
    });
  };

  const createGallery = async () => {
    setError("");
    setSuccess("");

    if (!/^\d{6}$/.test(pin)) {
      setError(
        "Gallery PIN must be exactly 6 digits"
      );
      return;
    }

    if (selectedPhotos.length === 0) {
      setError("Select at least one photo");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post(
        `/galleries/${eventId}`,
        {
          pin,
          selectedPhotos,
        }
      );

      setGallery(
        response.data.gallery
      );

      setSelectedPhotos(
        (response.data.gallery.selectedPhotos || []).map(
          (photoId) => photoId.toString()
        )
      );

      setSuccess(
        "Gallery created successfully"
      );
    } catch (error) {
      console.error(
        "Create gallery error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to create gallery"
      );
    } finally {
      setLoading(false);
    }
  };

  const updateGalleryPhotos = async () => {
    if (!gallery) {
      return;
    }

    setError("");
    setSuccess("");

    if (selectedPhotos.length === 0) {
      setError("Select at least one photo");
      return;
    }

    try {
      setLoading(true);

      const response = await api.patch(
        `/galleries/${eventId}/${gallery.id}/photos`,
        {
          selectedPhotos,
        }
      );

      setGallery(
        response.data.gallery
      );

      setSelectedPhotos(
        (response.data.gallery.selectedPhotos || []).map(
          (photoId) => photoId.toString()
        )
      );

      setSuccess(
        "Gallery photos updated successfully"
      );
    } catch (error) {
      console.error(
        "Update gallery photos error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to update gallery photos"
      );
    } finally {
      setLoading(false);
    }
  };

  const publishGallery = async () => {
    if (!gallery) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      setLoading(true);

      const response = await api.patch(
        `/galleries/${eventId}/${gallery.id}/publish`
      );

      setGallery(
        response.data.gallery
      );

      setSuccess(
        "Gallery published successfully"
      );
    } catch (error) {
      console.error(
        "Publish gallery error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to publish gallery"
      );
    } finally {
      setLoading(false);
    }
  };

  const shareLink = gallery?.shareToken
    ? `${window.location.origin}/gallery/${gallery.shareToken}`
    : "";

  if (
    loadingPhotos ||
    loadingGallery
  ) {
    return (
      <section>
        <h2 className="text-xl font-semibold text-slate-900">
          Gallery
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Loading gallery...
        </p>
      </section>
    );
  }

  return (
    <section>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900">
          Gallery
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Create and manage the customer gallery
          for this event.
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-700">
            {error}
          </p>
        </div>
      )}

      {success && (
        <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-medium text-green-700">
            {success}
          </p>
        </div>
      )}

      {/* No gallery yet */}
      {!gallery && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <label
              htmlFor="gallery-pin"
              className="block text-sm font-semibold text-slate-900"
            >
              Gallery PIN
            </label>

            <p className="mt-1 text-sm text-slate-500">
              Create a 6-digit PIN that the customer
              will use to access the gallery.
            </p>

            <input
              id="gallery-pin"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(event) => {
                const value =
                  event.target.value.replace(
                    /\D/g,
                    ""
                  );

                setPin(value);
              }}
              placeholder="Enter 6-digit PIN"
              className="mt-3 w-full max-w-xs rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <PhotoSelection
            photos={photos}
            selectedPhotos={selectedPhotos}
            togglePhoto={togglePhoto}
            title="Select Photos for Gallery"
            description="Choose the photos that you want to include in the customer gallery."
          />

          <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Photos selected for gallery
              </p>

              <p className="text-2xl font-bold text-slate-900">
                {selectedPhotos.length}
              </p>
            </div>

            <button
              type="button"
              onClick={createGallery}
              disabled={loading}
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Creating..."
                : "Create Gallery"}
            </button>
          </div>
        </div>
      )}

      {/* Existing draft gallery */}
      {gallery && !gallery.isPublished && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Gallery Draft
                </h3>

                <p className="mt-1 text-sm text-slate-600">
                  Review the selected photos before
                  publishing the gallery.
                </p>
              </div>

              <span className="inline-flex w-fit rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                Unpublished
              </span>
            </div>
          </div>

          <PhotoSelection
            photos={photos}
            selectedPhotos={selectedPhotos}
            togglePhoto={togglePhoto}
            title="Manage Gallery Photos"
            description="Add or remove Admin-selected photos from this draft gallery."
          />

          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Photos in gallery
              </p>

              <p className="text-2xl font-bold text-slate-900">
                {selectedPhotos.length}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={updateGalleryPhotos}
                disabled={loading}
                className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Saving..."
                  : "Save Gallery Changes"}
              </button>

              <button
                type="button"
                onClick={publishGallery}
                disabled={
                  loading ||
                  selectedPhotos.length === 0
                }
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Publishing..."
                  : "Publish Gallery"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Published gallery */}
      {gallery && gallery.isPublished && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-green-800">
                  Gallery Published Successfully
                </h3>

                <p className="mt-1 text-sm text-green-700">
                  This gallery is now available to
                  customers through the shareable link.
                </p>
              </div>

              <span className="inline-flex w-fit rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                Published
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div>
              <p className="text-sm text-slate-500">
                Photos in gallery
              </p>

              <p className="text-2xl font-bold text-slate-900">
                {gallery.selectedPhotos?.length ||
                  0}
              </p>
            </div>

            <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
              <label
                htmlFor="share-link"
                className="block text-sm font-semibold text-slate-800"
              >
                Gallery Link
              </label>

              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  id="share-link"
                  type="text"
                  value={shareLink}
                  readOnly
                  className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none"
                />

                <button
                  type="button"
                  onClick={() =>
                    navigator.clipboard.writeText(
                      shareLink
                    )
                  }
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Copy Link
                </button>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-800">
                🔐 Customer access
              </p>

              <p className="mt-1 text-sm text-slate-500">
                The customer must enter the Gallery
                PIN to view the published photos.
              </p>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Gallery status
              </p>

              <p className="mt-1 text-sm font-medium text-slate-700">
                Published galleries are locked and
                cannot be modified.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

const PhotoSelection = ({
  photos,
  selectedPhotos,
  togglePhoto,
  title,
  description,
}) => {
  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900">
          {title}
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          {description}
        </p>
      </div>

      {photos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
          <p className="text-sm text-slate-500">
            No photos available for this event.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo) => {
            const isAdminSelected =
              photo.selected === true;

            const isSelected =
              selectedPhotos.includes(
                photo._id
              );

            return (
              <label
                key={photo._id}
                className={`flex items-start gap-3 rounded-xl border p-4 transition ${
                  isSelected
                    ? "border-green-500 bg-green-50"
                    : "border-slate-200 bg-white"
                } ${
                  isAdminSelected
                    ? "cursor-pointer hover:border-slate-300"
                    : "cursor-not-allowed opacity-60"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  disabled={!isAdminSelected}
                  onChange={() =>
                    togglePhoto(photo._id)
                  }
                  className="mt-1 h-4 w-4 rounded border-slate-300"
                />

                <div className="min-w-0">
                  <p
                    className="truncate text-sm font-semibold text-slate-900"
                    title={photo.filename}
                  >
                    {photo.filename}
                  </p>

                  <p
                    className={`mt-1 text-xs font-medium ${
                      isAdminSelected
                        ? "text-green-700"
                        : "text-slate-500"
                    }`}
                  >
                    {isAdminSelected
                      ? "Admin Selected"
                      : "Not Admin Selected"}
                  </p>
                </div>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GalleryManager;