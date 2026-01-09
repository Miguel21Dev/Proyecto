document.addEventListener("DOMContentLoaded", function () {
  const registerForm = document.getElementById("registerForm");
  if (!registerForm) return;

  const submitBtn = document.getElementById("submitBtn");
  const btnText = document.getElementById("btnText");
  const loader = document.getElementById("loader");
  const messageDiv = document.getElementById("message");
  const userInfoDiv = document.getElementById("userInfo");
  const generatedUsername = document.getElementById("generatedUsername");

  registerForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (submitBtn) submitBtn.disabled = true;
    if (btnText) btnText.style.display = "none";
    if (loader) loader.style.display = "block";

    const formData = {
      name: document.getElementById("name").value.trim(),
      cedula: document.getElementById("cedula").value.trim(),
      authCode: document.getElementById("authCode").value.trim(),
    };

    try {
      const res = await fetch("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await res.json();

      if (res.ok) {
        if (generatedUsername) generatedUsername.textContent = result.username;
        // Mostrar el bloque de preview si existe
        const preview = document.getElementById("username-preview");
        if (preview) preview.style.display = "block";
        // Antes se mostraba una alerta con el username; ahora no se muestra.
        if (userInfoDiv) userInfoDiv.style.display = "block";
        registerForm.reset();
        showMessage("Registro exitoso", "success");
      } else {
        showMessage(result.error || "Error en registro", "error");
        if (userInfoDiv) userInfoDiv.style.display = "none";
      }
    } catch (err) {
      console.error(err);
      showMessage("No se pudo conectar con el servidor", "error");
    } finally {
      if (submitBtn) submitBtn.disabled = false;
      if (btnText) btnText.style.display = "block";
      if (loader) loader.style.display = "none";
    }
  });

  function showMessage(text, type) {
    if (!messageDiv) {
      if (text) alert(text);
      return;
    }
    messageDiv.textContent = text;
    messageDiv.className = "message " + type;
    messageDiv.style.display = text ? "block" : "none";
    if (type === "error") setTimeout(() => (messageDiv.style.display = "none"), 5000);
  }
});