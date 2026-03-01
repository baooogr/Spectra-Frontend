import React, { useState } from "react";
import ProfilePage from "./pages/ProfilePage";
import Modal from "./components/ui/Modal";

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <ProfilePage />

      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <button onClick={() => setIsModalOpen(true)}>
          Create Prescription
        </button>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}

export default App;