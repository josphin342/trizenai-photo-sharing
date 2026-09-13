import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import customerApi from "../../services/customerApi";

const CustomerGallery = () => {
  const { shareToken } = useParams();
  const navigate = useNavigate();

  const [photos, setPhotos] = useState([]);
  const [imageUrls, setImageUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadGallery = async () => {
      try {
        setLoading(true);
        setError("");

        const accessToken = localStorage.getItem(
          "galleryAccessToken"
        );

        if (!accessToken) {
          navigate(`/gallery/${shareToken}`, {
            replace: true,
          });
          return;
        }

        const response = await customerApi.get(
          `/galleries/public/${shareToken}/photos`
        );

        const galleryPhotos =
          response.data.photos || [];

        if (!active) return;

        setPhotos(galleryPhotos);

        const urls = await Promise.all(
          galleryPhotos.map(async (photo) => {
            const photoResponse =
              await customerApi.get(
                `/galleries/public/${shareToken}/photos/${photo._id}`
              );

            return {
              id: photo._id,
              url: photoResponse.data.url,
            };
          })
        );

        if (active) {
          setImageUrls(urls);
        }
      } catch (error) {
        console.error(
          "Customer gallery error:",
          error
        );

        if (
          error.response?.status === 401 ||
          error.response?.status === 403
        ) {
          localStorage.removeItem(
            "galleryAccessToken"
          );

          navigate(`/gallery/${shareToken}`, {
            replace: true,
          });

          return;
        }

        setError(
          error.response?.data?.message ||
            "Failed to load gallery"
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadGallery();

    return () => {
      active = false;
    };
  }, [shareToken, navigate]);

  const logoutGallery = () => {
    localStorage.removeItem(
      "galleryAccessToken"
    );

    navigate(`/gallery/${shareToken}`, {
      replace: true,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="h-8 w-56 animate-pulse rounded-lg bg-slate-200" />
            <div className="mt-3 h-4 w-28 animate-pulse rounded bg-slate-100" />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map(
              (_, index) => (
                <div
                  key={index}
                  className="aspect-square animate-pulse rounded-2xl bg-slate-200"
                />
              )
            )}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-xl font-bold text-red-600">
            !
          </div>

          <h1 className="mt-5 text-xl font-semibold text-slate-900">
            Unable to Load Gallery
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {error}
          </p>

          <button
            type="button"
            onClick={logoutGallery}
            className="mt-6 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Back to PIN
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">

        {/* Header */}
        <header className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                Private Gallery
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Photo Gallery
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                {photos.length} photo
                {photos.length !== 1 ? "s" : ""}{" "}
                available
              </p>
            </div>

            <button
              type="button"
              onClick={logoutGallery}
              className="w-fit rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Exit Gallery
            </button>
          </div>
        </header>

        {/* Empty gallery */}
        {photos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl">
              📷
            </div>

            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              No Photos Available
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              There are currently no published photos
              available in this gallery.
            </p>
          </div>
        ) : (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-slate-900">
                Gallery Photos
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Browse the photos published for this
                gallery.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {photos.map((photo) => {
                const image = imageUrls.find(
                  (item) => item.id === photo._id
                );

                return (
                  <div
                    key={photo._id}
                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="relative aspect-square overflow-hidden bg-slate-100">
                      {image ? (
                        <img
                          src={image.url}
                          alt={photo.filename}
                          loading="lazy"
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
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
              })}
            </div>
          </section>
        )}

        <footer className="mt-8 text-center">
          <p className="text-xs text-slate-400">
            This gallery is protected and available
            through a secure access link.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default CustomerGallery;