import React from "react";

export function Toast(props) {
  var message = props.message;
  var type = props.type || "info";
  var onClose = props.onClose;

  React.useEffect(function() {
    if (!message) {
      return;
    }
    var timer = setTimeout(function() {
      if (onClose) {
        onClose();
      }
    }, 3200);

    return function() {
      clearTimeout(timer);
    };
  }, [message, onClose]);

  if (!message) {
    return null;
  }

  var icon = "ℹ️";
  if (type === "success") {
    icon = "✅";
  } else if (type === "error") {
    icon = "⚠️";
  }

  return (
    <div className={"toast toast-" + type}>
      <span className="toast-icon">{icon}</span>
      <span className="toast-message">{message}</span>
      <button type="button" className="toast-close" onClick={onClose}>
        ×
      </button>
    </div>
  );
}
