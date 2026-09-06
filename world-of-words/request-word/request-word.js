(() => {
  "use strict";

  const form = document.getElementById("word-request-form");
  const wordInput = document.getElementById("requested-word");
  const submitButton = document.getElementById("request-submit");
  const status = document.getElementById("request-status");
  if (!form || !wordInput || !submitButton || !status) return;

  const query = new URLSearchParams(window.location.search);
  const requestedWord = (query.get("word") || "").trim().slice(0, 80);
  const source = query.get("source") === "app" ? "app" : "web";
  if (requestedWord) wordInput.value = requestedWord;

  const setStatus = (message, state = "") => {
    status.textContent = message;
    status.dataset.state = state;
  };

  const resetChallenge = () => {
    if (window.turnstile && typeof window.turnstile.reset === "function") {
      window.turnstile.reset();
    }
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const formData = new FormData(form);
    const turnstileToken = formData.get("cf-turnstile-response");
    if (typeof turnstileToken !== "string" || !turnstileToken) {
      setStatus("Please complete the security check.", "error");
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Sending…";
    setStatus("Sending your request…");

    try {
      const response = await fetch("/api/world-of-words/word-requests", {
        method: "POST",
        credentials: "omit",
        redirect: "error",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word: formData.get("word"),
          details: formData.get("details"),
          email: formData.get("email"),
          website: formData.get("website"),
          source,
          turnstileToken
        })
      });

      if (response.ok) {
        const submittedWord = String(formData.get("word") || "").trim();
        setStatus(`Thanks — “${submittedWord}” is on our review list.`, "success");
        form.reset();
        wordInput.focus();
        resetChallenge();
        return;
      }

      if (response.status === 429) {
        setStatus("That is a few requests at once. Please wait a minute and try again.", "error");
      } else if (response.status === 403) {
        setStatus("The security check expired or could not be verified. Please try it again.", "error");
      } else if (response.status === 400 || response.status === 413 || response.status === 415) {
        setStatus("Please check the word and optional details, then try again.", "error");
      } else {
        setStatus("We could not save the request just now. Please try again shortly.", "error");
      }
      resetChallenge();
    } catch {
      setStatus("We could not reach the request service. Check your connection and try again.", "error");
      resetChallenge();
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Request this word";
    }
  });
})();
