import React, { useState, useRef } from "react";
import "./ProfilePage.css";

const ProfilePage = () => {
  const [avatar, setAvatar] = useState("https://i.pravatar.cc/150");
  const fileInputRef = useRef(null);

  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setAvatar(imageUrl);
    }
  };

  return (
    <div className="profile-container">
      <h2 className="profile-title">My Profile</h2>

      <div className="profile-card">
        <div className="avatar-section">
          <img
            src={avatar}
            alt="avatar"
            className="avatar"
          />

          <button
            type="button"
            className="btn-secondary"
            onClick={handleAvatarClick}
          >
            Change Avatar
          </button>

          {/* Hidden input */}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleAvatarChange}
            style={{ display: "none" }}
          />
        </div>

        <form className="profile-form">
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" placeholder="Enter your full name" />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input type="email" placeholder="Enter your email" />
          </div>

          <div className="form-group">
            <label>Phone</label>
            <input type="text" placeholder="Enter your phone number" />
          </div>

          <div className="form-group">
            <label>Address</label>
            <input type="text" placeholder="Enter your address" />
          </div>

          <button type="submit" className="btn-primary">
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;