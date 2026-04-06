import React, { useState, useEffect, useContext } from "react";
import { UserContext } from "../../context/UserContext";

const API = "https://myspectra.runasp.net/api/ProductReviews";

const StarRating = ({ rating, onRate, interactive = false }) => (
  <span style={{ display: "inline-flex", gap: "2px" }}>
    {[1, 2, 3, 4, 5].map((star) => (
      <span
        key={star}
        onClick={() => interactive && onRate(star)}
        style={{
          cursor: interactive ? "pointer" : "default",
          fontSize: "20px",
          color: star <= rating ? "#f59e0b" : "#d1d5db",
        }}
      >
        ★
      </span>
    ))}
  </span>
);

export default function ProductReviews({ frameId }) {
  const { user } = useContext(UserContext);
  const token = user?.token || JSON.parse(localStorage.getItem("user"))?.token;

  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  // Review form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formRating, setFormRating] = useState(5);
  const [formTitle, setFormTitle] = useState("");
  const [formComment, setFormComment] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const fetchReviews = async (p = 1) => {
    setLoading(true);
    try {
      const [revRes, sumRes] = await Promise.all([
        fetch(`${API}/frame/${frameId}?page=${p}&pageSize=5`),
        fetch(`${API}/frame/${frameId}/summary`),
      ]);
      if (revRes.ok) {
        const data = await revRes.json();
        setReviews(data.items || data.Items || []);
        setTotalPages(data.totalPages || data.TotalPages || 1);
        setPage(data.currentPage || data.CurrentPage || p);
      }
      if (sumRes.ok) {
        setSummary(await sumRes.json());
      }
    } catch {
      /* ignore */
    }
    setLoading(false);
  };

  useEffect(() => {
    if (frameId) fetchReviews(1);
  }, [frameId]);

  useEffect(() => {
    if (token && frameId) {
      fetch(`${API}/verified-purchase/${frameId}`, { headers })
        .then((r) => r.json())
        .then((d) =>
          setIsVerified(d.isVerifiedPurchase || d.IsVerifiedPurchase),
        )
        .catch(() => { });
    }
  }, [token, frameId]);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormRating(5);
    setFormTitle("");
    setFormComment("");
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      const url = editingId ? `${API}/${editingId}` : API;
      const method = editingId ? "PUT" : "POST";
      const body = editingId
        ? { rating: formRating, title: formTitle, comment: formComment }
        : {
          frameId,
          rating: formRating,
          title: formTitle,
          comment: formComment,
        };

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(body),
      });
      if (res.ok) {
        resetForm();
        fetchReviews(1);
      } else {
        const err = await res.json();
        setFormError(err.message || err.Message || "Unable to submit review");
      }
    } catch {
      setFormError("Connection error");
    }
    setSubmitting(false);
  };

  const handleEdit = (review) => {
    setEditingId(review.reviewId || review.ReviewId);
    setFormRating(review.rating || review.Rating || 5);
    setFormTitle(review.title || review.Title || "");
    setFormComment(review.comment || review.Comment || "");
    setShowForm(true);
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    try {
      const res = await fetch(`${API}/${reviewId}`, {
        method: "DELETE",
        headers,
      });
      if (res.ok || res.status === 204) fetchReviews(page);
    } catch {
      /* ignore */
    }
  };

  const avg = summary?.averageRating ?? summary?.AverageRating ?? 0;
  const total = summary?.totalReviews ?? summary?.TotalReviews ?? 0;
  const dist = summary?.ratingDistribution ?? summary?.RatingDistribution ?? {};
  const currentUserId = user?.userId || user?.UserId;

  return (
    <div style={{ marginTop: "40px", padding: "0 10px" }}>
      <h3
        style={{
          fontSize: "20px",
          marginBottom: "16px",
          borderBottom: "2px solid #e5e7eb",
          paddingBottom: "10px",
        }}
      >
        Product Reviews
      </h3>

      {/* Summary */}
      {summary && (
        <div
          style={{
            display: "flex",
            gap: "30px",
            alignItems: "center",
            marginBottom: "20px",
            padding: "16px",
            backgroundColor: "#f9fafb",
            borderRadius: "10px",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{ fontSize: "36px", fontWeight: "bold", color: "#f59e0b" }}
            >
              {avg.toFixed(1)}
            </div>
            <StarRating rating={Math.round(avg)} />
            <div
              style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}
            >
              {total} Reviews
            </div>
          </div>
          <div style={{ flex: 1 }}>
            {[5, 4, 3, 2, 1].map((star) => {
              const count = dist[star] || 0;
              const pct = total > 0 ? (count / total) * 100 : 0;
              return (
                <div
                  key={star}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "4px",
                  }}
                >
                  <span
                    style={{
                      width: "20px",
                      fontSize: "13px",
                      textAlign: "right",
                    }}
                  >
                    {star}★
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: "8px",
                      backgroundColor: "#e5e7eb",
                      borderRadius: "4px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: "100%",
                        backgroundColor: "#f59e0b",
                        borderRadius: "4px",
                      }}
                    />
                  </div>
                  <span
                    style={{
                      width: "30px",
                      fontSize: "12px",
                      color: "#6b7280",
                    }}
                  >
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Write review button */}
      {token && !showForm && isVerified && (
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          style={{
            marginBottom: "16px",
            padding: "10px 20px",
            backgroundColor: "#3b82f6",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          Write a review (Verified Purchase)
        </button>
      )}
      {token && !showForm && !isVerified && (
        <div
          style={{
            marginBottom: "16px",
            padding: "12px 16px",
            backgroundColor: "#fef3c7",
            border: "1px solid #f59e0b",
            borderRadius: "8px",
            color: "#92400e",
            fontSize: "14px",
          }}
        >
          You need to purchase this product before you can write a review.
        </div>
      )}

      {/* Review form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          style={{
            marginBottom: "20px",
            padding: "20px",
            backgroundColor: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "10px",
          }}
        >
          <h4 style={{ marginTop: 0 }}>
            {editingId ? "Edit Review" : "Write a Review"}
          </h4>
          <div style={{ marginBottom: "12px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "4px",
                fontWeight: "600",
                fontSize: "14px",
              }}
            >
              Rating:
            </label>
            <StarRating
              rating={formRating}
              onRate={setFormRating}
              interactive
            />
          </div>
          <div style={{ marginBottom: "12px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "4px",
                fontWeight: "600",
                fontSize: "14px",
              }}
            >
              Title:
            </label>
            <input
              value={formTitle}
              placeholder="Give your review a title..."
              onChange={(e) => setFormTitle(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ marginBottom: "12px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "4px",
                fontWeight: "600",
                fontSize: "14px",
              }}
            >
              Comment:
            </label>
            <textarea
              value={formComment}
              placeholder="What did you like or dislike about the product?"
              onChange={(e) => setFormComment(e.target.value)}
              rows={3}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                resize: "vertical",
                boxSizing: "border-box",
              }}
            />
          </div>
          {formError && (
            <p style={{ color: "#dc2626", fontSize: "14px" }}>{formError}</p>
          )}
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "10px 20px",
                backgroundColor: "#10b981",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              {submitting
                ? "Submitting..."
                : editingId
                  ? "Update Review"
                  : "Submit Review"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              style={{
                padding: "10px 20px",
                backgroundColor: "#6b7280",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Review list */}
      {loading ? (
        <p style={{ color: "#6b7280" }}>Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p style={{ color: "#6b7280", fontStyle: "italic" }}>
          There are no reviews for this product yet.
        </p>
      ) : (
        <div>
          {reviews.map((r) => {
            const rid = r.reviewId || r.ReviewId;
            const uid = r.userId || r.UserId;
            const name =
              r.user?.fullName ||
              r.user?.userName ||
              r.User?.FullName ||
              "Anonymous";
            const rating = r.rating || r.Rating || 0;
            const title = r.title || r.Title || "";
            const comment = r.comment || r.Comment || "";
            const date = r.createdAt || r.CreatedAt;
            const isOwn = currentUserId && uid === currentUserId;

            return (
              <div
                key={rid}
                style={{ padding: "14px 0", borderBottom: "1px solid #f3f4f6" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <StarRating rating={rating} />
                    <span
                      style={{
                        marginLeft: "10px",
                        fontWeight: "600",
                        fontSize: "14px",
                      }}
                    >
                      {name}
                    </span>
                    <span
                      style={{
                        marginLeft: "8px",
                        fontSize: "12px",
                        color: "#9ca3af",
                      }}
                    >
                      {date ? new Date(date).toLocaleDateString("en-US") : ""}
                    </span>
                  </div>
                  {isOwn && (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => handleEdit(r)}
                        style={{
                          fontSize: "12px",
                          color: "#3b82f6",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(rid)}
                        style={{
                          fontSize: "12px",
                          color: "#ef4444",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
                {title && (
                  <p
                    style={{
                      fontWeight: "600",
                      margin: "6px 0 2px",
                      fontSize: "15px",
                    }}
                  >
                    {title}
                  </p>
                )}
                {comment && (
                  <p
                    style={{
                      margin: "2px 0 0",
                      color: "#374151",
                      fontSize: "14px",
                    }}
                  >
                    {comment}
                  </p>
                )}
              </div>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "8px",
                marginTop: "16px",
              }}
            >
              <button
                disabled={page <= 1}
                onClick={() => fetchReviews(page - 1)}
                style={{
                  padding: "6px 14px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  cursor: page > 1 ? "pointer" : "default",
                  backgroundColor: page > 1 ? "#fff" : "#f3f4f6",
                }}
              >
                ←
              </button>
              <span style={{ padding: "6px 10px", fontSize: "14px" }}>
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => fetchReviews(page + 1)}
                style={{
                  padding: "6px 14px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  cursor: page < totalPages ? "pointer" : "default",
                  backgroundColor: page < totalPages ? "#fff" : "#f3f4f6",
                }}
              >
                →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}