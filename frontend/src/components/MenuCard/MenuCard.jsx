import { useContext } from "react";
import PropTypes from "prop-types";
import { StoreContext } from "../context/StoreContext";

const MenuCard = ({ item }) => {
  const { cartItems, addToCart, removeFromCart } = useContext(StoreContext);
  const quantity = cartItems[item._id] || 0;

  return (
    <article className="menu-card">
      <div className="menu-card-media">
        <img src={item.image} alt={item.name} className="menu-card-image" />
        <span className={`menu-card-badge ${item.isVeg ? "veg" : "non-veg"}`}>
          {item.isVeg ? "Veg" : "Non-Veg"}
        </span>
      </div>

      <div className="menu-card-body">
        <div className="menu-card-header">
          <div>
            <p className="menu-card-category">{item.category}</p>
            <h3>{item.name}</h3>
          </div>
          <div className="menu-card-rating">
            <span>★</span>
            <strong>{item.rating.toFixed(1)}</strong>
          </div>
        </div>

        <p className="menu-card-description">{item.description}</p>

        <div className="menu-card-footer">
          <div className="menu-card-price">Rs. {Number(item.price).toLocaleString()}</div>

          {quantity > 0 ? (
            <div className="menu-card-counter">
              <button type="button" onClick={() => removeFromCart(item._id)}>
                -
              </button>
              <span>{quantity}</span>
              <button type="button" onClick={() => addToCart(item._id)}>
                +
              </button>
            </div>
          ) : (
            <button type="button" className="menu-card-add" onClick={() => addToCart(item._id)}>
              Add to Cart
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

MenuCard.propTypes = {
  item: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    image: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    rating: PropTypes.number.isRequired,
    category: PropTypes.string.isRequired,
    isVeg: PropTypes.bool.isRequired,
    description: PropTypes.string.isRequired,
  }).isRequired,
};

export default MenuCard;
