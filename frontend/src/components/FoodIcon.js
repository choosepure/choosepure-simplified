const FoodIcon = ({ type, size = "text-4xl" }) => {
  const icons = {
    milk: "🥛",
    bread: "🍞", 
    honey: "🍯",
    spices: "🌶️",
    paneer: "🧀",
    flour: "🌾",
    oil: "🫒",
    rice: "🍚",
    dal: "🫘",
    vegetables: "🥬",
    fruits: "🍎",
    snacks: "🍪",
    beverages: "🧃",
    cereals: "🥣",
    default: "🧪"
  };

  return (
    <span className={size} role="img" aria-label={type}>
      {icons[type] || icons.default}
    </span>
  );
};

export default FoodIcon;