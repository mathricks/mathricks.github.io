(() => {
  "use strict";

  const MAX_RECORDING_BYTES = 5 * 1024 * 1024;
  const ALLOWED_REASONS = new Set(["silent", "mispronounced"]);
  const ALLOWED_ORIGINS = new Set(["system", "bundled", "downloaded"]);
  const ALLOWED_TYPES = new Set([
    "audio/mp4", "audio/x-m4a", "audio/webm", "audio/ogg", "audio/wav", "audio/x-wav"
  ]);
  const form = document.getElementById("audio-request-form");
  const wordInput = document.getElementById("audio-word");
  const languageInput = document.getElementById("audio-language");
  const localeInput = document.getElementById("audio-locale");
  const originInput = document.getElementById("audio-origin");
  const recordingInput = document.getElementById("audio-recording");
  const emailInput = document.getElementById("audio-email");
  const consentInput = document.getElementById("recording-consent");
  const submitButton = document.getElementById("audio-submit");
  const status = document.getElementById("audio-status");
  if (!form || !wordInput || !languageInput || !localeInput || !originInput
      || !recordingInput || !emailInput || !consentInput || !submitButton || !status) return;

  const query = new URLSearchParams(window.location.search);
  const bounded = (value, length) => Array.from((value || "").trim()).slice(0, length).join("");
  const source = query.get("source") === "app" ? "app" : "web";

  const applyContext = () => {
    wordInput.value = bounded(query.get("word"), 80);
    languageInput.value = bounded(query.get("language"), 80);
    localeInput.value = bounded(query.get("locale"), 35);
    const origin = query.get("origin") || "";
    originInput.value = ALLOWED_ORIGINS.has(origin) ? origin : "";
    const reason = query.get("reason") || "";
    if (ALLOWED_REASONS.has(reason)) {
      const radio = form.querySelector(`input[name="reason"][value="${reason}"]`);
      if (radio) radio.checked = true;
    }
  };

  const setStatus = (message, state = "") => {
    status.textContent = message;
    status.dataset.state = state;
  };

  const resetChallenge = () => {
    if (window.turnstile && typeof window.turnstile.reset === "function") {
      window.turnstile.reset();
    }
  };

  const selectedRecording = () => recordingInput.files && recordingInput.files[0];

  const syncRecordingRequirements = () => {
    const required = Boolean(selectedRecording());
    emailInput.required = required;
    consentInput.required = required;
    if (!required) {
      recordingInput.setCustomValidity("");
      return;
    }
    const file = selectedRecording();
    if (file.size > MAX_RECORDING_BYTES) {
      recordingInput.setCustomValidity("Choose a recording no larger than 5 MB.");
    } else if (!ALLOWED_TYPES.has(file.type.toLowerCase())) {
      recordingInput.setCustomValidity("Choose an M4A, WebM, Ogg, or WAV recording.");
    } else {
      recordingInput.setCustomValidity("");
    }
  };

  recordingInput.addEventListener("change", syncRecordingRequirements);
  applyContext();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    syncRecordingRequirements();
    if (!form.reportValidity()) return;

    const formData = new FormData(form);
    const turnstileToken = formData.get("cf-turnstile-response");
    if (typeof turnstileToken !== "string" || !turnstileToken) {
      setStatus("Please complete the security check.", "error");
      return;
    }

    formData.delete("cf-turnstile-response");
    formData.set("turnstileToken", turnstileToken);
    formData.set("source", source);

    submitButton.disabled = true;
    submitButton.textContent = "Sending…";
    setStatus(selectedRecording() ? "Uploading your report securely…" : "Sending your report…");

    try {
      const response = await fetch("/api/world-of-words/request-audio", {
        method: "POST",
        credentials: "omit",
        redirect: "error",
        headers: { "X-Turnstile-Token": turnstileToken },
        body: formData
      });

      if (response.ok) {
        setStatus("Thanks — your audio report is on our private review list.", "success");
        form.reset();
        applyContext();
        syncRecordingRequirements();
        resetChallenge();
        return;
      }

      if (response.status === 429) {
        setStatus("Please wait at least 10 seconds before sending another report.", "error");
      } else if (response.status === 403) {
        setStatus("The security check expired or could not be verified. Please try it again.", "error");
      } else if (response.status === 413) {
        setStatus("That upload is too large. Choose a recording no larger than 5 MB.", "error");
      } else if (response.status === 400 || response.status === 415) {
        setStatus("Please check the report fields and recording format, then try again.", "error");
      } else {
        setStatus("We could not save the report just now. Please try again shortly.", "error");
      }
      resetChallenge();
    } catch {
      setStatus("We could not reach the report service. Check your connection and try again.", "error");
      resetChallenge();
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Send audio report";
    }
  });
})();
