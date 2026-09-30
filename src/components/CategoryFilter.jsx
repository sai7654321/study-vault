import React from "react";
import { getCategoryDetails } from "../utils/driveClassifier.js";

var CATEGORY_KEYS = [
  "all",
  "sql",
  "java",
  "fullstack",
  "dsa",
  "interview",
  "python",
  "core_cs",
  "other_files"
];

export function CategoryFilter(props) {
  var activeCategory = props.activeCategory;
  var onSelectCategory = props.onSelectCategory;
  var counts = props.counts || {};

  var isStarredActive = activeCategory === "starred";
  var starredCount = counts.starred || 0;

  function handleStarredClick() {
    if (isStarredActive) {
      onSelectCategory("all");
    } else {
      onSelectCategory("starred");
    }
  }

  function renderCategoryButton(catKey) {
    var meta = getCategoryDetails(catKey);
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
      <div className="category-filter-container">
        {/* Separated Quick-Access Starred Notes Tab with Rich Animations */}
        <div className="starred-tab-wrapper">
          <button
            type="button"
            className={"starred-quick-tab" + (isStarredActive ? " active" : "")}
            onClick={handleStarredClick}
            title={isStarredActive ? "Show All Notes" : "View your Starred Favorite Notes"}
            aria-pressed={isStarredActive}
          >
            <span className="starred-halo" aria-hidden="true"></span>
            <span className="starred-star-icon" aria-hidden="true">⭐</span>
            <span className="starred-tab-name">Starred Notes</span>
            <span className="starred-tab-count">{starredCount}</span>
            <span className="starred-sheen" aria-hidden="true"></span>
          </button>
          <div className="starred-nav-divider" aria-hidden="true"></div>
        </div>

        {/* Scrollable Subject Categories */}
        <div className="category-scroll-container">
          {CATEGORY_KEYS.map(function(key) {
            return renderCategoryButton(key);
          })}
        </div>
      </div>
    </nav>
  );
}
