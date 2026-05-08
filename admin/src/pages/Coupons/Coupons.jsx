import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import PropTypes from "prop-types";
import "./Coupons.css";

const initialForm = {
  code: "",
  discountType: "percent",
  discountValue: "",
  expiryDate: "",
  usageLimit: "",
};

const Coupons = ({ url }) => {
  const [coupons, setCoupons] = useState([]);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(initialForm);

  const loadCoupons = useCallback(async () => {
    try {
      const response = await axios.get(`${url}/api/coupon/list`);
      if (response.data.success) {
        setCoupons(response.data.data);
      }
    } catch (error) {
      toast.error("Failed to load coupons");
    }
  }, [url]);

  const createCoupon = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post(`${url}/api/coupon/add`, {
        ...form,
        discountValue: Number(form.discountValue),
        usageLimit: Number(form.usageLimit || 0),
      });
      if (response.data.success) {
        toast.success(response.data.message);
        setForm(initialForm);
        loadCoupons();
      } else {
        toast.error(response.data.message || "Failed");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed");
    }
  };

  const toggleActive = async (coupon) => {
    try {
      const response = await axios.post(`${url}/api/coupon/update/${coupon._id}`, {
        ...coupon,
        isActive: !coupon.isActive,
      });
      if (response.data.success) {
        toast.success(response.data.message);
        loadCoupons();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed");
    }
  };

  const deleteCoupon = async (id) => {
    try {
      const response = await axios.post(`${url}/api/coupon/remove`, { id });
      if (response.data.success) {
        toast.success(response.data.message);
        loadCoupons();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed");
    }
  };

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) return coupons;
    return coupons.filter((c) => c.code.toLowerCase().includes(text));
  }, [coupons, query]);

  return (
    <div className="coupons add flex-col">
      <h3>Coupon / Promo Code</h3>

      <form className="coupon-form" onSubmit={createCoupon}>
        <input
          type="text"
          placeholder="Code (e.g. SAVE20)"
          value={form.code}
          onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
          required
        />
        <select
          value={form.discountType}
          onChange={(e) => setForm((p) => ({ ...p, discountType: e.target.value }))}
        >
          <option value="percent">% Off</option>
          <option value="flat">Flat Discount</option>
        </select>
        <input
          type="number"
          placeholder="Discount"
          value={form.discountValue}
          onChange={(e) => setForm((p) => ({ ...p, discountValue: e.target.value }))}
          required
        />
        <input
          type="date"
          value={form.expiryDate}
          onChange={(e) => setForm((p) => ({ ...p, expiryDate: e.target.value }))}
          required
        />
        <input
          type="number"
          placeholder="Usage limit"
          value={form.usageLimit}
          onChange={(e) => setForm((p) => ({ ...p, usageLimit: e.target.value }))}
        />
        <button type="submit">Create</button>
      </form>

      <input
        className="coupon-search"
        type="text"
        placeholder="Search coupon code"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="coupon-table">
        <div className="coupon-row coupon-title">
          <b>Code</b>
          <b>Discount</b>
          <b>Expiry</b>
          <b>Usage</b>
          <b>Status</b>
          <b>Actions</b>
        </div>
        {filtered.map((coupon) => (
          <div className="coupon-row" key={coupon._id}>
            <p>{coupon.code}</p>
            <p>{coupon.discountType === "percent" ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}</p>
            <p>{new Date(coupon.expiryDate).toLocaleDateString()}</p>
            <p>{coupon.usedCount}/{coupon.usageLimit || "∞"}</p>
            <p>{coupon.isActive ? "Active" : "Inactive"}</p>
            <div className="coupon-actions">
              <button type="button" onClick={() => toggleActive(coupon)}>{coupon.isActive ? "Disable" : "Enable"}</button>
              <button type="button" className="danger" onClick={() => deleteCoupon(coupon._id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

Coupons.propTypes = {
  url: PropTypes.string.isRequired,
};

export default Coupons;
