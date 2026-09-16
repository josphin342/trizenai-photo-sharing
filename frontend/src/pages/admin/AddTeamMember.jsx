import { useState } from "react";
import api from "../../services/api";

const AddTeamMember = ({
  eventId,
  onMemberAdded,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await api.post(
        `/events/${eventId}/members`,
        formData
      );

      setSuccess(response.data.message);

      setFormData({
        name: "",
        email: "",
        password: "",
      });

      if (onMemberAdded) {
        onMemberAdded();
      }
    } catch (error) {
      console.error(
        "Add team member error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to add team member"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-t border-slate-200 pt-6">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-900">
          Add Team Member
        </h3>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          Create a new team member or assign an existing team member to this event.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <div>
          <label
            htmlFor={`member-name-${eventId}`}
            className="block text-xs font-semibold text-slate-700"
          >
            Name
          </label>

          <input
            id={`member-name-${eventId}`}
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            placeholder="Photographer name"
            required
            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </div>

        <div>
          <label
            htmlFor={`member-email-${eventId}`}
            className="block text-xs font-semibold text-slate-700"
          >
            Email
          </label>

          <input
            id={`member-email-${eventId}`}
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="photographer@example.com"
            required
            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </div>

        <div>
          <label
            htmlFor={`member-password-${eventId}`}
            className="block text-xs font-semibold text-slate-700"
          >
            Temporary Password
          </label>

          <p className="text-sm text-slate-500 mt-1">
            Required only when creating a new team member. Leave blank when assigning
            an existing team member.
          </p>

          <input
            id={`member-password-${eventId}`}
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Minimum 8 characters"
            minLength={6}
            required
            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-xs font-medium text-red-700">
              {error}
            </p>
          </div>
        )}

        {success && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3">
            <p className="text-xs font-medium text-green-700">
              {success}
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Adding..."
            : "Add Team Member"}
        </button>
      </form>
    </div>
  );
};

export default AddTeamMember;