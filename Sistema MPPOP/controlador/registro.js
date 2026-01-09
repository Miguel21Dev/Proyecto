document.addEventListener("DOMContentLoaded", function () {
  const registerForm = document.getElementById("registerForm");
  const submitBtn = document.getElementById("submitBtn");
  const btnText = document.getElementById("btnText");
  const loader = document.getElementById("loader");
  const messageDiv = document.getElementById("message");
  const userInfoDiv = document.getElementById("userInfo");
  const generatedUsername = document.getElementById("generatedUsername");

  registerForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    submitBtn.disabled = true;
    btnText.style.display = "none";
    loader.style.display = "block";

    const formData = {
      name: document.getElementById("name").value.trim(),
      cedula: document.getElementById("cedula").value.trim(),
      authCode: document.getElementById("authCode").value.trim(),
    };

    try {
      const response = await fetch("/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        generatedUsername.textContent = result.username;
        userInfoDiv.style.display = "block";
        registerForm.reset();
        showMessage("", "success");
      } else {
        showMessage(result.error, "error");
        userInfoDiv.style.display = "none";
      }
    } catch (error) {
      console.error("Error:", error);
      showMessage("Error de conexión con el servidor", "error");
      userInfoDiv.style.display = "none";
    } finally {
      submitBtn.disabled = false;
      btnText.style.display = "block";
      loader.style.display = "none";
    }
  });

  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = "message " + type;
    messageDiv.style.display = text ? "block" : "none";

    if (type === "error") {
      setTimeout(() => {
        messageDiv.style.display = "none";
      }, 5000);
    }
  }
});
