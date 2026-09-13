import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";

const GalleryAccess = () => {
  const { shareToken } = useParams();
  const navigate = useNavigate();

  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const verifyPin = async (event) => {
    event.preventDefault();

    setError("");

    if (!/^\d{6}$/.test(pin)) {
      setError(
        "Gallery PIN must be exactly 6 digits"
      );
      return;
    }

    try {
      setLoading(true);

      const response = await api.post(
        `/galleries/public/${shareToken}/verify`,
        {
          pin,
        }
      );

      localStorage.setItem(
        "galleryAccessToken",
        response.data.accessToken
      );

      navigate(
        `/gallery/${shareToken}/photos`
      );
    } catch (error) {
      console.error(
        "Gallery PIN verification error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to verify PIN"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
  <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 px-4 py-10 sm:px-6">
    <div className="w-full max-w-md">

      <div className="mb-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-3xl shadow-sm">
          🔐
        </div>

        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          Private Gallery
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Access Your Gallery
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Enter the 6-digit PIN provided to you
            to securely view your photos.
          </p>
        </div>

        <form onSubmit={verifyPin} className="mt-8">
          <div>
            <label
              htmlFor="gallery-pin"
              className="block text-sm font-semibold text-slate-800"
            >
              Gallery PIN
            </label>

            <input
              id="gallery-pin"
              type="password"
              inputMode="numeric"
              maxLength={6}
              autoComplete="one-time-code"
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
              className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-center text-lg font-semibold tracking-[0.4em] text-slate-900 outline-none transition placeholder:tracking-normal placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-center text-sm font-medium text-red-700">
                {error}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-slate-900 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Access Gallery"}
          </button>
        </form>

        <div className="mt-6 border-t border-slate-200 pt-5">
          <p className="text-center text-xs leading-5 text-slate-400">
            This gallery is private. Your PIN is
            required to access the published photos.
          </p>
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-slate-400">
        Secure customer access
      </p>
    </div>
  </div>
);
};

export default GalleryAccess;