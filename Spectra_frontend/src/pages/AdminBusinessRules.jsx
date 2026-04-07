import React, { useState, useEffect } from "react";
import { API_BASE_URL, ENDPOINTS } from "../api/config";
import { authFetcher, putData } from "../api/fetcher";
import "./AdminBusinessRules.css";

const CATEGORY_LABELS = {
  shipping: "Shipping",
  complaint: "Complaint",
  exchange_rate: "Exchange Rate",
};

export default function AdminBusinessRules() {
  const [rules, setRules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [saving, setSaving] = useState({});
  const [saved, setSaved] = useState({});

  const fetchRules = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url = `${API_BASE_URL}${ENDPOINTS.BUSINESS_RULES.LIST}`;
      const data = await authFetcher(url);
      setRules(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Unable to load the list of rules.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  // Group rules by category
  const grouped = rules.reduce((acc, rule) => {
    const cat = rule.category || "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(rule);
    return acc;
  }, {});

  const handleValueChange = (ruleKey, value) => {
    setEditValues((prev) => ({ ...prev, [ruleKey]: value }));
  };

  const handleSave = async (rule) => {
    const newValue = editValues[rule.ruleKey];
    if (newValue === undefined || newValue === rule.ruleValue) return;

    setSaving((prev) => ({ ...prev, [rule.ruleKey]: true }));
    try {
      await putData(ENDPOINTS.BUSINESS_RULES.DETAIL(rule.ruleKey), {
        value: String(newValue),
      });
      // Update local state
      setRules((prev) =>
        prev.map((r) =>
          r.ruleKey === rule.ruleKey
            ? { ...r, ruleValue: String(newValue) }
            : r,
        ),
      );
      setEditValues((prev) => {
        const next = { ...prev };
        delete next[rule.ruleKey];
        return next;
      });
      setSaved((prev) => ({ ...prev, [rule.ruleKey]: true }));
      setTimeout(() => {
        setSaved((prev) => ({ ...prev, [rule.ruleKey]: false }));
      }, 2000);
    } catch (err) {
      alert(`Error while saving: ${err.message}`);
    } finally {
      setSaving((prev) => ({ ...prev, [rule.ruleKey]: false }));
    }
  };

  if (isLoading) {
    return <div className="rules-loading">Loading business rules...</div>;
  }

  if (error) {
    return <div className="rules-error">{error}</div>;
  }

  return (
    <div className="admin-rules-container">
      <div className="admin-rules-header">
        <h2 className="admin-rules-title">Business Rules Management</h2>
      </div>

      <div
        style={{ maxHeight: "70vh", overflowY: "auto", paddingRight: "4px" }}
      >
        {Object.entries(grouped).map(([category, categoryRules]) => (
          <div key={category} className="rules-category-section">
            <h3 className="rules-category-title">
              {CATEGORY_LABELS[category] || category}
            </h3>
            <div className="table-container">
              <table className="rules-table">
                <thead>
                  <tr>
                    <th>Rule Code</th>
                    <th>Description</th>
                    <th>Value</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {categoryRules.map((rule) => {
                    const currentValue =
                      editValues[rule.ruleKey] !== undefined
                        ? editValues[rule.ruleKey]
                        : rule.ruleValue;
                    const isDirty =
                      editValues[rule.ruleKey] !== undefined &&
                      editValues[rule.ruleKey] !== rule.ruleValue;

                    return (
                      <tr key={rule.ruleKey}>
                        <td className="rule-key">{rule.ruleKey}</td>
                        <td className="rule-desc">{rule.description || "—"}</td>
                        <td>
                          <input
                            className="rule-input"
                            type="text"
                            value={currentValue}
                            onChange={(e) =>
                              handleValueChange(rule.ruleKey, e.target.value)
                            }
                          />
                        </td>
                        <td>
                          <button
                            className="btn-save-rule"
                            disabled={!isDirty || saving[rule.ruleKey]}
                            onClick={() => handleSave(rule)}
                          >
                            {saving[rule.ruleKey] ? "..." : "Save"}
                          </button>
                          {saved[rule.ruleKey] && (
                            <span className="rules-success">✓ Saved</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}