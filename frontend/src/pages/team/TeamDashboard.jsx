import { useAuth } from "../../context/AuthContext";
import { useEffect, useState } from "react";
import api from "../../services/api";

const TeamDashboard = () => {
  const { user, logout } = useAuth();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [photos, setPhotos] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingPhotos, setLoadingPhotos] = useState(false);

  const [error, setError] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");

  const [selectedFiles, setSelectedFiles] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoadingEvents(true);
        setError("");

        const response = await api.get("/events/my-events");

        setEvents(response.data.events || []);
      } catch (error) {
        console.error(
          "Failed to fetch assigned events:",
          error
        );

        setError(
          error.response?.data?.message ||
            "Failed to load assigned events"
        );
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchEvents();
  }, []);

  const openEvent = async (event) => {
    try {
      setLoadingPhotos(true);
      setError("");
      setUploadMessage("");

      const response = await api.get(
        `/photos/${event._id}`
      );

      // Open the event only after backend authorization succeeds
      setSelectedEvent(event);
      setPhotos(response.data.photos || []);
    } catch (error) {
      console.error(
        "Failed to load event photos:",
        error
      );

      setSelectedEvent(null);
      setPhotos([]);

      setError(
        error.response?.data?.message ||
          "Failed to load photos"
      );
    } finally {
      setLoadingPhotos(false);
    }
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);

    if (files.length > 20) {
      setError(
        "You can upload a maximum of 20 photos at once."
      );

      setSelectedFiles([]);
      return;
    }

    setError("");
    setUploadMessage("");
    setSelectedFiles(files);
  };

  const uploadPhotos = async () => {
    if (!selectedEvent) {
      return;
    }

    if (selectedFiles.length === 0) {
      setError("Please select at least one photo.");
      return;
    }

    try {
      setError("");
      setUploadMessage("");

      const formData = new FormData();

      selectedFiles.forEach((file) => {
        formData.append("photos", file);
      });

      const response = await api.post(
        `/photos/${selectedEvent._id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setUploadMessage(
        response.data.message ||
          "Photos uploaded successfully."
      );

      setSelectedFiles([]);

      const photoResponse = await api.get(
        `/photos/${selectedEvent._id}`
      );

      setPhotos(photoResponse.data.photos || []);
    } catch (error) {
      console.error(
        "Photo upload error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to upload photos"
      );
    }
  };

  const closeEvent = () => {
    setSelectedEvent(null);
    setPhotos([]);
    setSelectedFiles([]);
    setError("");
    setUploadMessage("");
  };

  if (loadingEvents) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="h-8 w-64 animate-pulse rounded-lg bg-slate-200" />
            <div className="mt-3 h-4 w-80 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 px-4 py-8 sm:px-6 lg:px-8 xl:px-10">
      <div className="mx-auto w-full max-w-7xl">

        {!selectedEvent && (
          <>
            {/* Header */}
            <header className="mb-8 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
  <div>
    <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
      Team Member Dashboard
    </h1>

    <p className="mt-1 text-sm text-slate-500">
      Welcome, {user?.name}. View your assigned events
      and upload photos for each event.
    </p>
  </div>

  <button
    type="button"
    onClick={logout}
    className="w-fit rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
  >
    Logout
  </button>


              <div className="flex w-fit items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {events.length}
                  </p>
                  <p className="text-xs font-medium text-slate-500">
                    Assigned Event
                    {events.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
           </header>

            {error && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-medium text-red-700">
                  {error}
                </p>
              </div>
            )}

            <div className="mb-5">
              <h2 className="text-xl font-semibold text-slate-900">
                My Assigned Events
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Select an event to upload and view your
                photos.
              </p>
            </div>

            {events.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl">
                  📷
                </div>

                <h3 className="mt-4 text-lg font-semibold text-slate-900">
                  No Assigned Events
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  No events have been assigned to you
                  yet. Once an Admin assigns an event,
                  it will appear here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {events.map((event) => (
                  <div
                    key={event._id}
                    className="group flex min-h-[250px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="flex flex-1 flex-col p-6">
                      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-xl">
                        📷
                      </div>

                      <h3 className="text-lg font-semibold text-slate-900">
                        {event.name}
                      </h3>

                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">
                        {event.description ||
                          "No description provided for this event."}
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          openEvent(event)
                        }
                        className="mt-auto pt-6"
                      >
                        <span className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition group-hover:bg-slate-800">
                          Open Event
                          <span aria-hidden="true">
                            →
                          </span>
                        </span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {selectedEvent && (
          <>
            {/* Back button */}
            <button
              type="button"
              onClick={closeEvent}
              className="mb-6 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              <span aria-hidden="true">←</span>
              Back to My Events
            </button>

            {/* Event header */}
            <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="mb-3 inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    Assigned Event
                  </div>

                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    {selectedEvent.name}
                  </h1>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {selectedEvent.description ||
                      "No description provided for this event."}
                  </p>
                </div>

                <div className="w-fit rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
                  <p className="text-2xl font-bold text-slate-900">
                    {photos.length}
                  </p>
                  <p className="text-xs font-medium text-slate-500">
                    Uploaded Photo
                    {photos.length !== 1
                      ? "s"
                      : ""}
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-medium text-red-700">
                  {error}
                </p>
              </div>
            )}

            {uploadMessage && (
              <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4">
                <p className="text-sm font-medium text-green-700">
                  {uploadMessage}
                </p>
              </div>
            )}

            {/* Upload section */}
            <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-slate-900">
                  Upload Photos
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Upload up to 20 photos at once.
                  JPEG, PNG and WebP images are allowed.
                </p>
              </div>

              <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 transition hover:border-slate-400">
                <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm">
                    📷
                  </div>

                  <h3 className="mt-4 text-base font-semibold text-slate-900">
                    Select photos to upload
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Choose multiple JPEG, PNG or WebP
                    images.
                  </p>

                  <label
                    htmlFor="team-photo-upload"
                    className="mt-5 inline-flex cursor-pointer items-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Choose Photos
                  </label>

                  <input
                    id="team-photo-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handleFileChange}
                    className="sr-only"
                  />

                  {selectedFiles.length > 0 && (
                    <div className="mt-5 w-full rounded-xl border border-slate-200 bg-white p-4 text-left">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {selectedFiles.length} photo
                            {selectedFiles.length !== 1
                              ? "s"
                              : ""}{" "}
                            selected
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            Ready to upload to this event.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={uploadPhotos}
                          className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                          Upload Photos
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <p className="mt-4 text-xs text-slate-400">
                Maximum 20 photos per upload.
              </p>

              {selectedFiles.length === 0 && (
                <button
                  type="button"
                  onClick={uploadPhotos}
                  disabled
                  className="mt-5 rounded-xl bg-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-400"
                >
                  Upload Photos
                </button>
              )}
            </section>

            {/* Photos */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    My Uploaded Photos
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Photos uploaded by you for this
                    event.
                  </p>
                </div>

                {photos.length > 0 && (
                  <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {photos.length} photo
                    {photos.length !== 1
                      ? "s"
                      : ""}
                  </span>
                )}
              </div>

              {loadingPhotos ? (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {Array.from({ length: 4 }).map(
                    (_, index) => (
                      <div
                        key={index}
                        className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                      >
                        <div className="aspect-square animate-pulse bg-slate-200" />
                        <div className="space-y-2 p-4">
                          <div className="h-4 animate-pulse rounded bg-slate-200" />
                          <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : photos.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
                  <img
                    src="/logo.svg"
                    alt="TrizenAI Photos"
                    className="h-10 w-10 rounded-xl"
                  />

                  <p className="mt-4 font-medium text-slate-800">
                    No photos uploaded yet
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Select photos above to start
                    uploading.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {photos.map((photo) => (
                    <TeamPhotoCard
                      key={photo._id}
                      eventId={selectedEvent._id}
                      photo={photo}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
};

const TeamPhotoCard = ({
  eventId,
  photo,
}) => {
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadPhoto = async () => {
      try {
        const response = await api.get(
          `/photos/${eventId}/${photo._id}`
        );

        if (active) {
          setImageUrl(response.data.url);
        }
      } catch (error) {
        console.error(
          "Failed to load photo:",
          error
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadPhoto();

    return () => {
      active = false;
    };
  }, [eventId, photo._id]);

  return (
    <div className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg">
      <div className="aspect-square overflow-hidden bg-slate-100">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
          </div>
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt={photo.filename}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-4 text-center">
            <p className="text-sm text-slate-500">
              Unable to load photo.
            </p>
          </div>
        )}
      </div>

      <div className="p-4">
        <p
          className="truncate text-sm font-semibold text-slate-900"
          title={photo.filename}
        >
          {photo.filename}
        </p>

        {photo.fileSize && (
          <p className="mt-1 text-xs text-slate-500">
            {Math.round(
              photo.fileSize / 1024
            )}{" "}
            KB
          </p>
        )}
      </div>
    </div>
  );
};

export default TeamDashboard;