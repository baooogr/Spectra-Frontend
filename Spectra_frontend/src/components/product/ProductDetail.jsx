import { useState } from "react";
import { useParams } from "react-router-dom";

import ImageGallery from "./ImageGallery";
import Section from "./Section";
import Tabs from "./Tabs";
import TabButton from "./TabButton";

import productList from "./data/ProductList";

export default function ProductDetail() {
  const { id } = useParams();
  const product = productList.find((p) => p.id === id);

  const [quantity, setQuantity] = useState(1);
  const [selectedTab, setSelectedTab] = useState("fit");

  if (!product) return <p>Không tìm thấy sản phẩm</p>;

  const tabContent = product.detail[selectedTab];

  return (
    <>
      <div
        style={{
          maxWidth: 1100,
          margin: "40px auto",
          display: "flex",
          gap: 60,
        }}
      >
        <ImageGallery images={product.image} />

        <div style={{ flex: 1 }}>
          <h2 style={{ marginBottom: 6 }}>
            {product.name}
          </h2>

          <p style={{ margin: "10px 0 4px", color: "#666" }}>
            Starting at
          </p>

          <p
            style={{
              fontSize: 36,
              fontWeight: "bold",
              margin: "0 0 16px",
            }}
          >
            ${product.price}
          </p>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              backgroundColor: "#FFF3CD",
              padding: "6px 12px",
              borderRadius: 20,
              fontSize: 14,
              marginBottom: 24,
            }}
          >
            ⭐ {product.rating}
            <span style={{ fontWeight: 500 }}>
              {product.reviews} reviews
            </span>
          </div>

          <div style={{ margin: "20px 0" }}>
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>
              -
            </button>
            <span style={{ margin: "0 12px" }}>{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)}>+</button>
          </div>

          <button
            style={{
              padding: "10px 18px",
              border: "1px solid #333",
              background: "white",
              cursor: "pointer",
            }}
          >
            Thêm vào giỏ hàng
          </button>
        </div>
      </div>

      <div className="product-detail-under-image">
        <Section title="Product Detail">
          <Tabs
            button={
              <>
                <TabButton
                  isSelected={selectedTab === "fit"}
                  onClick={() => setSelectedTab("fit")}
                >
                  Fit & Size
                </TabButton>

                <TabButton
                  isSelected={selectedTab === "features"}
                  onClick={() => setSelectedTab("features")}
                >
                  Features
                </TabButton>

                <TabButton
                  isSelected={selectedTab === "description"}
                  onClick={() => setSelectedTab("description")}
                >
                  Description
                </TabButton>
              </>
            }
          >

            {selectedTab === "fit" && (
              <div className="fit-3col-layout">
                <div className="fit-col">
                  <h3>Prescription requirements</h3>
                  <ul className="fit-list">
                    {tabContent.prescription.map((item, index) => (
                      <li key={index}>
                        <span className="label">{item.split(":")[0]}</span>
                        <span className="value">{item.split(":")[1]}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="fit-col">
                  <h3>Frame Size</h3>
                  <ul className="fit-list">
                    {tabContent.frameSize.map((item, index) => (
                      <li key={index}>
                        <span className="label">{item.split(":")[0]}</span>
                        <span className="value">{item.split(":")[1]}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="fit-image">
                  <img src={tabContent.image} alt="Frame measurements" />
                </div>
              </div>
            )}

            {selectedTab === "features" && (
              <div className="fit-3col-layout">
                <div className="fit-col">
                  <h3>Frame Design</h3>
                  <ul className="fit-list">
                    {tabContent.frameDesign.map((item, index) => (
                      <li key={index}>
                        <span className="label">{item.split(":")[0]}</span>
                        <span className="value">{item.split(":")[1]}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="fit-col">
                  <h3>Lens Compatibility</h3>
                  <ul className="fit-list">
                    {tabContent.lensCompatibility.map((item, index) => (
                      <li key={index}>
                        <span className="label">{item.split(":")[0]}</span>
                        <span className="value">{item.split(":")[1]}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="fit-col">
                  <h3>What makes it special</h3>
                  <ul className="special-list">
                    {tabContent.whatMakesItSpecial.map((item, index) => (
                      <li key={index} className="special-item">
                        <strong>{item.title}</strong>
                        <p>{item.desc}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {selectedTab === "description" && (
              <div className="description-section">
                <div className="description-text">
                  <p>{tabContent}</p>
                </div>

                <div className="description-image">
                  <img src={product.image[0]} alt={product.name} />
                </div>
              </div>
            )}
          </Tabs>
        </Section>
      </div>
    </>
  );
}
