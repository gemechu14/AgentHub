/**
 * AgentHub Chatbot Embed Script
 *
 * Usage:
 *   <script src="https://your-domain.com/embed.js" data-token="YOUR_TOKEN_HERE"></script>
 *
 * Or with custom position:
 *   <script
 *     src="https://your-domain.com/embed.js"
 *     data-token="YOUR_TOKEN_HERE"
 *     data-position="bottom-right"
 *   ></script>
 */
(function () {
  "use strict";

  // Find the current script tag to read data attributes
  var scripts = document.getElementsByTagName("script");
  var currentScript = scripts[scripts.length - 1];
  var token = currentScript.getAttribute("data-token");
  var position = currentScript.getAttribute("data-position") || "bottom-right";

  if (!token) {
    console.error("[AgentHub] Missing data-token attribute on embed script.");
    return;
  }

  // Derive the base URL from the script src
  var scriptSrc = currentScript.getAttribute("src");
  var baseUrl = "";
  if (scriptSrc) {
    try {
      var url = new URL(scriptSrc, window.location.href);
      baseUrl = url.origin;
    } catch (e) {
      // Fallback: use current origin
      baseUrl = window.location.origin;
    }
  } else {
    baseUrl = window.location.origin;
  }

  var WIDGET_URL = baseUrl + "/embed/widget?token=" + encodeURIComponent(token);

  // Button size and chat popup size
  var BUTTON_SIZE = 60;
  var CHAT_WIDTH = 400;
  var CHAT_HEIGHT = 600;
  var MARGIN = 20;

  // Position styles
  var positionStyles = {
    "bottom-right": {
      bottom: MARGIN + "px",
      right: MARGIN + "px",
      top: "auto",
      left: "auto",
    },
    "bottom-left": {
      bottom: MARGIN + "px",
      left: MARGIN + "px",
      top: "auto",
      right: "auto",
    },
  };
  var pos = positionStyles[position] || positionStyles["bottom-right"];

  // Create the container
  var container = document.createElement("div");
  container.id = "agenthub-chatbot-container";
  container.style.cssText =
    "position:fixed;z-index:2147483647;" +
    "bottom:" + pos.bottom + ";" +
    "right:" + (pos.right || "auto") + ";" +
    "left:" + (pos.left || "auto") + ";" +
    "top:" + (pos.top || "auto") + ";" +
    "width:" + BUTTON_SIZE + "px;" +
    "height:" + BUTTON_SIZE + "px;" +
    "transition:width 0.3s ease,height 0.3s ease,border-radius 0.3s ease,box-shadow 0.3s ease;" +
    "border-radius:50%;" +
    "overflow:hidden;" +
    "box-shadow:0 4px 12px rgba(0,0,0,0.15);";

  // Create the iframe
  var iframe = document.createElement("iframe");
  iframe.id = "agenthub-chatbot-iframe";
  iframe.src = WIDGET_URL;
  iframe.allow = "clipboard-read; clipboard-write";
  iframe.setAttribute("allowtransparency", "true");
  iframe.style.cssText =
    "width:100%;" +
    "height:100%;" +
    "border:none;" +
    "background:transparent;" +
    "color-scheme:none;";

  container.appendChild(iframe);
  document.body.appendChild(container);

  var isOpen = false;

  // Listen for messages from the widget iframe
  window.addEventListener("message", function (event) {
    // Only accept messages from our iframe
    if (!event.data || typeof event.data !== "object") return;
    if (event.data.source !== "agenthub-chatbot") return;

    if (event.data.type === "chatbot-open") {
      isOpen = true;
      container.style.width = CHAT_WIDTH + "px";
      container.style.height = CHAT_HEIGHT + "px";
      container.style.borderRadius = "16px";
      container.style.boxShadow = "0 8px 32px rgba(0,0,0,0.2)";
    } else if (event.data.type === "chatbot-close") {
      isOpen = false;
      container.style.width = BUTTON_SIZE + "px";
      container.style.height = BUTTON_SIZE + "px";
      container.style.borderRadius = "50%";
      container.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
    }
  });
})();

