import React from "react";

export function AdminLoginModal(props) {
  var isOpen = props.isOpen;
  var onClose = props.onClose;
  var onLoginSuccess = props.onLoginSuccess;

  var [password, setPassword] = React.useState("");
  var [isLoading, setIsLoading] = React.useState(false);
  var [errorMessage, setErrorMessage] = React.useState("");
  var [showPassword, setShowPassword] = React.useState(false);

  // Close on Escape
  React.useEffect(function() {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return function() {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  function verifyGoogleCredential(idToken) {
    setIsLoading(true);
    setErrorMessage("");

    fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: idToken })
    })
      .then(function(res) {
        return res.json().then(function(data) {
          return { status: res.status, data: data };
        });
      })
      .then(function(result) {
        setIsLoading(false);
        if (result.status === 200 && result.data.success) {
          onLoginSuccess(result.data.user, result.data.token);
          onClose();
        } else {
          setErrorMessage(result.data.error || "Login failed. You are not authorized as administrator.");
        }
      })
      .catch(function(err) {
        setIsLoading(false);
        setErrorMessage("Network error during login: " + err.message);
      });
  }

  // Google Sign-In initialization if Client ID is configured
  React.useEffect(function() {
    var googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!isOpen || !googleClientId) {
      return;
    }

    function handleGoogleCallback(response) {
      if (response && response.credential) {
        verifyGoogleCredential(response.credential);
      }
    }

    function initGoogleButton() {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCallback
        });

        var btnContainer = document.getElementById("google-signin-btn-container");
        if (btnContainer) {
          window.google.accounts.id.renderButton(btnContainer, {
            theme: "outline",
            size: "large",
            width: 280,
            text: "signin_with"
          });
        }
      }
    }

    if (!window.google) {
      var script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initGoogleButton;
      document.head.appendChild(script);
    } else {
      initGoogleButton();
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  function handlePasswordSubmit(event) {
    event.preventDefault();
    if (!password.trim()) {
      setErrorMessage("Please enter the admin password.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: password })
    })
      .then(function(res) {
        return res.json().then(function(data) {
          return { status: res.status, data: data };
        });
      })
      .then(function(result) {
        setIsLoading(false);
        if (result.status === 200 && result.data.success) {
          onLoginSuccess(result.data.user, result.data.token);
          setPassword("");
          onClose();
        } else {
          setErrorMessage(result.data.error || "Invalid password or unauthorized account.");
        }
      })
      .catch(function(err) {
        setIsLoading(false);
        setErrorMessage("Network error during login: " + err.message);
      });
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content login-modal"
        onClick={function(e) {
          e.stopPropagation();
        }}
      >
        <div className="modal-header">
          <div className="modal-title-group">
            <img src="/logo.png" alt="StudyVault" className="modal-logo-img" />
            <div>
              <h3 className="modal-title">Admin Authentication</h3>
              <p className="modal-subtitle">
                Restricted to the verified StudyVault owner account
              </p>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            title="Close"
          >
            ✕
          </button>
        </div>

        <div className="modal-body login-body">
          {errorMessage ? (
            <div className="login-error-banner">
              <span className="error-icon">⚠️</span>
              <span className="error-text">{errorMessage}</span>
            </div>
          ) : null}

          <div className="login-instructions">
            <p>
              Sign in with your configured <strong>Admin Google Account</strong> or master password to manage notes, upload PDFs to Google Drive, and edit materials.
            </p>
          </div>

          <div id="google-signin-btn-container" className="google-btn-wrapper"></div>

          <div className="login-divider">
            <span>or admin password</span>
          </div>

          <form onSubmit={handlePasswordSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="admin-pass" className="form-label">
                Admin Master Password
              </label>
              <div className="password-input-wrapper">
                <input
                  id="admin-pass"
                  type={showPassword ? "text" : "password"}
                  className="form-input"
                  placeholder="Enter administrator password..."
                  value={password}
                  onChange={function(e) {
                    setPassword(e.target.value);
                  }}
                  disabled={isLoading}
                  autoFocus
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={function() {
                    setShowPassword(!showPassword);
                  }}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div className="login-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary login-submit-btn"
                disabled={isLoading}
              >
                {isLoading ? "Authenticating..." : "Sign In as Admin"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
