import React, { useState } from "react";

function ImageGallery({ images }) {
  const [activeImage, setActiveImage] = useState(images[0]);

  return (
    <div style={{ width: "560px" }}>

      <div
        style={{
          border: "1px solid #eee",
          padding: "10px",
          marginBottom: "14px",
        }}
      >
        <img
          src={activeImage}
          alt="main"
          style={{
            width: "100%",
            height: "300px",
            objectFit: "contain",
          }}
        />
      </div>


      <div style={{ display: "flex", gap: "16px" }}>
        {images.map((img, index) => (
          <div
            key={index}
            onClick={() => setActiveImage(img)}
            style={{
              width: "140px",           
              aspectRatio: "16 / 6",    
              border:
                activeImage === img
                  ? "2px solid blue"
                  : "1px solid #ccc",
              cursor: "pointer",
              padding: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              src={img}
              alt="thumb"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default ImageGallery;
