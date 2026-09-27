import React from "react";
import { getCategoryDetails } from "../utils/driveClassifier.js";

var CATEGORY_KEYS = ["all", "sql", "fullstack", "dsa", "interview", "python", "core_cs", "other_files", "starred"];

export function CategoryFilter(props) {
  var activeCategory = props.activeCategory;
  var onSelectCategory = props.onSelectCategory;
  var counts = props.counts || {};

  function renderCategoryButton(catKey) {
    var isStarred = catKey === "starred";
    var meta = isStarred
      ? {
          name: "Starred Notes",
          icon: "⭐",
          color: "#eab308"
        }
      : getCategoryDetails(catKey);

    var count = counts[catKey] || 0;
    var isActive = activeCategory === catKey;

    function handleClick() {
      onSelectCategory(catKey);
    }

    return (
      <button
        key={catKey}
        type="button"
        className={"category-tab" + (isActive ? " active" : "")}
        onClick={handleClick}
        style={{
          "--tab-accent": meta.color
        }}
      >
        <span className="tab-icon">{meta.icon}</span>
        <span className="tab-name">{meta.name}</span>
        <span className="tab-count">{count}</span>
      </button>
    );
  }

  return (
    <nav className="category-filter-nav" aria-label="Categories">
      <div className="category-scroll-container">
        {CATEGORY_KEYS.map(function(key) {
          return renderCategoryButton(key);
        })}
      </div>
    </nav>
  );
}
